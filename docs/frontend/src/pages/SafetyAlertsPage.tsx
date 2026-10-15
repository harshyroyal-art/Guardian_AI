import React, { useState } from 'react';
import {
  Bell,
  Download,
  Trash2,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Filter,
  Search,
  Check,
} from 'lucide-react';
import { EventCategory, RiskSeverity, SafetyEvent } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface SafetyAlertsPageProps {
  events: SafetyEvent[];
  onAcknowledge: (id: string) => void;
  onClearEvents: () => void;
}

export const SafetyAlertsPage: React.FC<SafetyAlertsPageProps> = ({
  events,
  onAcknowledge,
  onClearEvents,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((e) => {
    if (selectedSeverity !== 'ALL' && e.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.explanation.toLowerCase().includes(q) ||
        e.source_module.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const unackCount = events.filter((e) => !e.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-cyan-400" />
              Unified Safety Intelligence Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {events.length} Total Events
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Central audit log of all safety engine evaluations, evidence telemetry, transparent rule explanations, and driver advisories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={api.getExportCsvUrl()}
            download="autoguardian_safety_events.csv"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>

          <button
            onClick={onClearEvents}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-red-950 hover:text-red-300 text-gray-300 border border-gray-700 hover:border-red-800 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear Events
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-[#1f2d47] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events, reasons, modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c121d] border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-[#0c121d] border border-gray-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-gray-900">All Severities</option>
              <option value="CRITICAL" className="bg-gray-900 text-red-400">CRITICAL</option>
              <option value="HIGH" className="bg-gray-900 text-orange-400">HIGH</option>
              <option value="MEDIUM" className="bg-gray-900 text-amber-400">MEDIUM</option>
              <option value="LOW" className="bg-gray-900 text-blue-400">LOW</option>
              <option value="NORMAL" className="bg-gray-900 text-emerald-400">NORMAL</option>
              <option value="INSUFFICIENT_DATA" className="bg-gray-900 text-gray-400">INSUFFICIENT DATA</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0c121d] border border-gray-800 rounded-lg px-2.5 py-1.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-gray-900">All Categories</option>
              <option value="DRIVER_ATTENTION" className="bg-gray-900">Driver Attention</option>
              <option value="FORWARD_COLLISION" className="bg-gray-900">Forward Collision</option>
              <option value="BLIND_SPOT" className="bg-gray-900">Blind Spot</option>
              <option value="PARKING_PROXIMITY" className="bg-gray-900">Parking Proximity</option>
              <option value="ROAD_HAZARD" className="bg-gray-900">Road Hazard</option>
              <option value="VEHICLE_DIAGNOSTICS" className="bg-gray-900">Vehicle Diagnostics</option>
              <option value="SYSTEM_HEALTH" className="bg-gray-900">System Health</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-[#111827] rounded-2xl border border-dashed border-gray-800">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-70" />
          <p className="text-base font-bold text-white">No Matching Safety Events</p>
          <p className="text-xs text-gray-400 mt-1">
            {events.length === 0
              ? 'No safety events in current session. Trigger a demo scenario or upload an image.'
              : 'No events match the selected filters or search terms.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-4 md:p-5 rounded-2xl border transition ${
                evt.acknowledged
                  ? 'bg-[#0e1522] border-gray-800 opacity-60'
                  : evt.severity === 'CRITICAL'
                  ? 'bg-red-950/25 border-red-500/50 shadow-md shadow-red-950/20'
                  : evt.severity === 'HIGH'
                  ? 'bg-orange-950/25 border-orange-500/50 shadow-md shadow-orange-950/20'
                  : 'bg-[#111827] border-[#1f2d47]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={evt.severity} />
                    <StatusBadge mode={evt.mode} />
                    <span className="text-xs font-mono text-cyan-400">
                      Risk: <strong>{evt.risk_score}</strong>/100
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      Conf: {(evt.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                      {evt.source_module}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide">
                    {evt.title}
                  </h3>

                  <p className="text-xs md:text-sm text-gray-300">
                    {evt.message}
                  </p>

                  <div className="p-3 rounded-xl bg-[#090d15] border border-gray-800/80 space-y-1 text-xs">
                    <p className="text-cyan-300">
                      <span className="font-bold text-gray-300">Transparent Reasoning:</span>{' '}
                      {evt.explanation}
                    </p>
                    <p className="text-emerald-400">
                      <span className="font-bold text-gray-300">Advisory Action:</span>{' '}
                      {evt.guidance}
                    </p>
                  </div>
                </div>

                {/* Right Action: Acknowledge */}
                <div className="shrink-0 flex items-center gap-2 self-end md:self-start">
                  {evt.acknowledged ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
                      <Check className="w-4 h-4" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => onAcknowledge(evt.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-900 hover:bg-gray-200 transition shadow"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
