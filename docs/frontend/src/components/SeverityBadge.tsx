import React from 'react';
import { RiskSeverity } from '../types';

interface SeverityBadgeProps {
  severity: RiskSeverity;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const configs: Record<RiskSeverity, { label: string; bg: string; text: string; border: string }> = {
    CRITICAL: {
      label: 'CRITICAL',
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/50',
    },
    HIGH: {
      label: 'HIGH',
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/50',
    },
    MEDIUM: {
      label: 'MEDIUM',
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/50',
    },
    LOW: {
      label: 'LOW',
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      border: 'border-blue-500/40',
    },
    NORMAL: {
      label: 'NORMAL',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
    },
    INSUFFICIENT_DATA: {
      label: 'INSUFFICIENT DATA',
      bg: 'bg-gray-700/30',
      text: 'text-gray-400',
      border: 'border-gray-600/40',
    },
  };

  const config = configs[severity] || configs.INSUFFICIENT_DATA;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
};
