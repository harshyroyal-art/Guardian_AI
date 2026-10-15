import {
  AnalyticsSummary,
  ImageDetectionResponse,
  SafetyEvent,
  SystemSettings,
  VehicleProfile,
  VehicleProfileType,
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async getEvents(limit: number = 50): Promise<SafetyEvent[]> {
    const res = await fetch(`${API_BASE}/events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async acknowledgeEvent(eventId: string) {
    const res = await fetch(`${API_BASE}/events/${eventId}/acknowledge`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to acknowledge event');
    return res.json();
  },

  async clearEvents() {
    const res = await fetch(`${API_BASE}/events`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear events');
    return res.json();
  },

  getExportCsvUrl() {
    return `${API_BASE}/events/export-csv`;
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getProfiles(): Promise<{ active_profile_id: VehicleProfileType; profiles: VehicleProfile[] }> {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) throw new Error('Failed to fetch profiles');
    return res.json();
  },

  async selectProfile(profileId: VehicleProfileType): Promise<VehicleProfile> {
    const res = await fetch(`${API_BASE}/profiles/${profileId}/select`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to select profile');
    return res.json();
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getDemoScenarios() {
    const res = await fetch(`${API_BASE}/demo/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch demo scenarios');
    return res.json();
  },

  async triggerDemoScenario(scenarioId: string, params?: Record<string, any>) {
    const res = await fetch(`${API_BASE}/demo/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, params }),
    });
    if (!res.ok) throw new Error('Failed to trigger demo scenario');
    return res.json();
  },

  async resetDemo() {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  },

  async uploadDetectionImage(file: File): Promise<ImageDetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/detection/image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Image detection failed');
    }
    return res.json();
  },

  async sendDriverTelemetry(telemetry: {
    face_detected: boolean;
    eyes_detected: boolean;
    ear_value: number;
    yawning?: boolean;
    head_droop?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/driver-monitoring/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry),
    });
    if (!res.ok) throw new Error('Failed to send driver telemetry');
    return res.json();
  },

  async getDiagnostics() {
    const res = await fetch(`${API_BASE}/diagnostics`);
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },

  async updateDiagnostics(payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/diagnostics/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update diagnostics');
    return res.json();
  },

  async getBlindSpot() {
    const res = await fetch(`${API_BASE}/blind-spot`);
    if (!res.ok) throw new Error('Failed to fetch blind-spot state');
    return res.json();
  },

  async updateBlindSpot(payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/blind-spot/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update blind-spot state');
    return res.json();
  },

  async getParking() {
    const res = await fetch(`${API_BASE}/parking`);
    if (!res.ok) throw new Error('Failed to fetch parking state');
    return res.json();
  },

  async updateParking(payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/parking/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update parking state');
    return res.json();
  },
};
