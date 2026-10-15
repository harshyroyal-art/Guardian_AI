import React from 'react';
import {
  LayoutDashboard,
  Eye,
  Scan,
  ShieldAlert,
  Car,
  Navigation,
  AlertTriangle,
  Wrench,
  Bell,
  BarChart3,
  Sliders,
  Settings,
  PlayCircle,
  HelpCircle,
  Shield,
  X,
} from 'lucide-react';
import { PageId } from '../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unacknowledgedAlertsCount: number;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'driver_monitor', label: 'Driver Monitoring', icon: Eye, group: 'Active Vision ADAS' },
  { id: 'object_detection', label: 'Road & Object Detection', icon: Scan, group: 'Active Vision ADAS' },
  { id: 'collision_risk', label: 'Collision Risk Monitor', icon: ShieldAlert, group: 'Active Vision ADAS' },
  { id: 'blind_spot', label: 'Blind-Spot Assistance', icon: Car, group: 'Simulated Sensors' },
  { id: 'parking_assist', label: 'Parking Assistance', icon: Navigation, group: 'Simulated Sensors' },
  { id: 'road_hazard', label: 'Road Hazard Detection', icon: AlertTriangle, group: 'Simulated Sensors' },
  { id: 'diagnostics', label: 'Vehicle Diagnostics', icon: Wrench, group: 'Diagnostics & Systems' },
  { id: 'safety_alerts', label: 'Unified Safety Alerts', icon: Bell, group: 'Intelligence & Reports' },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, group: 'Intelligence & Reports' },
  { id: 'vehicle_profiles', label: 'Vehicle Profiles', icon: Sliders, group: 'Configuration' },
  { id: 'settings', label: 'Settings & Calibration', icon: Settings, group: 'Configuration' },
  { id: 'demo_simulator', label: 'Demo Simulator', icon: PlayCircle, badge: '14 Tests', group: 'Evaluation' },
  { id: 'about_safety', label: 'About & Limitations', icon: HelpCircle, group: 'Evaluation' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  unacknowledgedAlertsCount,
}) => {
  const renderNavLinks = () => {
    let currentGroup = '';

    return NAV_ITEMS.map((item) => {
      const isSelected = currentPage === item.id;
      const Icon = item.icon;
      const showGroupHeader = item.group && item.group !== currentGroup;
      if (item.group) currentGroup = item.group;

      return (
        <React.Fragment key={item.id}>
          {showGroupHeader && (
            <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              {item.group}
            </div>
          )}
          <button
            onClick={() => {
              onNavigate(item.id);
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition text-left ${
              isSelected
                ? 'bg-cyan-500/15 text-cyan-300 border-l-4 border-cyan-400 font-semibold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`} />
              <span className="truncate">{item.label}</span>
            </div>

            {item.id === 'safety_alerts' && unacknowledgedAlertsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold animate-pulse">
                {unacknowledgedAlertsCount}
              </span>
            ) : item.badge ? (
              <span className="px-1.5 py-0.2 bg-gray-800 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-mono">
                {item.badge}
              </span>
            ) : null}
          </button>
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0d131f] border-r border-[#1f2d47] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1f2d47] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                AutoGuardian <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">AI</span>
              </h1>
              <p className="text-[10px] text-gray-400 truncate max-w-[140px]">Universal ADAS Platform</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items scrollable */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {renderNavLinks()}
        </nav>

        {/* Prototype Warning-Only Notice */}
        <div className="p-3 border-t border-[#1f2d47] bg-[#090d15] text-[10px] text-gray-400">
          <p className="font-semibold text-gray-300">Software ADAS Prototype</p>
          <p className="text-gray-400 mt-0.5 leading-tight">
            Warning-only system. Never interferes with steering or brakes.
          </p>
        </div>
      </aside>
    </>
  );
};
