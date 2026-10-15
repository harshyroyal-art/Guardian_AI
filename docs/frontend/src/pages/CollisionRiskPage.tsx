import React, { useState } from 'react';
import {
  ShieldAlert,
  Car,
  Gauge,
  Clock,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface CollisionRiskPageProps {
  onRefreshEvents: () => void;
}

export const CollisionRiskPage: React.FC<CollisionRiskPageProps> = ({ onRefreshEvents }) => {
  // Configurable dynamic simulation parameters
  const [ownSpeedKmh, setOwnSpeedKmh] = useState<number>(65);
  const [leadSpeedKmh, setLeadSpeedKmh] = useState<number>(45);
  const [distanceM, setDistanceM] = useState<number>(12.5);
  const [hasLeadVehicle, setHasLeadVehicle] = useState<boolean>(true);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0.92);

  // Derived physics calculations
  const relativeSpeedKmh = ownSpeedKmh - leadSpeedKmh;
  const relativeSpeedMs = (relativeSpeedKmh * 1000) / 3600;
  const ttcSeconds =
    relativeSpeedMs > 0 && distanceM > 0
      ? (distanceM / relativeSpeedMs).toFixed(1)
      : 'N/A (Opening Gap)';

  // Determine severity and risk score deterministically
  let severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT_DATA' = 'NORMAL';
  let riskScore = 10;
  let explanation = '';
  let guidance = '';

  if (!hasLeadVehicle) {
    severity = 'NORMAL';
    riskScore = 5;
    explanation = 'Forward roadway is clear. No lead vehicle detected in active lane buffer.';
    guidance = 'Maintain standard attentive driving scanning.';
  } else if (detectionConfidence < 0.35) {
    severity = 'INSUFFICIENT_DATA';
    riskScore = 15;
    explanation = `Detection confidence (${(detectionConfidence * 100).toFixed(0)}%) is below reliable threshold (35%). Optical data is insufficient.`;
    guidance = 'Observe road manually; visual tracking confidence is degraded.';
  } else if (distanceM <= 6.0 || (typeof ttcSeconds === 'string' && parseFloat(ttcSeconds) <= 1.8)) {
    severity = 'CRITICAL';
    riskScore = 95;
    explanation = `Critical forward collision envelope breached: lead distance is ${distanceM}m with closing TTC of ${ttcSeconds}s.`;
    guidance = 'Vehicle detected ahead. Assess the road and maintain a safe following distance.';
  } else if (distanceM <= 15.0 || (typeof ttcSeconds === 'string' && parseFloat(ttcSeconds) <= 3.0)) {
    severity = 'HIGH';
    riskScore = 75;
    explanation = `Reduced following margin: distance (${distanceM}m) has breached the 15.0m advisory threshold with closing relative speed of ${relativeSpeedKmh.toFixed(1)} km/h.`;
    guidance = 'Vehicle detected ahead. Assess the road and maintain a safe following distance.';
  } else if (distanceM <= 25.0) {
    severity = 'MEDIUM';
    riskScore = 45;
    explanation = `Lead vehicle tracked at ${distanceM}m within active caution envelope.`;
    guidance = 'Maintain attentive following distance and monitor lead vehicle braking.';
  } else {
    severity = 'LOW';
    riskScore = 20;
    explanation = `Lead vehicle tracked at safe range (${distanceM}m).`;
    guidance = 'Continue nominal driving margin.';
  }

  const triggerEvaluation = async () => {
    try {
      await api.triggerDemoScenario('high_collision_risk', {
        estimated_distance_m: distanceM,
        lead_speed_kmh: leadSpeedKmh,
        own_speed_kmh: ownSpeedKmh,
      });
      onRefreshEvents();
    } catch {
      // Handled silently
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              Forward Collision Risk Monitor & Time-to-Collision (TTC)
            </h1>
            <StatusBadge mode="MODEL_PROCESSING" />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Deterministic kinematic risk assessment combining relative approach speed, estimated forward gap, and calibrated advisory thresholds.
          </p>
        </div>

        <button
          onClick={triggerEvaluation}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          Evaluate Forward Risk Event
        </button>
      </div>

      {/* Primary Telemetry Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Distance Card */}
        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Estimated Distance</span>
          <div className="text-2xl font-black text-white mt-1">
            {hasLeadVehicle ? `${distanceM.toFixed(1)} m` : 'None'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Advisory Stop Margin: <strong className="text-cyan-400">15.0m</strong>
          </p>
        </div>

        {/* Relative Speed Card */}
        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Relative Speed Delta</span>
          <div className={`text-2xl font-black mt-1 ${relativeSpeedKmh > 15 ? 'text-orange-400' : 'text-white'}`}>
            {hasLeadVehicle ? `${relativeSpeedKmh > 0 ? '+' : ''}${relativeSpeedKmh.toFixed(0)} km/h` : '0 km/h'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Own: {ownSpeedKmh} km/h • Lead: {leadSpeedKmh} km/h
          </p>
        </div>

        {/* Time To Collision Card */}
        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Estimated TTC</span>
          <div className={`text-2xl font-black mt-1 ${typeof ttcSeconds === 'string' && parseFloat(ttcSeconds) <= 2.0 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
            {hasLeadVehicle ? `${ttcSeconds}s` : 'Inf'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Critical Threshold: <strong className="text-red-400">&lt; 1.8s</strong>
          </p>
        </div>

        {/* Risk Assessment Card */}
        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Risk Engine State</span>
          <div className="mt-1 flex items-center gap-2">
            <SeverityBadge severity={severity} />
            <span className="font-mono text-sm font-bold text-white">{riskScore}/100</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            Confidence: {(detectionConfidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Physics & Road Envelope Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Road Corridor Diagram */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-white mb-2 flex items-center justify-between">
            <span>Forward Trajectory Corridor Simulation</span>
            <span className="text-xs font-mono text-gray-400">Perspective: Top-Down Lane</span>
          </h3>

          {/* Visual Road Canvas */}
          <div className="relative h-64 w-full rounded-xl bg-[#090d15] border border-gray-800 flex items-center justify-center overflow-hidden">
            {/* Lane Lines */}
            <div className="absolute inset-y-0 w-36 border-x-2 border-dashed border-gray-700 flex flex-col justify-between py-2 items-center">
              {/* Distance Markings */}
              <span className="text-[10px] font-mono text-gray-600">30m</span>
              <span className="text-[10px] font-mono text-gray-600">20m</span>
              <span className="text-[10px] font-mono text-amber-500/70">15m (Caution)</span>
              <span className="text-[10px] font-mono text-red-500/80">6m (Critical)</span>
            </div>

            {/* Own Vehicle (Bottom) */}
            <div className="absolute bottom-4 flex flex-col items-center">
              <div className="px-3 py-1.5 rounded-lg bg-cyan-600 text-gray-950 font-bold text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-1.5">
                <Car className="w-4 h-4" />
                Own Vehicle ({ownSpeedKmh} km/h)
              </div>
            </div>

            {/* Lead Vehicle (Positioned based on distanceM) */}
            {hasLeadVehicle ? (
              <div
                className="absolute flex flex-col items-center transition-all duration-300"
                style={{
                  bottom: `${Math.max(48, Math.min(210, 48 + ((distanceM - 3) / 30) * 160))}px`,
                }}
              >
                <div
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg flex items-center gap-1.5 ${
                    distanceM <= 6
                      ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                      : distanceM <= 15
                      ? 'bg-amber-500 text-gray-950 shadow-amber-500/30'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  Lead Vehicle ({leadSpeedKmh} km/h) • {distanceM.toFixed(1)}m
                </div>

                {/* Radar Gap Beam */}
                <div
                  className={`w-1 transition-all ${
                    distanceM <= 6 ? 'bg-red-500' : distanceM <= 15 ? 'bg-amber-400' : 'bg-cyan-500/40'
                  }`}
                  style={{ height: '24px' }}
                />
              </div>
            ) : (
              <div className="text-gray-500 text-xs italic">
                Path clear. No forward vehicle detected.
              </div>
            )}
          </div>

          {/* Decision Explanation Box */}
          <div className="mt-4 p-3.5 rounded-xl bg-[#0d1420] border border-gray-800 text-xs space-y-1">
            <p className="text-cyan-300">
              <span className="font-bold text-gray-300">Deterministic Engine Rule:</span> {explanation}
            </p>
            <p className="text-emerald-400">
              <span className="font-bold text-gray-300">Advisory Recommendation:</span> {guidance}
            </p>
          </div>
        </div>

        {/* Interactive Physics Calibration Sliders */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Dynamic Scene Inputs
            </h3>
            <button
              onClick={() => {
                setOwnSpeedKmh(65);
                setLeadSpeedKmh(45);
                setDistanceM(12.5);
                setHasLeadVehicle(true);
                setDetectionConfidence(0.92);
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Toggle Lead Vehicle */}
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-gray-300 font-medium">Lead Vehicle Present</span>
            <input
              type="checkbox"
              checked={hasLeadVehicle}
              onChange={(e) => setHasLeadVehicle(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Distance Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Forward Distance:</span>
              <span className="font-mono text-cyan-300 font-bold">{distanceM.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="35.0"
              step="0.5"
              value={distanceM}
              disabled={!hasLeadVehicle}
              onChange={(e) => setDistanceM(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Own Speed Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Own Vehicle Speed:</span>
              <span className="font-mono text-cyan-300 font-bold">{ownSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={ownSpeedKmh}
              onChange={(e) => setOwnSpeedKmh(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Lead Speed Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Lead Vehicle Speed:</span>
              <span className="font-mono text-cyan-300 font-bold">{leadSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={leadSpeedKmh}
              disabled={!hasLeadVehicle}
              onChange={(e) => setLeadSpeedKmh(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Confidence Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Model Confidence:</span>
              <span className="font-mono text-cyan-300 font-bold">{(detectionConfidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={detectionConfidence}
              disabled={!hasLeadVehicle}
              onChange={(e) => setDetectionConfidence(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Boundary Quick Preset Buttons */}
          <div className="pt-2 border-t border-gray-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-gray-500 block">Boundary Presets</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setDistanceM(4.2);
                  setOwnSpeedKmh(65);
                  setLeadSpeedKmh(20);
                  setHasLeadVehicle(true);
                  setDetectionConfidence(0.95);
                }}
                className="py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold text-left text-[11px]"
              >
                Critical (4.2m)
              </button>
              <button
                onClick={() => {
                  setDistanceM(11.0);
                  setOwnSpeedKmh(55);
                  setLeadSpeedKmh(45);
                  setHasLeadVehicle(true);
                  setDetectionConfidence(0.90);
                }}
                className="py-1.5 px-2 rounded-lg bg-orange-950/60 hover:bg-orange-900 border border-orange-500/40 text-orange-300 font-semibold text-left text-[11px]"
              >
                Caution (11.0m)
              </button>
              <button
                onClick={() => {
                  setDetectionConfidence(0.20);
                }}
                className="py-1.5 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-left text-[11px]"
              >
                Low Conf (0.20)
              </button>
              <button
                onClick={() => {
                  setDistanceM(28.0);
                  setOwnSpeedKmh(60);
                  setLeadSpeedKmh(60);
                }}
                className="py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-left text-[11px]"
              >
                Nominal (28.0m)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Calibration Limitation Box */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Optical Monocular Physics Disclaimer
        </p>
        <p>
          Camera-only forward collision assistance estimates relative distance and approach rates based on bounding box dimensions and camera focal assumptions. It does not replace certified millimeter-wave radar or LiDAR sensor suites. Do not rely on prototype distances for physical stopping distances.
        </p>
      </div>
    </div>
  );
};
