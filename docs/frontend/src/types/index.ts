export type RiskSeverity =
  | 'NORMAL'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'INSUFFICIENT_DATA';

export type OperatingMode =
  | 'LIVE_CAMERA'
  | 'MODEL_PROCESSING'
  | 'DEMO_SIMULATION'
  | 'HARDWARE_NOT_CONNECTED'
  | 'INSUFFICIENT_DATA';

export type EventCategory =
  | 'DRIVER_ATTENTION'
  | 'FORWARD_COLLISION'
  | 'BLIND_SPOT'
  | 'PARKING_PROXIMITY'
  | 'ROAD_HAZARD'
  | 'VEHICLE_DIAGNOSTICS'
  | 'SYSTEM_HEALTH';

export type CapabilityState =
  | 'AVAILABLE IN SOFTWARE'
  | 'LIVE INPUT CONNECTED'
  | 'SIMULATION ONLY'
  | 'REQUIRES HARDWARE'
  | 'REQUIRES MODEL'
  | 'NOT CONFIGURED'
  | 'UNAVAILABLE';

export type VehicleProfileType =
  | 'OLDER_VEHICLE'
  | 'MODERN_VEHICLE'
  | 'CUSTOM_DEMO';

export interface VehicleProfile {
  id: VehicleProfileType;
  name: string;
  year_range: string;
  description: string;
  capabilities: Record<string, CapabilityState>;
  factory_adas_present: boolean;
  suppress_factory_duplicates: boolean;
}

export interface SafetyEvent {
  id: string;
  timestamp: string;
  category: EventCategory;
  source_module: string;
  severity: RiskSeverity;
  risk_score: number;
  confidence: number;
  mode: OperatingMode;
  title: string;
  message: string;
  explanation: string;
  guidance: string;
  supporting_evidence: Record<string, any>;
  acknowledged: boolean;
}

export interface SystemSettings {
  audio_alerts_enabled: boolean;
  spoken_voice_enabled: boolean;
  alert_cooldown_seconds: number;
  eye_closure_threshold_seconds: number;
  drowsiness_sensitivity: string;
  collision_distance_threshold_meters: number;
  parking_stop_threshold_meters: number;
  parking_caution_threshold_meters: number;
  demo_mode_enabled: boolean;
  camera_device_id?: string | null;
  data_retention_max_events: number;
}

export interface ObjectDetectionResult {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  label: string;
  confidence: number;
  estimated_proximity_hint?: string;
}

export interface ImageDetectionResponse {
  mode: OperatingMode;
  model_name: string;
  detections: ObjectDetectionResult[];
  summary: string;
  risk_event?: SafetyEvent | null;
}

export interface AnalyticsSummary {
  total_events: number;
  severity_counts: Record<string, number>;
  category_counts: Record<string, number>;
  mode_counts: Record<string, number>;
  average_risk_score: number;
  active_critical_high_count: number;
  unacknowledged_count: number;
  timeline: Array<{
    id: string;
    timestamp: string;
    risk_score: number;
    severity: string;
    category: string;
    title: string;
  }>;
}

export type PageId =
  | 'overview'
  | 'driver_monitor'
  | 'object_detection'
  | 'collision_risk'
  | 'blind_spot'
  | 'parking_assist'
  | 'road_hazard'
  | 'diagnostics'
  | 'safety_alerts'
  | 'analytics'
  | 'vehicle_profiles'
  | 'settings'
  | 'demo_simulator'
  | 'about_safety';
