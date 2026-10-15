import React from 'react';
import { Menu, Volume2, VolumeX, RotateCcw, Wifi, ShieldCheck, Car } from 'lucide-react';
import { VehicleProfile, VehicleProfileType } from '../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  activeProfile: VehicleProfile | null;
  onSelectProfile: (id: VehicleProfileType) => void;
  audioMuted: boolean;
  onToggleMute: () => void;
  onResetDemo: () => void;
  serverOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  activeProfile,
  onSelectProfile,
  audioMuted,
  onToggleMute,
  onResetDemo,
  serverOnline,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0d131f]/90 backdrop-blur-md border-b border-[#1f2d47] px-4 md:px-6 flex items-center justify-between">
      {/* Left section: mobile hamburger + status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-gray-300 font-mono hidden sm:inline">
              {serverOnline ? 'BACKEND ONLINE' : 'OFFLINE MODE'}
            </span>
            <Wifi className="w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Tagline */}
          <span className="hidden lg:inline text-xs text-gray-400 border-l border-gray-700 pl-3">
            Intelligent Safety for Every Generation of Vehicle
          </span>
        </div>
      </div>

      {/* Right section: Profile selector + audio controls + reset */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Profile Quick-Selector */}
        <div className="flex items-center gap-1.5 bg-[#162032] border border-[#1f2d47] rounded-lg px-2.5 py-1 text-xs">
          <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={activeProfile?.id || 'OLDER_VEHICLE'}
            onChange={(e) => onSelectProfile(e.target.value as VehicleProfileType)}
            className="bg-transparent text-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="OLDER_VEHICLE" className="bg-gray-900 text-white">Older Vehicle (Retrofit)</option>
            <option value="MODERN_VEHICLE" className="bg-gray-900 text-white">Modern Vehicle (Factory ADAS)</option>
            <option value="CUSTOM_DEMO" className="bg-gray-900 text-white">Custom Demo Lab</option>
          </select>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={audioMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
          className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-700 text-xs flex items-center gap-1.5"
        >
          {audioMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline text-rose-400 font-mono">MUTED</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline text-cyan-400 font-mono">AUDIO ON</span>
            </>
          )}
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={onResetDemo}
          title="Reset Simulation State & Clear Session Events"
          className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-700 text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
