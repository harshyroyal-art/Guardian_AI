import React, { useState } from 'react';
import {
  Sliders,
  Car,
  CheckCircle,
  Shield,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import { CapabilityState, VehicleProfile, VehicleProfileType } from '../types';

interface VehicleProfilesPageProps {
  activeProfile: VehicleProfile | null;
  onSelectProfile: (id: VehicleProfileType) => void;
}

const ALL_PROFILES: VehicleProfile[] = [
  {
    id: 'OLDER_VEHICLE',
    name: 'Older Vehicle (Universal Retrofit Mode)',
    year_range: 'Pre-2015 / No Factory ADAS Equipment',
    description:
      'Engineered for older vehicles lacking factory radar, cameras, or driver monitoring sensors. AutoGuardian AI provides all ADAS capabilities via smartphone/laptop computer vision, audio chime warnings, and modular sensor simulations.',
    capabilities: {
      driver_monitoring: 'AVAILABLE IN SOFTWARE',
      forward_collision: 'AVAILABLE IN SOFTWARE',
      blind_spot: 'SIMULATION ONLY',
      parking_assist: 'SIMULATION ONLY',
      road_hazard: 'AVAILABLE IN SOFTWARE',
      diagnostics: 'SIMULATION ONLY',
    },
    factory_adas_present: false,
    suppress_factory_duplicates: false,
  },
  {
    id: 'MODERN_VEHICLE',
    name: 'Modern Vehicle (Supplement & Duplicate Suppression)',
    year_range: '2016+ / Equipped with Factory ADAS',
    description:
      'Engineered for vehicles equipped with factory forward collision braking and blind-spot sensors. AutoGuardian AI acts as a secondary cognitive verification layer and intelligently suppresses duplicate auditory alerts when factory systems are active.',
    capabilities: {
      driver_monitoring: 'AVAILABLE IN SOFTWARE',
      forward_collision: 'AVAILABLE IN SOFTWARE',
      blind_spot: 'REQUIRES HARDWARE',
      parking_assist: 'REQUIRES HARDWARE',
      road_hazard: 'AVAILABLE IN SOFTWARE',
      diagnostics: 'REQUIRES HARDWARE',
    },
    factory_adas_present: true,
    suppress_factory_duplicates: true,
  },
  {
    id: 'CUSTOM_DEMO',
    name: 'Hackathon Evaluation & Custom Lab Bench',
    year_range: 'Universal Evaluation Environment',
    description:
      'Open test-bench configuration designed for judges, developers, and educators. Allows dynamic switching between synthetic sensor injections and real-time vision inputs.',
    capabilities: {
      driver_monitoring: 'AVAILABLE IN SOFTWARE',
      forward_collision: 'AVAILABLE IN SOFTWARE',
      blind_spot: 'SIMULATION ONLY',
      parking_assist: 'SIMULATION ONLY',
      road_hazard: 'AVAILABLE IN SOFTWARE',
      diagnostics: 'SIMULATION ONLY',
    },
    factory_adas_present: false,
    suppress_factory_duplicates: false,
  },
];

export const VehicleProfilesPage: React.FC<VehicleProfilesPageProps> = ({
  activeProfile,
  onSelectProfile,
}) => {
  const currentId = activeProfile?.id || 'OLDER_VEHICLE';

  const getCapabilityBadge = (state: CapabilityState) => {
    switch (state) {
      case 'AVAILABLE IN SOFTWARE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'LIVE INPUT CONNECTED':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800 animate-pulse';
      case 'SIMULATION ONLY':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'REQUIRES HARDWARE':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'REQUIRES MODEL':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Sliders className="w-6 h-6 text-cyan-400" />
              Vehicle Compatibility & Profile Architecture
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Configure vehicle generation profiles to adapt ADAS features, display honest hardware states, and suppress duplicate warnings on modern vehicles.
          </p>
        </div>
      </div>

      {/* Profiles Cards Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {ALL_PROFILES.map((prof) => {
          const isSelected = currentId === prof.id;
          return (
            <div
              key={prof.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-[#15233b] to-[#10192a] border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-[#111827] border-[#1f2d47] hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-cyan-400">
                    <Car className="w-6 h-6" />
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">
                      <Check className="w-3.5 h-3.5" /> ACTIVE PROFILE
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white tracking-wide">{prof.name}</h3>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">{prof.year_range}</p>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">{prof.description}</p>

                {/* Capability Matrix */}
                <div className="mt-5 pt-4 border-t border-gray-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Capability Availability Matrix
                  </span>
                  {Object.entries(prof.capabilities).map(([mod, state]) => (
                    <div key={mod} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/40">
                      <span className="text-gray-300 capitalize">{mod.replace(/_/g, ' ')}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getCapabilityBadge(state)}`}>
                        {state}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Duplicate Suppression Flag */}
                <div className="mt-4 p-2.5 rounded-lg bg-black/30 border border-white/5 text-[11px] flex items-center justify-between">
                  <span className="text-gray-400">Factory Duplicate Suppression:</span>
                  <span className={`font-mono font-bold ${prof.suppress_factory_duplicates ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {prof.suppress_factory_duplicates ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => onSelectProfile(prof.id)}
                  disabled={isSelected}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-md'
                  }`}
                >
                  {isSelected ? 'Currently Selected' : `Activate ${prof.name.split('(')[0]}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety & Factory Disclaimer */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Vehicle Profile Transparency Disclaimer
        </p>
        <p>
          Selecting a vehicle profile configures software behavior and alert thresholds; it does not mechanically verify installed vehicle equipment. AutoGuardian AI acts as an advisory supplement and never overrides or disables certified factory automotive safety systems or legal driver responsibilities.
        </p>
      </div>
    </div>
  );
};
