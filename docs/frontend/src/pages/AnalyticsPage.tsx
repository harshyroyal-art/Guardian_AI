import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { AnalyticsSummary } from '../types';
import { api } from '../services/api';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
  NORMAL: '#10b981',
  INSUFFICIENT_DATA: '#64748b',
};

const CATEGORY_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getAnalytics()
      .then((data) => setAnalytics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400">
        <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
        <p className="text-xs">Aggregating telemetry session analytics...</p>
      </div>
    );
  }

  const total = analytics?.total_events || 0;

  // Format data for severity chart
  const severityData = analytics
    ? Object.entries(analytics.severity_counts).map(([name, value]) => ({
        name,
        value,
        color: SEVERITY_COLORS[name] || '#94a3b8',
      })).filter((d) => d.value > 0)
    : [];

  // Format data for category chart
  const categoryData = analytics
    ? Object.entries(analytics.category_counts).map(([name, value], i) => ({
        name: name.replace(/_/g, ' '),
        value,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      })).filter((d) => d.value > 0)
    : [];

  // Format data for timeline chart
  const timelineData = analytics?.timeline.map((t, idx) => ({
    index: idx + 1,
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    risk: t.risk_score,
    title: t.title,
    severity: t.severity,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              Safety Analytics & Risk Intelligence Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {total} Total Evaluations
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Real-time analytics derived exclusively from actual verified session events and deterministic risk calculations.
          </p>
        </div>

        <a
          href={api.getExportCsvUrl()}
          download="autoguardian_safety_events.csv"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20"
        >
          <Download className="w-4 h-4" />
          Export Audit CSV
        </a>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Total Session Events</span>
          <div className="text-2xl font-black text-white mt-1">{total}</div>
          <p className="text-[11px] text-gray-400 mt-1">Logged in memory store</p>
        </div>

        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Critical & High Threats</span>
          <div className="text-2xl font-black text-red-400 mt-1">
            {analytics?.active_critical_high_count || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">High urgency warnings</p>
        </div>

        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Average Risk Score</span>
          <div className="text-2xl font-black text-cyan-300 mt-1">
            {analytics?.average_risk_score.toFixed(1) || 0}/100
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Weighted severity index</p>
        </div>

        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47]">
          <span className="text-xs text-gray-400 font-medium">Unacknowledged Alerts</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {analytics?.unacknowledged_count || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Pending driver confirmation</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-[#111827] rounded-2xl border border-dashed border-gray-800">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-70" />
          <p className="text-base font-bold text-white">No Telemetry Events Recorded Yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Charts render strictly from genuine session evaluations. Trigger demo scenarios or upload images to generate analytics.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Row 1: Timeline Line Chart */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Event Risk Score Timeline (Chronological)
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Continuous score fluctuation across safety evaluations.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2d47', borderRadius: '8px' }}
                    labelStyle={{ color: '#06b6d4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    name="Risk Score"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: '#06b6d4', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2: Severity Distribution + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                Severity Breakdown
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Distribution across priority levels.
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2d47', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Events by Source Category
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Activity volume per subsystem.
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="name" type="category" width={110} stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2d47', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" name="Event Count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
