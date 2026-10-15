import React, { useState } from 'react';
import {
  Car,
  AlertTriangle,
  ArrowLeftRight,
  ShieldAlert,
  Info,
  Radio,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface BlindSpotPageProps {
  onRefreshEvents: () => void;
}

export const BlindSpotPage: React.FC<BlindSpotPageProps> = ({ onRefreshEvents }) => {
  const [hardwareMode, setHardwareMode] = useState<boolean>(false);
  const [leftOccupied, setLeftOccupied] = useState<boolean>(true);
  const [rightOccupied, setRightOccupied] = useState<boolean>(false);
  const [leftDistanceM, setLeftDistanceM] = useState<number>(2.4);
  const [rightDistanceM, setRightDistanceM] = useState<number>(4.8);
  const [turnSignal, setTurnSignal] = useState<'left' | 'right' | null>('left');

  const updateState = async (updates: Partial<{
    left_occupied: boolean;
    right_occupied: boolean;
    left_vehicle_distance_m: number;
    right_vehicle_distance_m: number;
    turn_signal_active: string | null;
  }>) => {
    try {
      await api.updateBlindSpot(updates);
      onRefreshEvents();
    } catch {
      // Handled silently
    }
  };

  const handleToggleLeft = (val: boolean) => {
    setLeftOccupied(val);
    updateState({ left_occupied: val });
  };

  const handleToggleRight = (val: boolean) => {
    setRightOccupied(val);
    updateState({ right_occupied: val });
  };

  const handleTurnSignal = (sig: 'left' | 'right' | null) => {
    const next = turnSignal === sig ? null : sig;
    setTurnSignal(next);
    updateState({ turn_signal_active: next });
  };

  // Determine current active risk
  const isConflict =
    (turnSignal === 'left' && leftOccupied) || (turnSignal === 'right' && rightOccupied);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Car className="w-6 h-6 text-cyan-400" />
              Blind-Spot Detection & Flank Monitoring
            </h1>
            <StatusBadge mode={hardwareMode ? 'HARDWARE_NOT_CONNECTED' : 'DEMO_SIMULATION'} />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Simulates left and right flank ultrasonic/radar proximity zones with driver turn signal conflict resolution.
          </p>
        </div>

        {/* Mode Toggle: Simulation vs Hardware */}
        <div className="flex items-center gap-1.5 p-1 bg-[#162032] border border-[#1f2d47] rounded-xl text-xs">
          <button
            onClick={() => setHardwareMode(false)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              !hardwareMode
                ? 'bg-cyan-500 text-gray-950 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Simulation Lab Mode
          </button>
          <button
            onClick={() => setHardwareMode(true)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              hardwareMode
                ? 'bg-rose-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Physical Hardware Mode
          </button>
        </div>
      </div>

      {hardwareMode ? (
        /* Honest Hardware Unavailable State */
        <div className="p-8 rounded-2xl bg-[#111827] border border-rose-600/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">HARDWARE NOT CONNECTED</h2>
            <p className="text-sm text-gray-400 max-w-lg mx-auto mt-1">
              No physical side-mirror radar or CAN bus ultrasonic sensors are detected on this workstation.
            </p>
            <p className="text-xs text-rose-400 mt-2 font-mono">
              Status: BUS_OFFLINE • Interface: USB-CAN / Serial OBD-II not found
            </p>
          </div>
          <button
            onClick={() => setHardwareMode(false)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
          >
            Switch to Simulation Mode to Test Logic
          </button>
        </div>
      ) : (
        /* Interactive Simulation Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top-Down Vehicle Diagram */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Top-Down Vehicle Radar Envelope
              </span>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={isConflict ? 'CRITICAL' : leftOccupied || rightOccupied ? 'HIGH' : 'NORMAL'} />
                <span className="text-xs font-mono text-cyan-400">SIMULATED SCENARIO</span>
              </div>
            </div>

            {/* Visual Vehicle Diagram Canvas */}
            <div className="relative h-80 w-full rounded-xl bg-[#080d16] border border-gray-800 flex items-center justify-center overflow-hidden my-3">
              {/* Left Blind-Spot Sector */}
              <div
                className={`absolute left-4 sm:left-12 w-28 sm:w-36 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  leftOccupied
                    ? turnSignal === 'left'
                      ? 'bg-red-950/50 border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                      : 'bg-amber-950/40 border-amber-500'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-gray-400">Left Flank Zone</span>
                {leftOccupied ? (
                  <div className="mt-2 text-center">
                    <Car className="w-8 h-8 text-amber-400 mx-auto" />
                    <span className="text-xs font-bold text-white block mt-1">Vehicle Present</span>
                    <span className="text-[10px] font-mono text-cyan-300">{leftDistanceM}m</span>
                  </div>
                ) : (
                  <span className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Clear
                  </span>
                )}
              </div>

              {/* Center Vehicle (Own Car) */}
              <div className="relative z-10 w-24 h-44 rounded-2xl bg-[#1c2a42] border-2 border-cyan-500/80 shadow-2xl flex flex-col items-center justify-between p-2">
                {/* Front Windshield */}
                <div className="w-16 h-8 rounded-t-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-cyan-300">FRONT</span>
                </div>

                {/* Own Vehicle Label & Indicators */}
                <div className="text-center">
                  <span className="text-[10px] font-bold text-white block">OWN CAR</span>
                  <div className="flex gap-1.5 justify-center mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${turnSignal === 'left' ? 'bg-amber-400 animate-ping' : 'bg-gray-700'}`} />
                    <span className={`w-2.5 h-2.5 rounded-full ${turnSignal === 'right' ? 'bg-amber-400 animate-ping' : 'bg-gray-700'}`} />
                  </div>
                </div>

                {/* Rear Window */}
                <div className="w-14 h-4 rounded-b bg-gray-900 border border-gray-700 flex items-center justify-center">
                  <span className="text-[8px] font-mono text-gray-500">REAR</span>
                </div>
              </div>

              {/* Right Blind-Spot Sector */}
              <div
                className={`absolute right-4 sm:right-12 w-28 sm:w-36 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  rightOccupied
                    ? turnSignal === 'right'
                      ? 'bg-red-950/50 border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                      : 'bg-amber-950/40 border-amber-500'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-gray-400">Right Flank Zone</span>
                {rightOccupied ? (
                  <div className="mt-2 text-center">
                    <Car className="w-8 h-8 text-amber-400 mx-auto" />
                    <span className="text-xs font-bold text-white block mt-1">Vehicle Present</span>
                    <span className="text-[10px] font-mono text-cyan-300">{rightDistanceM}m</span>
                  </div>
                ) : (
                  <span className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Clear
                  </span>
                )}
              </div>
            </div>

            {/* Explanation & Guidance Bar */}
            <div className="p-3.5 rounded-xl bg-[#0d1420] border border-gray-800 text-xs space-y-1">
              <p className="text-cyan-300">
                <span className="font-bold text-gray-300">Decision Logic:</span>{' '}
                {isConflict
                  ? `Critical conflict: Driver indicated ${turnSignal} turn signal while ${turnSignal} blind-spot envelope is occupied.`
                  : leftOccupied || rightOccupied
                  ? `Vehicle detected in ${leftOccupied ? 'left' : 'right'} adjacent lane envelope; turn signal inactive.`
                  : 'Both left and right blind-spot sectors report clear lateral clearance.'}
              </p>
              <p className="text-emerald-400">
                <span className="font-bold text-gray-300">Advisory:</span>{' '}
                {isConflict
                  ? `Delay lane change! Check ${turnSignal} mirrors and maintain lane.`
                  : leftOccupied || rightOccupied
                  ? 'Monitor mirrors before signaling or initiating any lane maneuvers.'
                  : 'Proceed with standard shoulder checks.'}
              </p>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Scenario Controls
            </h3>

            {/* Turn Signal Controls */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Turn Signal Indicator
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTurnSignal('left')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    turnSignal === 'left'
                      ? 'bg-amber-500 text-gray-950 font-black animate-pulse'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ◀ Left Signal
                </button>
                <button
                  onClick={() => handleTurnSignal(null)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition ${
                    turnSignal === null
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Neutral
                </button>
                <button
                  onClick={() => handleTurnSignal('right')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    turnSignal === 'right'
                      ? 'bg-amber-500 text-gray-950 font-black animate-pulse'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Right Signal ▶
                </button>
              </div>
            </div>

            {/* Left Zone Vehicle Presence */}
            <div className="p-3 rounded-xl bg-[#0d1420] border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Left Blind-Spot Vehicle</span>
                <input
                  type="checkbox"
                  checked={leftOccupied}
                  onChange={(e) => handleToggleLeft(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>
              {leftOccupied && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Distance:</span>
                    <span className="text-cyan-300">{leftDistanceM}m</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={leftDistanceM}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setLeftDistanceM(v);
                      updateState({ left_vehicle_distance_m: v });
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Right Zone Vehicle Presence */}
            <div className="p-3 rounded-xl bg-[#0d1420] border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Right Blind-Spot Vehicle</span>
                <input
                  type="checkbox"
                  checked={rightOccupied}
                  onChange={(e) => handleToggleRight(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>
              {rightOccupied && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Distance:</span>
                    <span className="text-cyan-300">{rightDistanceM}m</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={rightDistanceM}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setRightDistanceM(v);
                      updateState({ right_vehicle_distance_m: v });
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Quick Conflict Presets */}
            <div className="space-y-1.5 pt-2 border-t border-gray-800">
              <span className="text-[11px] font-bold uppercase text-gray-500 block">Scenario Presets</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setLeftOccupied(true);
                    setTurnSignal('left');
                    updateState({ left_occupied: true, turn_signal_active: 'left' });
                  }}
                  className="py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold text-left text-[11px]"
                >
                  Left Turn Conflict
                </button>
                <button
                  onClick={() => {
                    setRightOccupied(true);
                    setTurnSignal('right');
                    updateState({ right_occupied: true, turn_signal_active: 'right' });
                  }}
                  className="py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold text-left text-[11px]"
                >
                  Right Turn Conflict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Geometry Limitation Notice */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Camera Scope & Blind Spot Limitation Disclosure
        </p>
        <p>
          A single front-facing laptop webcam or dashboard smartphone camera physically cannot view vehicle rear-quarter blind spots. AutoGuardian AI provides this top-down simulation for hackathon demonstration. In real-world vehicular retrofits, this module requires dedicated side-mirror radar or ultrasonic sensor pods.
        </p>
      </div>
    </div>
  );
};
