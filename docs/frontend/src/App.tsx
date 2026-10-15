import React, { useEffect, useState } from 'react';
import { PageId, SafetyEvent, VehicleProfile, VehicleProfileType } from './types';
import { api } from './services/api';
import { audioAlerts } from './utils/audioAlerts';

// Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ActiveAlertBanner } from './components/ActiveAlertBanner';

// 14 Application Pages
import { OverviewPage } from './pages/OverviewPage';
import { DriverMonitorPage } from './pages/DriverMonitorPage';
import { ObjectDetectionPage } from './pages/ObjectDetectionPage';
import { CollisionRiskPage } from './pages/CollisionRiskPage';
import { BlindSpotPage } from './pages/BlindSpotPage';
import { ParkingAssistPage } from './pages/ParkingAssistPage';
import { RoadHazardPage } from './pages/RoadHazardPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { SafetyAlertsPage } from './pages/SafetyAlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { VehicleProfilesPage } from './pages/VehicleProfilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoSimulatorPage } from './pages/DemoSimulatorPage';
import { AboutSafetyPage } from './pages/AboutSafetyPage';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Core application state
  const [activeProfile, setActiveProfile] = useState<VehicleProfile | null>(null);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [statusData, setStatusData] = useState<any>(null);

  // Poll state from backend
  const refreshTelemetry = async () => {
    try {
      const [statusRes, eventsRes] = await Promise.all([
        api.getStatus(),
        api.getEvents(50),
      ]);
      setStatusData(statusRes);
      setEvents(eventsRes);
      setActiveProfile(statusRes.active_profile);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Audio mute toggle
  const handleToggleMute = () => {
    const next = !audioMuted;
    setAudioMuted(next);
    audioAlerts.setMuted(next);
  };

  // Profile switch
  const handleSelectProfile = async (id: VehicleProfileType) => {
    try {
      const prof = await api.selectProfile(id);
      setActiveProfile(prof);
      refreshTelemetry();
    } catch {
      // Handled silently
    }
  };

  // Event acknowledge
  const handleAcknowledge = async (eventId: string) => {
    try {
      await api.acknowledgeEvent(eventId);
      refreshTelemetry();
    } catch {
      // Handled silently
    }
  };

  // Reset demo
  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      refreshTelemetry();
    } catch {
      // Handled silently
    }
  };

  // Clear events
  const handleClearEvents = async () => {
    try {
      await api.clearEvents();
      refreshTelemetry();
    } catch {
      // Handled silently
    }
  };

  // Quick scenario trigger
  const handleTriggerScenario = async (scenarioId: string) => {
    try {
      await api.triggerDemoScenario(scenarioId);
      refreshTelemetry();
    } catch {
      // Handled silently
    }
  };

  // Find topmost urgent unacknowledged hazard
  const activeTopEvent =
    events.find((e) => !e.acknowledged && (e.severity === 'CRITICAL' || e.severity === 'HIGH')) ||
    events.find((e) => !e.acknowledged && e.severity === 'MEDIUM') ||
    null;

  const unackCount = events.filter((e) => !e.acknowledged).length;

  // Render current page content
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <OverviewPage
            onNavigate={setCurrentPage}
            activeProfile={activeProfile}
            events={events}
            onAcknowledge={handleAcknowledge}
            onTriggerScenario={handleTriggerScenario}
            statusData={statusData}
          />
        );
      case 'driver_monitor':
        return (
          <DriverMonitorPage
            onTriggerScenario={handleTriggerScenario}
            onRefreshEvents={refreshTelemetry}
          />
        );
      case 'object_detection':
        return <ObjectDetectionPage onRefreshEvents={refreshTelemetry} />;
      case 'collision_risk':
        return <CollisionRiskPage onRefreshEvents={refreshTelemetry} />;
      case 'blind_spot':
        return <BlindSpotPage onRefreshEvents={refreshTelemetry} />;
      case 'parking_assist':
        return <ParkingAssistPage onRefreshEvents={refreshTelemetry} />;
      case 'road_hazard':
        return <RoadHazardPage onRefreshEvents={refreshTelemetry} />;
      case 'diagnostics':
        return <DiagnosticsPage onRefreshEvents={refreshTelemetry} />;
      case 'safety_alerts':
        return (
          <SafetyAlertsPage
            events={events}
            onAcknowledge={handleAcknowledge}
            onClearEvents={handleClearEvents}
          />
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'vehicle_profiles':
        return (
          <VehicleProfilesPage
            activeProfile={activeProfile}
            onSelectProfile={handleSelectProfile}
          />
        );
      case 'settings':
        return <SettingsPage />;
      case 'demo_simulator':
        return (
          <DemoSimulatorPage
            onRefreshEvents={refreshTelemetry}
            onResetDemo={handleResetDemo}
            onClearEvents={handleClearEvents}
          />
        );
      case 'about_safety':
        return <AboutSafetyPage />;
      default:
        return (
          <OverviewPage
            onNavigate={setCurrentPage}
            activeProfile={activeProfile}
            events={events}
            onAcknowledge={handleAcknowledge}
            onTriggerScenario={handleTriggerScenario}
            statusData={statusData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        unacknowledgedAlertsCount={unackCount}
      />

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          audioMuted={audioMuted}
          onToggleMute={handleToggleMute}
          onResetDemo={handleResetDemo}
          serverOnline={serverOnline}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Active Priority Alert Banner */}
          <ActiveAlertBanner
            event={activeTopEvent}
            onAcknowledge={handleAcknowledge}
            audioMuted={audioMuted}
            onToggleMute={handleToggleMute}
          />

          {/* Current Page Content */}
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
