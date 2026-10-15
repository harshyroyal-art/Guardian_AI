import React, { useEffect } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle, Info, ShieldAlert, Volume2, VolumeX, X } from 'lucide-react';
import { SafetyEvent } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { audioAlerts } from '../utils/audioAlerts';

interface ActiveAlertBannerProps {
  event: SafetyEvent | null;
  onAcknowledge: (id: string) => void;
  audioMuted: boolean;
  onToggleMute: () => void;
}

export const ActiveAlertBanner: React.FC<ActiveAlertBannerProps> = ({
  event,
  onAcknowledge,
  audioMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    if (event && !event.acknowledged) {
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        audioAlerts.playTone(event.severity);
        audioAlerts.speakAlert(event.guidance || event.message);
      }
    }
  }, [event?.id, event?.severity]);

  if (!event || event.acknowledged || event.severity === 'NORMAL') {
    return null;
  }

  const isCritical = event.severity === 'CRITICAL';
  const isHigh = event.severity === 'HIGH';

  const bannerBg = isCritical
    ? 'bg-gradient-to-r from-red-950/90 via-red-900/80 to-slate-900 border-red-500 shadow-lg shadow-red-950/50'
    : isHigh
    ? 'bg-gradient-to-r from-orange-950/90 via-amber-900/70 to-slate-900 border-orange-500 shadow-lg shadow-orange-950/40'
    : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/60';

  const iconColor = isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-amber-400';

  return (
    <div
      className={`relative w-full rounded-xl border p-4 mb-6 transition-all duration-300 animate-in fade-in ${bannerBg}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-lg bg-black/40 border border-white/10 shrink-0 ${iconColor}`}>
            {isCritical ? (
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            ) : isHigh ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <SeverityBadge severity={event.severity} />
              <StatusBadge mode={event.mode} />
              <span className="text-xs font-mono text-gray-400">
                Risk Score: <strong className="text-white">{event.risk_score}/100</strong>
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Source: {event.source_module.replace(/_/g, ' ')}
              </span>
            </div>

            <h3 className="text-base md:text-lg font-bold text-white tracking-wide">
              {event.title}
            </h3>

            <p className="text-sm text-gray-200 font-medium mt-0.5">
              {event.message}
            </p>

            <div className="mt-2 text-xs bg-black/40 rounded-lg p-2.5 border border-white/5 space-y-1">
              <p className="text-cyan-300">
                <span className="font-semibold text-gray-300">Decision Logic:</span> {event.explanation}
              </p>
              <p className="text-emerald-300">
                <span className="font-semibold text-gray-300">Advisory Guidance:</span> {event.guidance}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          <button
            onClick={onToggleMute}
            title={audioMuted ? 'Unmute Audio Warnings' : 'Mute Audio Warnings'}
            className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-700"
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => onAcknowledge(event.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-gray-900 hover:bg-gray-200 transition shadow"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Acknowledge Alert
          </button>
        </div>
      </div>
    </div>
  );
};
