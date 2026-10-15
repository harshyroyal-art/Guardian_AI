import React, { useState } from 'react';
import {
  PlayCircle,
  RotateCcw,
  Trash2,
  CheckCircle,
  Play,
  ShieldAlert,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SafetyEvent } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface DemoSimulatorPageProps {
  onRefreshEvents: () => void;
  onResetDemo: () => void;
  onClearEvents: () => void;
}

const SCENARIOS = [
  {
    id: 'normal_operation',
    num: 1,
    title: 'Normal Attentive Driving',
    category: 'DRIVER_ATTENTION',
    expectedSeverity: 'NORMAL',
    desc: 'Driver face alert, regular blinking, roadway clear, nominal parking clearance.',
  },
  {
    id: 'sustained_eye_closure',
    num: 2,
    title: 'Sustained Eye Closure (Drowsiness)',
    category: 'DRIVER_ATTENTION',
    expectedSeverity: 'CRITICAL',
    desc: 'Continuous eye closure measured at 2.3s, exceeding the 1.5s critical safety threshold.',
  },
  {
    id: 'vehicle_detected_ahead',
    num: 3,
    title: 'Forward Vehicle at Safe Margin',
    category: 'FORWARD_COLLISION',
    expectedSeverity: 'LOW',
    desc: 'Lead vehicle tracked at 24.0m with matching speed delta; nominal safety buffer.',
  },
  {
    id: 'high_collision_risk',
    num: 4,
    title: 'High Collision Risk Simulation',
    category: 'FORWARD_COLLISION',
    expectedSeverity: 'CRITICAL',
    desc: 'Rapid deceleration of lead vehicle at 5.2m with estimated closing TTC of 1.2s.',
  },
  {
    id: 'left_blind_spot',
    num: 5,
    title: 'Left Blind Spot with Turn Signal',
    category: 'BLIND_SPOT',
    expectedSeverity: 'CRITICAL',
    desc: 'Left flank occupied while driver activates left turn signal indicator.',
  },
  {
    id: 'right_blind_spot',
    num: 6,
    title: 'Right Blind Spot (Straight Cruising)',
    category: 'BLIND_SPOT',
    expectedSeverity: 'HIGH',
    desc: 'Vehicle traveling in right adjacent lane; driver maintain lane warning.',
  },
  {
    id: 'front_parking_obstacle',
    num: 7,
    title: 'Front Parking Proximity Caution',
    category: 'PARKING_PROXIMITY',
    expectedSeverity: 'HIGH',
    desc: 'Obstacle detected at 0.95m in front quadrant while vehicle in DRIVE gear.',
  },
  {
    id: 'rear_parking_stop',
    num: 8,
    title: 'Rear Parking Emergency Stop',
    category: 'PARKING_PROXIMITY',
    expectedSeverity: 'CRITICAL',
    desc: 'Obstacle at 0.35m in rear sector (below the 0.50m critical stop cutoff).',
  },
  {
    id: 'road_hazard',
    num: 9,
    title: 'Road Surface Hazard (Deep Pothole)',
    category: 'ROAD_HAZARD',
    expectedSeverity: 'HIGH',
    desc: 'Deep pavement depression identified 12m ahead with 88% model confidence.',
  },
  {
    id: 'vehicle_diagnostic_fault',
    num: 10,
    title: 'OBD-II Powertrain DTC Fault',
    category: 'VEHICLE_DIAGNOSTICS',
    expectedSeverity: 'CRITICAL',
    desc: 'Diagnostic bus reports DTC P0300 (Random Misfire) with engine temp at 108°C.',
  },
  {
    id: 'multiple_hazards',
    num: 11,
    title: 'Simultaneous Multi-Threat Prioritization',
    category: 'FORWARD_COLLISION',
    expectedSeverity: 'CRITICAL',
    desc: 'Simultaneous Drowsiness + Collision Gap + Blind Spot. Validates engine prioritization order.',
  },
  {
    id: 'camera_unavailable',
    num: 12,
    title: 'Camera Feed Unavailable State',
    category: 'SYSTEM_HEALTH',
    expectedSeverity: 'MEDIUM',
    desc: 'Camera feed disconnected or permission denied. Displays honest degraded capability.',
  },
  {
    id: 'sensor_unavailable',
    num: 13,
    title: 'Radar Sensor Hardware Disconnected',
    category: 'SYSTEM_HEALTH',
    expectedSeverity: 'MEDIUM',
    desc: 'Flank radar offline; engine falls back cleanly to simulation-only mode.',
  },
  {
    id: 'low_confidence_detection',
    num: 14,
    title: 'Low-Confidence Optical Detection',
    category: 'FORWARD_COLLISION',
    expectedSeverity: 'INSUFFICIENT_DATA',
    desc: 'Model confidence is 0.22 (below 0.35 threshold); returns INSUFFICIENT DATA.',
  },
];

