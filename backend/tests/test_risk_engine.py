"""
Automated unit tests for the Explainable Unified Safety Intelligence Engine
Tests deterministic scoring, threshold boundaries, missing data handling, and explanations.
"""
import pytest
from app.core.risk_engine import RiskEngine
from app.models.schemas import (
    EventCategory,
    OperatingMode,
    RiskEvaluationInput,
    RiskSeverity,
    SystemSettings,
)


@pytest.fixture
def risk_engine():
    settings = SystemSettings(
        eye_closure_threshold_seconds=1.5,
        collision_distance_threshold_meters=15.0,
        parking_stop_threshold_meters=0.5,
        parking_caution_threshold_meters=1.2,
        alert_cooldown_seconds=3.0,
    )
    return RiskEngine(settings)


def test_driver_monitoring_sustained_closure(risk_engine):
    """Test sustained eye closure triggers CRITICAL drowsiness alert above threshold."""
    input_data = RiskEvaluationInput(
        category=EventCategory.DRIVER_ATTENTION,
        source_module="driver_drowsiness_monitor",
        mode=OperatingMode.LIVE_CAMERA,
        evidence={"face_detected": True, "camera_active": True, "eye_closure_sec": 2.2},
        confidence=0.95,
    )
    event, is_suppressed = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.CRITICAL
    assert event.risk_score >= 85.0
    assert "2.2" in event.explanation or "threshold" in event.explanation
    assert "rest" in event.guidance.lower()
    assert is_suppressed is False


def test_driver_monitoring_attentive(risk_engine):
    """Test normal blinking driver yields NORMAL severity."""
    input_data = RiskEvaluationInput(
        category=EventCategory.DRIVER_ATTENTION,
        source_module="driver_drowsiness_monitor",
        mode=OperatingMode.LIVE_CAMERA,
        evidence={"face_detected": True, "camera_active": True, "eye_closure_sec": 0.15},
        confidence=0.98,
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.NORMAL
    assert event.risk_score <= 15.0


def test_driver_monitoring_camera_offline(risk_engine):
    """Test inactive camera returns INSUFFICIENT_DATA with honest explanation."""
    input_data = RiskEvaluationInput(
        category=EventCategory.DRIVER_ATTENTION,
        source_module="driver_drowsiness_monitor",
        mode=OperatingMode.HARDWARE_NOT_CONNECTED,
        evidence={"face_detected": False, "camera_active": False, "eye_closure_sec": 0.0},
        confidence=1.0,
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.INSUFFICIENT_DATA
    assert "inactive" in event.explanation.lower() or "permissions" in event.explanation.lower()


def test_forward_collision_critical_proximity(risk_engine):
    """Test close forward vehicle triggers CRITICAL collision alert."""
    input_data = RiskEvaluationInput(
        category=EventCategory.FORWARD_COLLISION,
        source_module="forward_collision_detector",
        mode=OperatingMode.MODEL_PROCESSING,
        evidence={
            "lead_vehicle_detected": True,
            "estimated_distance_m": 4.5,
            "ttc_seconds": 1.1,
            "lead_speed_kmh": 30.0,
            "own_speed_kmh": 65.0,
        },
        confidence=0.94,
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.CRITICAL
    assert event.risk_score >= 90.0
    assert "following distance" in event.guidance.lower()


def test_forward_collision_low_confidence_suppression(risk_engine):
    """Test optical detection below confidence cutoff returns INSUFFICIENT_DATA."""
    input_data = RiskEvaluationInput(
        category=EventCategory.FORWARD_COLLISION,
        source_module="forward_collision_detector",
        mode=OperatingMode.MODEL_PROCESSING,
        evidence={"lead_vehicle_detected": True, "estimated_distance_m": 8.0},
        confidence=0.20,  # Below 0.35 cutoff
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.INSUFFICIENT_DATA
    assert "below reliability" in event.explanation.lower() or "confidence" in event.explanation.lower()


def test_blind_spot_turn_signal_conflict(risk_engine):
    """Test blind spot occupied with turn signal triggers CRITICAL conflict."""
    input_data = RiskEvaluationInput(
        category=EventCategory.BLIND_SPOT,
        source_module="blind_spot_monitor",
        mode=OperatingMode.DEMO_SIMULATION,
        evidence={"side": "left", "occupied": True, "turn_signal_active": True, "simulated": True},
        confidence=0.96,
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.CRITICAL
    assert "delay" in event.guidance.lower()


def test_parking_proximity_emergency_stop(risk_engine):
    """Test obstacle under stop threshold triggers CRITICAL proximity stop."""
    input_data = RiskEvaluationInput(
        category=EventCategory.PARKING_PROXIMITY,
        source_module="parking_assistance",
        mode=OperatingMode.DEMO_SIMULATION,
        evidence={"zone": "rear", "distance_m": 0.30, "simulated": True},
        confidence=0.98,
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.CRITICAL
    assert "halt" in event.guidance.lower() or "stop" in event.guidance.lower()


def test_vehicle_diagnostics_critical_code(risk_engine):
    """Test severe DTC code triggers diagnostic alert."""
    input_data = RiskEvaluationInput(
        category=EventCategory.VEHICLE_DIAGNOSTICS,
        source_module="vehicle_diagnostics",
        mode=OperatingMode.DEMO_SIMULATION,
        evidence={"dtc_codes": ["P0300"], "check_engine": True, "engine_temp_c": 116.0},
        confidence=1.0,
    )
    event, _ = risk_engine.evaluate(input_data)
    assert event.severity == RiskSeverity.CRITICAL
    assert "P0300" in event.explanation or "temp" in event.explanation.lower()


def test_duplicate_event_cooldown(risk_engine):
    """Test duplicate medium/high alerts within cooldown window are suppressed from audio spam."""
    input_data = RiskEvaluationInput(
        category=EventCategory.FORWARD_COLLISION,
        source_module="forward_collision_detector",
        mode=OperatingMode.MODEL_PROCESSING,
        evidence={"lead_vehicle_detected": True, "estimated_distance_m": 14.0},
        confidence=0.88,
    )
    # First occurrence at t=100.0
    _, is_suppressed_1 = risk_engine.evaluate(input_data, timestamp_epoch=100.0)
    assert is_suppressed_1 is False

    # Second occurrence at t=101.5 (within 3.0s cooldown)
    _, is_suppressed_2 = risk_engine.evaluate(input_data, timestamp_epoch=101.5)
    assert is_suppressed_2 is True

    # Third occurrence at t=104.5 (after cooldown elapsed)
    _, is_suppressed_3 = risk_engine.evaluate(input_data, timestamp_epoch=104.5)
    assert is_suppressed_3 is False
