"""
AutoGuardian AI - FastAPI API Endpoints
Provides REST APIs for dashboard telemetry, risk evaluations, genuine computer vision detection,
driver monitoring, sensor simulations, vehicle profiles, settings, analytics, and demo scenarios.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from pydantic import BaseModel

from app.models.schemas import (
    AnalyticsSummary,
    CapabilityState,
    DemoScenarioRequest,
    ImageDetectionResponse,
    RiskEvaluationInput,
    SafetyEvent,
    SystemSettings,
    VehicleProfile,
    VehicleProfileType,
)
from app.services.detection_service import detection_service
from app.services.driver_monitor import driver_monitor_service
from app.services.scenario_runner import ScenarioRunner
from app.services.state_manager import state_manager

router = APIRouter()


# ---------------- System Health & Status ----------------

@router.get("/health")
def get_health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "AutoGuardian AI Safety Intelligence Backend",
        "version": "1.0.0",
        "model_status": detection_service.model_status,
        "active_profile": state_manager.current_profile.name,
    }


@router.get("/status")
def get_status() -> Dict[str, Any]:
    analytics = state_manager.get_analytics()
    return {
        "active_profile": state_manager.current_profile,
        "critical_high_count": analytics.active_critical_high_count,
        "total_events": analytics.total_events,
        "average_risk_score": analytics.average_risk_score,
        "diagnostics": state_manager.diagnostic_state,
        "blind_spot": state_manager.blind_spot_state,
        "parking": state_manager.parking_state,
        "driver_state": state_manager.driver_state,
    }


# ---------------- Safety Events & Risk Engine ----------------

@router.get("/events", response_model=List[SafetyEvent])
def list_events(limit: int = 50) -> List[SafetyEvent]:
    return state_manager.get_prioritized_events(limit=limit)


@router.post("/events", response_model=SafetyEvent)
def record_event(payload: RiskEvaluationInput) -> SafetyEvent:
    event, _ = state_manager.record_event(payload)
    return event


@router.post("/events/{event_id}/acknowledge")
def acknowledge_event(event_id: str) -> Dict[str, Any]:
    evt = state_manager.acknowledge_event(event_id)
    if not evt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event {event_id} not found."
        )
    return {"message": "Event acknowledged successfully.", "event": evt}


@router.delete("/events")
def clear_events() -> Dict[str, str]:
    state_manager.clear_events()
    return {"message": "All session safety events cleared."}


@router.get("/events/export-csv")
def export_events_csv() -> Response:
    csv_content = state_manager.export_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=autoguardian_safety_events.csv"},
    )


# ---------------- Analytics & Summary ----------------

@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics() -> AnalyticsSummary:
    return state_manager.get_analytics()


# ---------------- Vehicle Profiles ----------------

@router.get("/profiles")
def get_profiles() -> Dict[str, Any]:
    return {
        "active_profile_id": state_manager.active_profile_id.value,
        "profiles": [p.dict() for p in state_manager.profiles.values()],
    }


@router.post("/profiles/{profile_id}/select", response_model=VehicleProfile)
def select_profile(profile_id: VehicleProfileType) -> VehicleProfile:
    return state_manager.set_active_profile(profile_id)


# ---------------- System Settings ----------------

@router.get("/settings", response_model=SystemSettings)
def get_settings() -> SystemSettings:
    return state_manager.settings


@router.put("/settings", response_model=SystemSettings)
def update_settings(new_settings: SystemSettings) -> SystemSettings:
    state_manager.settings = new_settings
    state_manager.risk_engine.update_settings(new_settings)
    detection_service.risk_engine.update_settings(new_settings)
    driver_monitor_service.risk_engine.update_settings(new_settings)
    return state_manager.settings


# ---------------- Interactive Demo Simulator ----------------

@router.get("/demo/scenarios")
def list_demo_scenarios() -> Dict[str, Any]:
    return {
        "scenarios": [
            {"id": k, **v} for k, v in ScenarioRunner.SCENARIO_CATALOG.items()
        ]
    }


@router.post("/demo/scenario")
def trigger_scenario(request: DemoScenarioRequest) -> Dict[str, Any]:
    try:
        events = ScenarioRunner.run_scenario(request.scenario_id, request.params)
        return {
            "scenario_id": request.scenario_id,
            "status": "SUCCESS",
            "events_triggered": events,
            "message": f"Scenario '{request.scenario_id}' executed successfully.",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/demo/reset")
def reset_demo() -> Dict[str, str]:
    state_manager.clear_events()
    driver_monitor_service.reset_session()
    # Reset simulation components to nominal
    state_manager.blind_spot_state.update({
        "left_occupied": False,
        "right_occupied": False,
        "turn_signal_active": None,
    })
    state_manager.parking_state.update({
        "front_distance_m": 2.5,
        "rear_distance_m": 2.8,
        "active_gear": "PARK",
    })
    state_manager.diagnostic_state.update({
        "check_engine_light": False,
        "engine_temp_c": 90.0,
        "battery_voltage": 12.6,
        "active_dtc_codes": [],
    })
    state_manager.driver_state.update({
        "camera_active": False,
        "face_detected": False,
        "eye_closure_sec": 0.0,
        "attention_score": 100,
    })
    return {"message": "Demo state and session events have been reset to nominal default."}


# ---------------- Computer Vision & Object Detection ----------------

@router.post("/detection/image", response_model=ImageDetectionResponse)
async def detect_image(file: UploadFile = File(...)) -> ImageDetectionResponse:
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided must be an image (JPEG, PNG, WebP).",
        )
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds maximum limit of 15MB.",
        )

    res = detection_service.detect_objects_in_image(contents, file.filename or "upload.jpg")
    if res.risk_event:
        state_manager.events.insert(0, res.risk_event)
    return res


# ---------------- Driver Monitoring ----------------

class DriverTelemetryInput(BaseModel):
    face_detected: bool = True
    eyes_detected: bool = True
    ear_value: float = 0.32
    yawning: bool = False
    head_droop: bool = False


@router.post("/driver-monitoring/telemetry")
def process_driver_telemetry(payload: DriverTelemetryInput) -> Dict[str, Any]:
    result = driver_monitor_service.analyze_frame(telemetry=payload.dict())
    state_manager.driver_state.update({
        "camera_active": True,
        "face_detected": result["face_detected"],
        "eye_closure_sec": result["eye_closure_sec"],
        "ear_value": result["ear_value"],
        "attention_score": result["attention_score"],
    })
    if result["risk_event"]:
        state_manager.events.insert(0, result["risk_event"])
    return result


@router.post("/driver-monitoring/frame")
async def process_driver_frame(file: UploadFile = File(...)) -> Dict[str, Any]:
    contents = await file.read()
    result = driver_monitor_service.analyze_frame(image_bytes=contents)
    state_manager.driver_state.update({
        "camera_active": True,
        "face_detected": result["face_detected"],
        "eye_closure_sec": result["eye_closure_sec"],
        "ear_value": result["ear_value"],
        "attention_score": result["attention_score"],
    })
    if result["risk_event"]:
        state_manager.events.insert(0, result["risk_event"])
    return result


# ---------------- Diagnostics & Simulation State Updates ----------------

class DiagnosticsUpdate(BaseModel):
    check_engine_light: Optional[bool] = None
    engine_temp_c: Optional[float] = None
    battery_voltage: Optional[float] = None
    active_dtc_codes: Optional[List[str]] = None


@router.get("/diagnostics")
def get_diagnostics() -> Dict[str, Any]:
    return state_manager.diagnostic_state


@router.post("/diagnostics/update")
def update_diagnostics(payload: DiagnosticsUpdate) -> Dict[str, Any]:
    data = payload.dict(exclude_none=True)
    state_manager.diagnostic_state.update(data)
    # Trigger risk evaluation if codes or lights changed
    from app.models.schemas import EventCategory, OperatingMode
    ev_input = RiskEvaluationInput(
        category=EventCategory.VEHICLE_DIAGNOSTICS,
        source_module="vehicle_diagnostics",
        mode=OperatingMode.DEMO_SIMULATION,
        evidence={
            "dtc_codes": state_manager.diagnostic_state["active_dtc_codes"],
            "check_engine": state_manager.diagnostic_state["check_engine_light"],
            "engine_temp_c": state_manager.diagnostic_state["engine_temp_c"],
            "battery_voltage": state_manager.diagnostic_state["battery_voltage"],
        },
        confidence=1.0,
    )
    evt, _ = state_manager.record_event(ev_input)
    return {"diagnostic_state": state_manager.diagnostic_state, "event": evt}


class BlindSpotUpdate(BaseModel):
    left_occupied: Optional[bool] = None
    right_occupied: Optional[bool] = None
    left_vehicle_distance_m: Optional[float] = None
    right_vehicle_distance_m: Optional[float] = None
    turn_signal_active: Optional[str] = None  # "left", "right", None


@router.get("/blind-spot")
def get_blind_spot() -> Dict[str, Any]:
    return state_manager.blind_spot_state


@router.post("/blind-spot/update")
def update_blind_spot(payload: BlindSpotUpdate) -> Dict[str, Any]:
    data = payload.dict(exclude_none=True)
    state_manager.blind_spot_state.update(data)
    events = []

    # Check left side
    if state_manager.blind_spot_state.get("left_occupied"):
        ev_l = RiskEvaluationInput(
            category=EventCategory.BLIND_SPOT,
            source_module="blind_spot_monitor",
            mode=OperatingMode.DEMO_SIMULATION,
            evidence={
                "side": "left",
                "occupied": True,
                "turn_signal_active": state_manager.blind_spot_state.get("turn_signal_active") == "left",
                "simulated": True,
            },
            confidence=0.95,
        )
        evt_l, _ = state_manager.record_event(ev_l)
        events.append(evt_l)

    # Check right side
    if state_manager.blind_spot_state.get("right_occupied"):
        ev_r = RiskEvaluationInput(
            category=EventCategory.BLIND_SPOT,
            source_module="blind_spot_monitor",
            mode=OperatingMode.DEMO_SIMULATION,
            evidence={
                "side": "right",
                "occupied": True,
                "turn_signal_active": state_manager.blind_spot_state.get("turn_signal_active") == "right",
                "simulated": True,
            },
            confidence=0.95,
        )
        evt_r, _ = state_manager.record_event(ev_r)
        events.append(evt_r)

    return {"blind_spot_state": state_manager.blind_spot_state, "events": events}


class ParkingUpdate(BaseModel):
    front_distance_m: Optional[float] = None
    rear_distance_m: Optional[float] = None
    left_distance_m: Optional[float] = None
    right_distance_m: Optional[float] = None
    active_gear: Optional[str] = None


@router.get("/parking")
def get_parking() -> Dict[str, Any]:
    return state_manager.parking_state


@router.post("/parking/update")
def update_parking(payload: ParkingUpdate) -> Dict[str, Any]:
    data = payload.dict(exclude_none=True)
    state_manager.parking_state.update(data)
    gear = state_manager.parking_state.get("active_gear", "PARK")
    events = []

    if gear == "REVERSE":
        ev = RiskEvaluationInput(
            category=EventCategory.PARKING_PROXIMITY,
            source_module="parking_assistance",
            mode=OperatingMode.DEMO_SIMULATION,
            evidence={
                "zone": "rear",
                "distance_m": state_manager.parking_state["rear_distance_m"],
                "simulated": True,
            },
            confidence=0.96,
        )
        evt, _ = state_manager.record_event(ev)
        events.append(evt)
    elif gear == "DRIVE":
        ev = RiskEvaluationInput(
            category=EventCategory.PARKING_PROXIMITY,
            source_module="parking_assistance",
            mode=OperatingMode.DEMO_SIMULATION,
            evidence={
                "zone": "front",
                "distance_m": state_manager.parking_state["front_distance_m"],
                "simulated": True,
            },
            confidence=0.96,
        )
        evt, _ = state_manager.record_event(ev)
        events.append(evt)

    return {"parking_state": state_manager.parking_state, "events": events}
