"""
AutoGuardian AI - Pydantic Data Models & Schemas
Universal AI-Powered Vehicle Safety and Driver Assistance System
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RiskSeverity(str, Enum):
    NORMAL = "NORMAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class OperatingMode(str, Enum):
    LIVE_CAMERA = "LIVE_CAMERA"
    MODEL_PROCESSING = "MODEL_PROCESSING"
    DEMO_SIMULATION = "DEMO_SIMULATION"
    HARDWARE_NOT_CONNECTED = "HARDWARE_NOT_CONNECTED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class EventCategory(str, Enum):
    DRIVER_ATTENTION = "DRIVER_ATTENTION"
    FORWARD_COLLISION = "FORWARD_COLLISION"
    BLIND_SPOT = "BLIND_SPOT"
    PARKING_PROXIMITY = "PARKING_PROXIMITY"
    ROAD_HAZARD = "ROAD_HAZARD"
    VEHICLE_DIAGNOSTICS = "VEHICLE_DIAGNOSTICS"
    SYSTEM_HEALTH = "SYSTEM_HEALTH"


class CapabilityState(str, Enum):
    AVAILABLE_IN_SOFTWARE = "AVAILABLE IN SOFTWARE"
    LIVE_INPUT_CONNECTED = "LIVE INPUT CONNECTED"
    SIMULATION_ONLY = "SIMULATION ONLY"
    REQUIRES_HARDWARE = "REQUIRES HARDWARE"
    REQUIRES_MODEL = "REQUIRES MODEL"
    NOT_CONFIGURED = "NOT CONFIGURED"
    UNAVAILABLE = "UNAVAILABLE"


class VehicleProfileType(str, Enum):
    OLDER_VEHICLE = "OLDER_VEHICLE"
    MODERN_VEHICLE = "MODERN_VEHICLE"
    CUSTOM_DEMO = "CUSTOM_DEMO"


class VehicleProfile(BaseModel):
    id: VehicleProfileType = VehicleProfileType.OLDER_VEHICLE
    name: str = "Older Vehicle (Retrofit Mode)"
    year_range: str = "Pre-2015 / No Factory ADAS"
    description: str = "Older vehicle lacking built-in ADAS. Emphasizes all software and retrofitted capabilities."
    capabilities: Dict[str, CapabilityState] = Field(default_factory=lambda: {
        "driver_monitoring": CapabilityState.AVAILABLE_IN_SOFTWARE,
        "forward_collision": CapabilityState.AVAILABLE_IN_SOFTWARE,
        "blind_spot": CapabilityState.SIMULATION_ONLY,
        "parking_assist": CapabilityState.SIMULATION_ONLY,
        "road_hazard": CapabilityState.AVAILABLE_IN_SOFTWARE,
        "diagnostics": CapabilityState.SIMULATION_ONLY,
    })
    factory_adas_present: bool = False
    suppress_factory_duplicates: bool = False


class SafetyEvent(BaseModel):
    id: str
    timestamp: str
    category: EventCategory
    source_module: str
    severity: RiskSeverity
    risk_score: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0)
    mode: OperatingMode
    title: str
    message: str
    explanation: str
    guidance: str
    supporting_evidence: Dict[str, Any] = Field(default_factory=dict)
    acknowledged: bool = False


class SystemSettings(BaseModel):
    audio_alerts_enabled: bool = True
    spoken_voice_enabled: bool = True
    alert_cooldown_seconds: float = 3.0
    eye_closure_threshold_seconds: float = 1.5
    drowsiness_sensitivity: str = "NORMAL"  # "LOW", "NORMAL", "HIGH"
    collision_distance_threshold_meters: float = 15.0
    parking_stop_threshold_meters: float = 0.5
    parking_caution_threshold_meters: float = 1.2
    demo_mode_enabled: bool = True
    camera_device_id: Optional[str] = None
    data_retention_max_events: int = 500


class RiskEvaluationInput(BaseModel):
    category: EventCategory
    source_module: str
    mode: OperatingMode
    evidence: Dict[str, Any]
    confidence: Optional[float] = 1.0


class DemoScenarioRequest(BaseModel):
    scenario_id: str
    params: Optional[Dict[str, Any]] = None


class ObjectDetectionResult(BaseModel):
    box_2d: List[float] = Field(description="Normalized [ymin, xmin, ymax, xmax] or pixel [x, y, w, h]")
    label: str
    confidence: float
    estimated_proximity_hint: Optional[str] = None


class ImageDetectionResponse(BaseModel):
    mode: OperatingMode
    model_name: str
    detections: List[ObjectDetectionResult]
    summary: str
    risk_event: Optional[SafetyEvent] = None


class AnalyticsSummary(BaseModel):
    total_events: int
    severity_counts: Dict[str, int]
    category_counts: Dict[str, int]
    mode_counts: Dict[str, int]
    average_risk_score: float
    active_critical_high_count: int
    unacknowledged_count: int
    timeline: List[Dict[str, Any]]
