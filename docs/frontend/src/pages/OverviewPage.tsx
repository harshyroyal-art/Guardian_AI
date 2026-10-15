import React from 'react';
import {
  ShieldAlert,
  Eye,
  Car,
  Navigation,
  Wrench,
  AlertOctagon,
  CheckCircle,
  Play,
  ArrowRight,
  Sliders,
  Cpu,
} from 'lucide-react';
import { PageId, SafetyEvent, VehicleProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
  activeProfile: VehicleProfile | null;
  events: SafetyEvent[];
  onAcknowledge: (id: string) => void;
  onTriggerScenario: (id: string) => void;
  statusData: any;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  activeProfile,
  events,
  onAcknowledge,
  onTriggerScenario,
  statusData,
}) => {
  const driverState = statusData?.driver_state || {};
  const blindSpotState = statusData?.blind_spot || {};
  const parkingState = statusData?.parking || {};
  const diagState = statusData?.diagnostics || {};

  const activeThreats = events.filter((e) => !e.acknowledged && (e.severity === 'CRITICAL' || e.severity === 'HIGH'));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121c2e] via-[#16233b] to-[#0d1624] border border-[#1f3152]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
              Cockpit Safety Command
            </h1>
            <StatusBadge mode="MODEL_PROCESSING" />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Explainable Unified Safety Intelligence Engine actively monitoring all configured safety modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('demo_simulator')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Interactive Demo Simulator
          </button>
          <button
            onClick={() => onNavigate('vehicle_profiles')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Profile: {activeProfile?.name?.split('(')[0] || 'Older Vehicle'}
          </button>
        </div>
      </div>

      {/* Quick 1-Click Scenario Bar */}
      <div className="bg-[#111827] border border-[#1f2d47] rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-amber-400" />
            Quick Demo Triggers (Deterministic Simulation)
          </span>
          <button
            onClick={() => onNavigate('demo_simulator')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View all 14 scenarios <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => onTriggerScenario('sustained_eye_closure')}
            className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-left text-xs transition"
          >
            <p className="font-bold text-red-300">Drowsiness Alert</p>
            <p className="text-[10px] text-gray-400 truncate">2.3s Eye Closure</p>
          </button>

          <button
            onClick={() => onTriggerScenario('high_collision_risk')}
            className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-left text-xs transition"
          >
            <p className="font-bold text-red-300">Forward Collision</p>
            <p className="text-[10px] text-gray-400 truncate">5.2m Rapid Decel</p>
          </button>

          <button
            onClick={() => onTriggerScenario('left_blind_spot')}
            className="p-2 rounded-lg bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 text-left text-xs transition"
          >
            <p className="font-bold text-orange-300">Blind Spot Turn</p>
            <p className="text-[10px] text-gray-400 truncate">Left Flank Conflict</p>
          </button>

          <button
            onClick={() => onTriggerScenario('rear_parking_stop')}
            className="p-2 rounded-lg bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 text-left text-xs transition"
          >
            <p className="font-bold text-orange-300">Parking Proximity</p>
            <p className="text-[10px] text-gray-400 truncate">0.35m Wall/Bollard</p>
          </button>

          <button
            onClick={() => onTriggerScenario('vehicle_diagnostic_fault')}
            className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-left text-xs transition"
          >
            <p className="font-bold text-amber-300">OBD-II Fault</p>
            <p className="text-[10px] text-gray-400 truncate">DTC P0300 Misfire</p>
          </button>

          <button
            onClick={() => onTriggerScenario('multiple_hazards')}
            className="p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-left text-xs transition"
          >
            <p className="font-bold text-purple-300">Multiple Threats</p>
            <p className="text-[10px] text-gray-400 truncate">Priority Engine Test</p>
          </button>
        </div>
      </div>

      {/* Safety Module Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Driver Monitoring Card */}
        <div
          onClick={() => onNavigate('driver_monitor')}
          className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47] hover:border-cyan-500/50 cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Driver Attention</span>
              <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {driverState.attention_score ?? 100}% Alert
            </div>
            <p className="text-xs text-gray-400">
              {driverState.eye_closure_sec > 0
                ? `Eye closure: ${driverState.eye_closure_sec}s`
                : 'Face detected • Regular blinking'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-cyan-400">
            <span>Camera Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 2. Forward Collision Risk Card */}
        <div
          onClick={() => onNavigate('collision_risk')}
          className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47] hover:border-cyan-500/50 cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Forward Collision</span>
              <div className="p-1.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {events.some((e) => e.category === 'FORWARD_COLLISION' && e.severity === 'CRITICAL' && !e.acknowledged)
                ? 'CRITICAL GAP'
                : 'Safe Margin'}
            </div>
            <p className="text-xs text-gray-400">
              Monocular optical tracking with safety buffer
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-cyan-400">
            <span>Collision Monitor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 3. Blind Spot Card */}
        <div
          onClick={() => onNavigate('blind_spot')}
          className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47] hover:border-cyan-500/50 cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Blind Spot Radar</span>
              <div className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {blindSpotState.left_occupied
                ? 'Left Occupied'
                : blindSpotState.right_occupied
                ? 'Right Occupied'
                : 'Zones Clear'}
            </div>
            <p className="text-xs text-gray-400">
              {blindSpotState.turn_signal_active
                ? `Signal active: ${blindSpotState.turn_signal_active}`
                : 'No turn signal indicated'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-cyan-400">
            <span>Blind Spot Diagram</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 4. Parking & Diagnostics Card */}
        <div
          onClick={() => onNavigate('parking_assist')}
          className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47] hover:border-cyan-500/50 cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Parking Clearance</span>
              <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                <Navigation className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              R: {parkingState.rear_distance_m ?? 2.8}m • F: {parkingState.front_distance_m ?? 2.5}m
            </div>
            <p className="text-xs text-gray-400">
              Gear: {parkingState.active_gear || 'PARK'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-cyan-400">
            <span>Parking Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Active Safety Threats & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Threats List */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm md:text-base text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Active Safety Events & Intelligence Feed
              </h2>
              <p className="text-xs text-gray-400">
                Evaluated deterministically with explainable decision rules
              </p>
            </div>
            <button
              onClick={() => onNavigate('safety_alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              View Full Log ({events.length})
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-[#0c121d] rounded-xl border border-dashed border-gray-800">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-gray-300">All Systems Nominal</p>
              <p className="text-xs text-gray-500 mt-1">
                No active safety warnings. Trigger a demo scenario above to test the risk engine.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <div
                  key={e.id}
                  className={`p-3.5 rounded-xl border transition ${
                    e.acknowledged
                      ? 'bg-gray-900/40 border-gray-800 opacity-60'
                      : e.severity === 'CRITICAL'
                      ? 'bg-red-950/30 border-red-500/40'
                      : e.severity === 'HIGH'
                      ? 'bg-orange-950/30 border-orange-500/40'
                      : 'bg-[#152033] border-[#223250]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <SeverityBadge severity={e.severity} />
                        <StatusBadge mode={e.mode} />
                        <span className="text-[11px] font-mono text-gray-400">
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Risk: <strong className="text-white">{e.risk_score}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{e.title}</h4>
                      <p className="text-xs text-gray-300 mt-0.5">{e.message}</p>
                      <p className="text-xs text-cyan-300/90 mt-1">
                        <span className="font-semibold text-gray-400">Reason:</span> {e.explanation}
                      </p>
                    </div>

                    {!e.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(e.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 shrink-0"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Capability Summary */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Active Vehicle Profile
              </h3>
              <button
                onClick={() => onNavigate('vehicle_profiles')}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Change
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#0c121d] border border-gray-800 mb-4">
              <p className="text-sm font-bold text-white">{activeProfile?.name}</p>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">{activeProfile?.year_range}</p>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {activeProfile?.description}
              </p>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Configured Capabilities
            </h4>

            <div className="space-y-2 text-xs">
              {activeProfile &&
                Object.entries(activeProfile.capabilities).map(([key, state]) => (
                  <div key={key} className="flex items-center justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        state === 'AVAILABLE IN SOFTWARE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : state === 'SIMULATION ONLY'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {state}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-gray-900/60 border border-gray-800 text-[11px] text-gray-400">
            <p className="font-semibold text-gray-300">Retrofit Philosophy</p>
            <p className="mt-0.5">
              AutoGuardian AI bridges the technology divide, bringing modern computer-vision ADAS to older cars without factory sensors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
