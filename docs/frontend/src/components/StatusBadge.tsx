import React from 'react';
import { OperatingMode } from '../types';

interface StatusBadgeProps {
  mode: OperatingMode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ mode, className = '' }) => {
  const configs: Record<OperatingMode, { label: string; bg: string; text: string; border: string; dot: string }> = {
    LIVE_CAMERA: {
      label: 'LIVE CAMERA',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-600/40',
      dot: 'bg-emerald-400 animate-pulse',
    },
    MODEL_PROCESSING: {
      label: 'MODEL PROCESSING',
      bg: 'bg-cyan-950/60',
      text: 'text-cyan-400',
      border: 'border-cyan-600/40',
      dot: 'bg-cyan-400 animate-pulse',
    },
    DEMO_SIMULATION: {
      label: 'DEMO SIMULATION',
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-600/40',
      dot: 'bg-amber-400',
    },
    HARDWARE_NOT_CONNECTED: {
      label: 'HARDWARE NOT CONNECTED',
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-600/40',
      dot: 'bg-rose-400',
    },
    INSUFFICIENT_DATA: {
      label: 'INSUFFICIENT DATA',
      bg: 'bg-slate-900/60',
      text: 'text-slate-400',
      border: 'border-slate-700/40',
      dot: 'bg-slate-500',
    },
  };

  const config = configs[mode] || configs.INSUFFICIENT_DATA;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
