import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Car,
  AlertOctagon,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';
import { audioAlerts } from '../utils/audioAlerts';

interface ParkingAssistPageProps {
  onRefreshEvents: () => void;
}

export const ParkingAssistPage: React.FC<ParkingAssistPageProps> = ({ onRefreshEvents }) => {
  const [gear, setGear] = useState<'PARK' | 'REVERSE' | 'DRIVE'>('REVERSE');
  const [frontDist, setFrontDist] = useState<number>(2.4);
  const [rearDist, setRearDist] = useState<number>(0.42);
  const [leftDist, setLeftDist] = useState<number>(1.6);
  const [rightDist, setRightDist] = useState<number>(1.8);
  const [acousticBeep, setAcousticBeep] = useState<boolean>(true);

  const activeDistance = gear === 'REVERSE' ? rearDist : gear === 'DRIVE' ? frontDist : 3.0;

  // Warning thresholds: Stop <= 0.5m, Caution <= 1.2m
  const isEmergencyStop = activeDistance <= 0.5;
  const isCaution = activeDistance > 0.5 && activeDistance <= 1.2;

  // Acoustic radar beep effect
  useEffect(() => {
    if (!acousticBeep || gear === 'PARK') return;
    if (isEmergencyStop) {
      audioAlerts.playTone('CRITICAL');
    } else if (isCaution) {
      audioAlerts.playTone('HIGH');
    }
  }, [rearDist, frontDist, gear, acousticBeep]);

  const handleUpdate = async (updates: Partial<{
    front_distance_m: number;
    rear_distance_m: number;
    left_distance_m: number;
    right_distance_m: number;
    active_gear: string;
  }>) => {
    try {
      await api.updateParking(updates);
      onRefreshEvents();
    } catch {
      // Handled silently
    }
  };

  const setPreset = (f: number, r: number, g: 'PARK' | 'REVERSE' | 'DRIVE') => {
    setFrontDist(f);
    setRearDist(r);
    setGear(g);
    handleUpdate({ front_distance_m: f, rear_distance_m: r, active_gear: g });
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Navigation className="w-6 h-6 text-cyan-400" />
              Front & Rear Parking Proximity Assistance
            </h1>
            <StatusBadge mode="DEMO_SIMULATION" />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Interactive multi-zone ultrasonic parking radar simulation with emergency stop cutoffs and acoustic proximity cues.
          </p>
        </div>

        {/* Gear Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#162032] border border-[#1f2d47] rounded-xl text-xs">
          {(['PARK', 'REVERSE', 'DRIVE'] as const).map((g) => (
            <button
              key={g}
              onClick={() => {
                setGear(g);
                handleUpdate({ active_gear: g });
              }}
              className={`px-3.5 py-1.5 rounded-lg font-black transition ${
                gear === g
                  ? g === 'REVERSE'
                    ? 'bg-red-600 text-white shadow'
                    : g === 'DRIVE'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top-Down Parking Radar Visualizer */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              360° Proximity Radar Envelope (Gear: {gear})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAcousticBeep(!acousticBeep)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-mono ${
                  acousticBeep
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                {acousticBeep ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {acousticBeep ? 'BEEP ON' : 'MUTED'}
              </button>
              <SeverityBadge severity={isEmergencyStop ? 'CRITICAL' : isCaution ? 'HIGH' : 'NORMAL'} />
            </div>
          </div>

          {/* Radar Arena */}
          <div className="relative h-88 w-full rounded-xl bg-[#070b12] border border-gray-800 flex items-center justify-center overflow-hidden my-2">
            {/* Front Radar Arc */}
            <div
              className={`absolute top-4 w-48 h-20 rounded-t-full border-t-4 border-dashed transition-all flex flex-col items-center justify-start pt-2 ${
                frontDist <= 0.5
                  ? 'border-red-500 bg-red-950/40 text-red-400 animate-pulse'
                  : frontDist <= 1.2
                  ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                  : 'border-emerald-500/50 text-emerald-400'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">Front Sector</span>
              <span className="text-sm font-mono font-black">{frontDist.toFixed(2)}m</span>
            </div>

            {/* Left Radar Arc */}
            <div
              className={`absolute left-4 w-20 h-44 rounded-l-full border-l-4 border-dashed transition-all flex flex-col items-center justify-center ${
                leftDist <= 0.6 ? 'border-red-500 text-red-400' : 'border-emerald-500/40 text-gray-400'
              }`}
            >
              <span className="text-[9px] font-bold uppercase">Left</span>
              <span className="text-xs font-mono font-bold">{leftDist.toFixed(1)}m</span>
            </div>

            {/* Center Vehicle */}
            <div className="relative z-10 w-24 h-44 rounded-2xl bg-[#162235] border-2 border-cyan-500 shadow-2xl flex flex-col items-center justify-between p-2">
              <div className="w-16 h-8 rounded-t bg-cyan-950 border border-cyan-400/40 flex items-center justify-center">
                <span className="text-[9px] font-bold text-cyan-300">FRONT</span>
              </div>
              <div className="text-center">
                <Car className="w-6 h-6 text-cyan-400 mx-auto" />
                <span className="text-[10px] font-black text-white">{gear}</span>
              </div>
              <div className="w-14 h-4 rounded-b bg-gray-900 border border-gray-700 flex items-center justify-center">
                <span className="text-[8px] font-mono text-gray-400">REAR</span>
              </div>
            </div>

            {/* Right Radar Arc */}
            <div
              className={`absolute right-4 w-20 h-44 rounded-r-full border-r-4 border-dashed transition-all flex flex-col items-center justify-center ${
                rightDist <= 0.6 ? 'border-red-500 text-red-400' : 'border-emerald-500/40 text-gray-400'
              }`}
            >
              <span className="text-[9px] font-bold uppercase">Right</span>
              <span className="text-xs font-mono font-bold">{rightDist.toFixed(1)}m</span>
            </div>

            {/* Rear Radar Arc */}
            <div
              className={`absolute bottom-4 w-48 h-20 rounded-b-full border-b-4 border-dashed transition-all flex flex-col items-center justify-end pb-2 ${
                rearDist <= 0.5
                  ? 'border-red-500 bg-red-950/40 text-red-400 animate-pulse'
                  : rearDist <= 1.2
                  ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                  : 'border-emerald-500/50 text-emerald-400'
              }`}
            >
              <span className="text-sm font-mono font-black">{rearDist.toFixed(2)}m</span>
              <span className="text-[10px] font-bold uppercase">Rear Sector</span>
            </div>
          </div>

          {/* Active Status Banner */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              isEmergencyStop
                ? 'bg-red-950/70 border-red-500 text-red-200'
                : isCaution
                ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isEmergencyStop ? (
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              ) : isCaution ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-white uppercase tracking-wide">
                  {isEmergencyStop
                    ? 'EMERGENCY STOP — OBSTACLE IMMINENT'
                    : isCaution
                    ? 'CAUTION — APPROACHING OBSTACLE'
                    : 'CLEARANCE SAFE'}
                </p>
                <p className="text-[11px] opacity-90">
                  {isEmergencyStop
                    ? `Object at ${activeDistance.toFixed(2)}m is below the 0.5m critical stop threshold. Halt vehicle!`
                    : isCaution
                    ? `Object within caution perimeter (${activeDistance.toFixed(2)}m <= 1.2m). Maneuver slowly.`
                    : 'Path clearance is nominal. Maintain standard visual checks.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sliders & Calibration Controls */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Adjust Obstacle Distances
          </h3>

          {/* Rear Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Rear Obstacle Distance:</span>
              <span className={`font-mono font-bold ${rearDist <= 0.5 ? 'text-red-400' : 'text-cyan-300'}`}>
                {rearDist.toFixed(2)} m
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="3.00"
              step="0.05"
              value={rearDist}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRearDist(val);
                handleUpdate({ rear_distance_m: val });
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span className="text-red-500">0.1m (Stop)</span>
              <span className="text-amber-500">1.2m (Caution)</span>
              <span>3.0m (Clear)</span>
            </div>
          </div>

          {/* Front Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Front Obstacle Distance:</span>
              <span className={`font-mono font-bold ${frontDist <= 0.5 ? 'text-red-400' : 'text-cyan-300'}`}>
                {frontDist.toFixed(2)} m
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="3.00"
              step="0.05"
              value={frontDist}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFrontDist(val);
                handleUpdate({ front_distance_m: val });
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Left / Right Lateral Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-gray-400 block">Left Gap: {leftDist.toFixed(1)}m</span>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={leftDist}
                onChange={(e) => setLeftDist(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-gray-400 block">Right Gap: {rightDist.toFixed(1)}m</span>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={rightDist}
                onChange={(e) => setRightDist(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Scenarios presets */}
          <div className="pt-2 border-t border-gray-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-gray-500 block">Parking Presets</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPreset(2.5, 0.35, 'REVERSE')}
                className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-left font-semibold text-[11px]"
              >
                Rear Stop (0.35m)
              </button>
              <button
                onClick={() => setPreset(0.85, 2.5, 'DRIVE')}
                className="p-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-left font-semibold text-[11px]"
              >
                Front Caution (0.85m)
              </button>
              <button
                onClick={() => setPreset(2.5, 2.8, 'PARK')}
                className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-left font-semibold text-[11px]"
              >
                Clear Parking (2.8m)
              </button>
              <button
                onClick={() => setPreset(0.40, 2.0, 'DRIVE')}
                className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-left font-semibold text-[11px]"
              >
                Front Stop (0.40m)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Calibration Note */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Hardware & Ultrasonic Disclaimer
        </p>
        <p>
          This parking assistant module uses simulated ultrasonic telemetry inputs for hackathon demonstration. A software-only diagram does not physically measure physical bumper obstacle distances. When deployed to a physical vehicle, this module connects to rear ultrasonic bumper sensors or reversing camera optical depth estimation.
        </p>
      </div>
    </div>
  );
};