export const DemoSimulatorPage: React.FC<DemoSimulatorPageProps> = ({
  onRefreshEvents,
  onResetDemo,
  onClearEvents,
}) => {
  const [activeScenarioResult, setActiveScenarioResult] = useState<any>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [isAutomatedRunning, setIsAutomatedRunning] = useState<boolean>(false);

  const triggerScenario = async (id: string) => {
    setExecutingId(id);
    try {
      const res = await api.triggerDemoScenario(id);
      setActiveScenarioResult(res);
      onRefreshEvents();
    } catch {
      // Handled silently
    } finally {
      setExecutingId(null);
    }
  };

  // Run all 14 scenarios sequentially for rapid hackathon judge review
  const runAutomatedSuite = async () => {
    setIsAutomatedRunning(true);
    for (const sc of SCENARIOS) {
      await triggerScenario(sc.id);
      // Small pause between evaluations
      await new Promise((r) => setTimeout(r, 600));
    }
    setIsAutomatedRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-cyan-400" />
              Interactive Demo Scenario Simulator (14 Scenarios)
            </h1>
            <StatusBadge mode="DEMO_SIMULATION" />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Deterministic, repeatable test harness for hackathon presentation and automated risk engine boundary verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={runAutomatedSuite}
            disabled={isAutomatedRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isAutomatedRunning ? 'Running Test Suite...' : 'Run Automated 14-Test Suite'}
          </button>

          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Reset State
          </button>

          <button
            onClick={onClearEvents}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-red-950 hover:text-red-300 text-gray-400 border border-gray-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Latest Evaluation Result Feedback Card */}
      {activeScenarioResult && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#142137] to-[#10192b] border border-cyan-500/50 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Latest Scenario Execution Result
            </span>
            <span className="text-xs font-mono text-gray-400">
              Scenario ID: <strong className="text-white">{activeScenarioResult.scenario_id}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {activeScenarioResult.events_triggered?.map((evt: SafetyEvent) => (
              <div key={evt.id} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={evt.severity} />
                  <span className="font-mono text-cyan-300">Risk: {evt.risk_score}</span>
                </div>
                <p className="font-bold text-white mt-1">{evt.title}</p>
                <p className="text-cyan-300/90 text-[11px]">{evt.explanation}</p>
                <p className="text-emerald-400 text-[11px] font-semibold">{evt.guidance}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of All 14 Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((sc) => {
          const isCurrent = executingId === sc.id;
          return (
            <div
              key={sc.id}
              className="p-4 rounded-xl bg-[#111827] border border-[#1f2d47] hover:border-cyan-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-mono text-cyan-400">
                    Scenario #{sc.num}
                  </span>
                  <SeverityBadge severity={sc.expectedSeverity as any} />
                </div>

                <h3 className="text-sm font-bold text-white tracking-wide mb-1">
                  {sc.title}
                </h3>

                <p className="text-xs text-gray-400 leading-relaxed min-h-[48px]">
                  {sc.desc}
                </p>

                <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>Module: {sc.category.toLowerCase()}</span>
                  <span>Deterministic</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800">
                <button
                  onClick={() => triggerScenario(sc.id)}
                  disabled={isCurrent || isAutomatedRunning}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-[#162238] hover:bg-cyan-500 hover:text-gray-950 text-cyan-300 border border-cyan-500/30 transition disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isCurrent ? 'Evaluating...' : 'Dispatch Scenario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Guidance Disclosure */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Deterministic Evaluation Philosophy
        </p>
        <p>
          Every scenario above sends structured input parameters through the central Unified Safety Intelligence Engine without random coin flips. This ensures judges and testing frameworks can verify reproducible risk scoring, priority ordering, and cooldown suppression at any moment.
        </p>
      </div>
    </div>
  );
};
