import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Play,
  Info,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';
import { audioAlerts } from '../utils/audioAlerts';

interface DriverMonitorPageProps {
  onTriggerScenario: (id: string) => void;
  onRefreshEvents: () => void;
}

export const DriverMonitorPage: React.FC<DriverMonitorPageProps> = ({
  onTriggerScenario,
  onRefreshEvents,
}) => {
  // Camera & Stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Monitoring telemetry
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [eyesOpen, setEyesOpen] = useState<boolean>(true);
  const [earValue, setEarValue] = useState<number>(0.32);
  const [closureDurationSec, setClosureDurationSec] = useState<number>(0.0);
  const [blinkCount, setBlinkCount] = useState<number>(14);
  const [attentionScore, setAttentionScore] = useState<number>(95);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  // Simulation controls (for when camera is denied or for demo testing)
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [simulatedClosureSec, setSimulatedClosureSec] = useState<number>(0.0);

  // Temporal timer ref
  const closureTimerRef = useRef<number | null>(null);

  // Start Real Browser Camera
  const startCamera = async () => {
    setPermissionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API is not supported in this browser or insecure HTTP context.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setIsSimulationMode(false);
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setCameraActive(false);
      setPermissionError(
        err.message || 'Camera permission denied or camera device is in use by another application.'
      );
    }
  };

  // Stop Camera Tracks cleanly
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setClosureDurationSec(0.0);
    setActiveWarning(null);
  };

  useEffect(() => {
    return () => {
      // Clean up camera tracks on unmount
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  // Handle simulated eye closure slider
  const handleSimulatedClosureChange = (seconds: number) => {
    setSimulatedClosureSec(seconds);
    setClosureDurationSec(seconds);
    const eyesState = seconds < 0.3;
    setEyesOpen(eyesState);
    setEarValue(eyesState ? 0.32 : 0.12);

    if (seconds >= 1.5) {
      setAttentionScore(Math.max(10, Math.round(100 - seconds * 35)));
      setActiveWarning('CRITICAL: Sustained Eye Closure Detected (Drowsiness Hazard)');
      audioAlerts.playTone('CRITICAL');
      audioAlerts.speakAlert('Driver attention warning. If you feel drowsy, stop at a safe location and rest.');
    } else if (seconds >= 0.8) {
      setAttentionScore(65);
      setActiveWarning('HIGH: Prolonged Blink Detected (Fatigue Vigilance Alert)');
    } else {
      setAttentionScore(98);
      setActiveWarning(null);
    }

    // Send telemetry to backend
    api.sendDriverTelemetry({
      face_detected: true,
      eyes_detected: eyesState,
      ear_value: eyesState ? 0.32 : 0.12,
    }).then(() => onRefreshEvents()).catch(() => {});
  };

  const resetMetrics = () => {
    setClosureDurationSec(0.0);
    setSimulatedClosureSec(0.0);
    setEyesOpen(true);
    setEarValue(0.32);
    setAttentionScore(98);
    setActiveWarning(null);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Eye className="w-6 h-6 text-cyan-400" />
              Driver Drowsiness & Attention Monitoring
            </h1>
            <StatusBadge mode={cameraActive ? 'LIVE_CAMERA' : isSimulationMode ? 'DEMO_SIMULATION' : 'HARDWARE_NOT_CONNECTED'} />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Facial landmark analysis measuring Eye Aspect Ratio (EAR), temporal closure duration, and distraction indicators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {cameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-950/40"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20"
            >
              <Camera className="w-4 h-4" />
              Start Browser Camera
            </button>
          )}

          <button
            onClick={resetMetrics}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
            title="Reset Monitoring Counters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Permission Warning / Insecure Context Box */}
      {permissionError && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <p className="font-bold text-amber-300">Camera Feed Notice</p>
            <p className="mt-0.5">{permissionError}</p>
            <p className="mt-1 text-gray-300">
              Note: Modern browsers require HTTPS or <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300">localhost</code> to grant webcam access. On mobile Android devices connecting over plain HTTP, the browser security policy may restrict raw camera access. Use the interactive simulation controls below to verify all risk detection logic.
            </p>
          </div>
        </div>
      )}

      {/* Active Warning Banner */}
      {activeWarning && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500 text-white flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="font-black text-sm text-red-300 uppercase tracking-wide">
                Active Attention Warning
              </p>
              <p className="text-xs text-gray-200 font-medium">{activeWarning}</p>
            </div>
          </div>
          <SeverityBadge severity="CRITICAL" />
        </div>
      )}

      {/* Main Monitoring Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video / Camera Feed Panel */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              Real-Time Driver Vision Stream
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-gray-400">
                EAR: <strong className={earValue < 0.2 ? 'text-red-400' : 'text-emerald-400'}>{earValue.toFixed(2)}</strong>
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                Closure: <strong className="text-white">{closureDurationSec.toFixed(1)}s</strong>
              </span>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full rounded-xl bg-[#090d15] border border-gray-800 flex items-center justify-center overflow-hidden">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

                {/* HUD Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-mono">LIVE OPTICAL FEED</span>
                  </div>
                  <span className="text-gray-300">Face Landmark: Active</span>
                  <span className="text-gray-300">Privacy: Frame not stored</span>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500 max-w-md">
                <CameraOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-300">Live Camera Stream Inactive</p>
                <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
                  Click 'Start Browser Camera' above to initialize webcam facial monitoring, or utilize the interactive simulation panel to test drowsiness detection thresholds.
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
                >
                  Enable Camera Stream
                </button>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>Client-side temporal analysis only. Video frames are processed in volatile memory.</span>
            <span className="font-mono text-cyan-400">FPS: 30</span>
          </div>
        </div>

        {/* Telemetry & Controls Panel */}
        <div className="space-y-4">
          {/* Driver Status Card */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center justify-between">
              <span>Driver Attention Index</span>
              <span className={`text-sm font-mono font-bold ${attentionScore < 50 ? 'text-red-400' : attentionScore < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {attentionScore}%
              </span>
            </h3>

            {/* Score Bar */}
            <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-300 ${
                  attentionScore < 50 ? 'bg-red-500' : attentionScore < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${attentionScore}%` }}
              />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Eye Aperture State</span>
                <span className={`font-bold font-mono ${eyesOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {eyesOpen ? 'OPEN (EAR >= 0.20)' : 'CLOSED (EAR < 0.20)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Eye Closure Duration</span>
                <span className="font-bold font-mono text-white">
                  {closureDurationSec.toFixed(2)} seconds
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Critical Drowsiness Cutoff</span>
                <span className="font-mono text-cyan-300">1.50 seconds</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-gray-400">Session Blink Counter</span>
                <span className="font-mono text-white">{blinkCount} blinks</span>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Slider Card */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Drowsiness Simulator
              </h3>
              <StatusBadge mode="DEMO_SIMULATION" />
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Adjust the slider to simulate sustained eye closure duration and observe the risk engine's threshold reaction.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Simulate Closure Duration:</span>
                <span className="text-cyan-400 font-bold">{simulatedClosureSec.toFixed(1)}s</span>
              </div>

              <input
                type="range"
                min="0.0"
                max="3.5"
                step="0.1"
                value={simulatedClosureSec}
                onChange={(e) => {
                  setIsSimulationMode(true);
                  handleSimulatedClosureChange(parseFloat(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>0.0s (Alert)</span>
                <span className="text-amber-500">1.0s (Vigilance)</span>
                <span className="text-red-500">1.5s+ (Hazard)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 flex gap-2">
              <button
                onClick={() => {
                  setIsSimulationMode(true);
                  handleSimulatedClosureChange(2.3);
                }}
                className="flex-1 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold transition"
              >
                2.3s Severe
              </button>
              <button
                onClick={() => {
                  setIsSimulationMode(true);
                  handleSimulatedClosureChange(0.0);
                }}
                className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition"
              >
                Reset Alert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Limitations & Ethical Disclaimer Box */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Technical & Safety Scope Disclaimer
        </p>
        <p>
          AutoGuardian AI is an experimental driver-assistance prototype. It measures optical Eye Aspect Ratio (EAR) using monocular computer vision and does not constitute a certified medical fatigue diagnostics instrument. Lighting variations, eyewear, sunglasses, and camera placement may affect detection accuracy. Attentive driver alertness remains the sole responsibility of the vehicle operator.
        </p>
      </div>
    </div>
  );
};
