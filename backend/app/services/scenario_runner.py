"""
AutoGuardian AI - Interactive Demo Scenario Simulator
Executes 14 deterministic scenarios for hackathon evaluation and demonstration.
Updates simulation states, triggers explainable risk evaluations, and generates traceable events.
"""
from typing import Any, Dict, List, Optional
from app.models.schemas import (
    EventCategory,
    OperatingMode,
    RiskEvaluationInput,
    SafetyEvent,
)
from app.services.state_manager import state_manager


class ScenarioRunner:
    SCENARIO_CATALOG: Dict[str, Dict[str, Any]] = {
        "normal_operation": {
            "title": "1. Normal Attentive Driving",
            "description": "Driver alert, forward path clear, blind spots empty, diagnostics normal.",
            "category": EventCategory.DRIVER_ATTENTION,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "sustained_eye_closure": {
            "title": "2. Sustained Eye Closure (Drowsiness Hazard)",
            "description": "Driver eyes closed for 2.3 seconds continuously, exceeding the 1.5s critical threshold.",
            "category": EventCategory.DRIVER_ATTENTION,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "vehicle_detected_ahead": {
            "title": "3. Lead Vehicle Tracking at Safe Range",
            "description": "Neural model detects forward vehicle at 24.0m with nominal gap.",
            "category": EventCategory.FORWARD_COLLISION,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "high_collision_risk": {
            "title": "4. High Collision Risk Simulation",
            "description": "Lead vehicle rapid deceleration at 5.2m with estimated TTC of 1.2s.",
            "category": EventCategory.FORWARD_COLLISION,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "left_blind_spot": {
            "title": "5. Left Blind Spot Occupied (Turn Signal Active)",
            "description": "Vehicle in left flank while driver initiates left lane change signal.",
            "category": EventCategory.BLIND_SPOT,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "right_blind_spot": {
            "title": "6. Right Blind Spot Occupied (Cruising)",
            "description": "Adjacent vehicle detected in right blind spot while cruising straight.",
            "category": EventCategory.BLIND_SPOT,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "front_parking_obstacle": {
            "title": "7. Front Parking Proximity Caution",
            "description": "Bollard detected at 0.95m in front parking quadrant.",
            "category": EventCategory.PARKING_PROXIMITY,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "rear_parking_stop": {
            "title": "8. Rear Parking Emergency Stop",
            "description": "Imminent wall/pedestrian at 0.35m in rear sector (below 0.5m stop threshold).",
            "category": EventCategory.PARKING_PROXIMITY,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "road_hazard": {
            "title": "9. Road Hazard Surface Anomaly",
            "description": "Deep pothole identified 12m ahead with 88% visual classification confidence.",
            "category": EventCategory.ROAD_HAZARD,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "vehicle_diagnostic_fault": {
            "title": "10. Vehicle Diagnostic Fault (Check Engine)",
            "description": "Simulated OBD-II query reports DTC P0300 (Random Misfire) and engine temp 108°C.",
            "category": EventCategory.VEHICLE_DIAGNOSTICS,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "multiple_hazards": {
            "title": "11. Multiple Simultaneous Hazards",
            "description": "Drowsy driver + forward collision hazard + blind spot occupied. Tests risk prioritization.",
            "category": EventCategory.FORWARD_COLLISION,
            "mode": OperatingMode.DEMO_SIMULATION,
        },
        "camera_unavailable": {
            "title": "12. Camera Feed Unavailable",
            "description": "Camera disconnected or permission denied. Displays honest degraded capability state.",
            "category": EventCategory.SYSTEM_HEALTH,
            "mode": OperatingMode.HARDWARE_NOT_CONNECTED,
        },
        "sensor_unavailable": {
            "title": "13. Ultrasonic / Radar Sensor Unavailable",
            "description": "Hardware sensor disconnected; falls back honestly to simulation-only mode.",
            "category": EventCategory.SYSTEM_HEALTH,
            "mode": OperatingMode.HARDWARE_NOT_CONNECTED,
        },
        "low_confidence_detection": {
            "title": "14. Low-Confidence Optical Detection",
            "description": "Model confidence is 0.22 (below 0.35 threshold); returns INSUFFICIENT DATA.",
            "category": EventCategory.FORWARD_COLLISION,
            "mode": OperatingMode.INSUFFICIENT_DATA,
        },
    }

    @classmethod
    def run_scenario(cls, scenario_id: str, custom_params: Optional[Dict[str, Any]] = None) -> List[SafetyEvent]:
        scenario = cls.SCENARIO_CATALOG.get(scenario_id)
        if not scenario:
            raise ValueError(f"Unknown scenario_id: {scenario_id}")

        params = custom_params or {}
        generated_events: List[SafetyEvent] = []

        if scenario_id == "normal_operation":
            state_manager.driver_state.update({
                "camera_active": True,
                "face_detected": True,
                "eye_closure_sec": 0.0,
                "ear_value": 0.34,
                "attention_score": 100,
            })
            state_manager.blind_spot_state.update({
                "left_occupied": False,
                "right_occupied": False,
                "turn_signal_active": None,
            })
            state_manager.parking_state.update({
                "front_distance_m": 3.0,
                "rear_distance_m": 3.0,
            })
            ev_input = RiskEvaluationInput(
                category=EventCategory.DRIVER_ATTENTION,
                source_module="driver_drowsiness_monitor",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={"face_detected": True, "camera_active": True, "eye_closure_sec": 0.0},
                confidence=0.98,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "sustained_eye_closure":
            closure = params.get("eye_closure_sec", 2.3)
            state_manager.driver_state.update({
                "camera_active": True,
                "face_detected": True,
                "eye_closure_sec": closure,
                "ear_value": 0.12,
                "attention_score": 15,
                "drowsiness_detected": True,
            })
            ev_input = RiskEvaluationInput(
                category=EventCategory.DRIVER_ATTENTION,
                source_module="driver_drowsiness_monitor",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "face_detected": True,
                    "camera_active": True,
                    "eye_closure_sec": closure,
                    "ear_value": 0.12,
                },
                confidence=0.95,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "vehicle_detected_ahead":
            ev_input = RiskEvaluationInput(
                category=EventCategory.FORWARD_COLLISION,
                source_module="forward_collision_detector",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "lead_vehicle_detected": True,
                    "estimated_distance_m": 24.0,
                    "lead_speed_kmh": 60.0,
                    "own_speed_kmh": 62.0,
                    "ttc_seconds": 12.0,
                },
                confidence=0.92,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "high_collision_risk":
            dist = params.get("estimated_distance_m", 5.2)
            ev_input = RiskEvaluationInput(
                category=EventCategory.FORWARD_COLLISION,
                source_module="forward_collision_detector",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "lead_vehicle_detected": True,
                    "estimated_distance_m": dist,
                    "lead_speed_kmh": 20.0,
                    "own_speed_kmh": 65.0,
                    "ttc_seconds": 1.2,
                },
                confidence=0.94,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "left_blind_spot":
            state_manager.blind_spot_state.update({
                "left_occupied": True,
                "right_occupied": False,
                "left_vehicle_distance_m": 2.2,
                "turn_signal_active": "left",
            })
            ev_input = RiskEvaluationInput(
                category=EventCategory.BLIND_SPOT,
                source_module="blind_spot_monitor",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "side": "left",
                    "occupied": True,
                    "turn_signal_active": True,
                    "simulated": True,
                },
                confidence=0.96,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "right_blind_spot":
            state_manager.blind_spot_state.update({
                "left_occupied": False,
                "right_occupied": True,
                "right_vehicle_distance_m": 3.1,
                "turn_signal_active": None,
            })
            ev_input = RiskEvaluationInput(
                category=EventCategory.BLIND_SPOT,
                source_module="blind_spot_monitor",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "side": "right",
                    "occupied": True,
                    "turn_signal_active": False,
                    "simulated": True,
                },
                confidence=0.93,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "front_parking_obstacle":
            dist = params.get("distance_m", 0.95)
            state_manager.parking_state.update({"front_distance_m": dist, "active_gear": "DRIVE"})
            ev_input = RiskEvaluationInput(
                category=EventCategory.PARKING_PROXIMITY,
                source_module="parking_assistance",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={"zone": "front", "distance_m": dist, "simulated": True},
                confidence=0.95,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "rear_parking_stop":
            dist = params.get("distance_m", 0.35)
            state_manager.parking_state.update({"rear_distance_m": dist, "active_gear": "REVERSE"})
            ev_input = RiskEvaluationInput(
                category=EventCategory.PARKING_PROXIMITY,
                source_module="parking_assistance",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={"zone": "rear", "distance_m": dist, "simulated": True},
                confidence=0.98,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "road_hazard":
            ev_input = RiskEvaluationInput(
                category=EventCategory.ROAD_HAZARD,
                source_module="road_hazard_scanner",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "hazard_type": "deep_pothole",
                    "distance_m": 12.0,
                    "severity_level": "severe",
                },
                confidence=0.88,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "vehicle_diagnostic_fault":
            state_manager.diagnostic_state.update({
                "check_engine_light": True,
                "engine_temp_c": 108.0,
                "battery_voltage": 12.1,
                "active_dtc_codes": ["P0300", "P0117"],
            })
            ev_input = RiskEvaluationInput(
                category=EventCategory.VEHICLE_DIAGNOSTICS,
                source_module="vehicle_diagnostics",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={
                    "dtc_codes": ["P0300", "P0117"],
                    "check_engine": True,
                    "engine_temp_c": 108.0,
                    "battery_voltage": 12.1,
                },
                confidence=1.0,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "multiple_hazards":
            # 1. Forward collision critical
            ev1 = RiskEvaluationInput(
                category=EventCategory.FORWARD_COLLISION,
                source_module="forward_collision_detector",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={"lead_vehicle_detected": True, "estimated_distance_m": 4.8, "ttc_seconds": 1.1},
                confidence=0.95,
            )
            # 2. Drowsiness high
            ev2 = RiskEvaluationInput(
                category=EventCategory.DRIVER_ATTENTION,
                source_module="driver_drowsiness_monitor",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={"face_detected": True, "eye_closure_sec": 1.8},
                confidence=0.92,
            )
            # 3. Left blind spot occupied
            ev3 = RiskEvaluationInput(
                category=EventCategory.BLIND_SPOT,
                source_module="blind_spot_monitor",
                mode=OperatingMode.DEMO_SIMULATION,
                evidence={"side": "left", "occupied": True, "turn_signal_active": False, "simulated": True},
                confidence=0.90,
            )
            for item in [ev1, ev2, ev3]:
                evt, _ = state_manager.record_event(item)
                generated_events.append(evt)

        elif scenario_id == "camera_unavailable":
            state_manager.driver_state.update({
                "camera_active": False,
                "face_detected": False,
                "attention_score": 0,
            })
            ev_input = RiskEvaluationInput(
                category=EventCategory.SYSTEM_HEALTH,
                source_module="camera_hardware_bridge",
                mode=OperatingMode.HARDWARE_NOT_CONNECTED,
                evidence={"component": "Driver Monitoring Camera", "status": "disconnected"},
                confidence=1.0,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "sensor_unavailable":
            ev_input = RiskEvaluationInput(
                category=EventCategory.SYSTEM_HEALTH,
                source_module="radar_sensor_interface",
                mode=OperatingMode.HARDWARE_NOT_CONNECTED,
                evidence={"component": "Side Flank Blind-Spot Radar", "status": "disconnected"},
                confidence=1.0,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        elif scenario_id == "low_confidence_detection":
            ev_input = RiskEvaluationInput(
                category=EventCategory.FORWARD_COLLISION,
                source_module="forward_collision_detector",
                mode=OperatingMode.INSUFFICIENT_DATA,
                evidence={"lead_vehicle_detected": True, "estimated_distance_m": 14.0},
                confidence=0.22,
            )
            evt, _ = state_manager.record_event(ev_input)
            generated_events.append(evt)

        return generated_events
