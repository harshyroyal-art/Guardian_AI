"""
AutoGuardian AI - State Manager
Central in-memory state repository for safety events, vehicle profiles, system settings,
diagnostics, and sensor simulation states.
"""
from datetime import datetime, timezone
import io
import csv
from typing import Any, Dict, List, Optional, Tuple

from app.core.risk_engine import RiskEngine
from app.models.schemas import (
    AnalyticsSummary,
    CapabilityState,
    EventCategory,
    OperatingMode,
    RiskEvaluationInput,
    RiskSeverity,
    SafetyEvent,
    SystemSettings,
    VehicleProfile,
    VehicleProfileType,
)


class StateManager:
    def __init__(self):
        self.settings = SystemSettings()
        self.risk_engine = RiskEngine(self.settings)

        # Vehicle profiles
        self.profiles: Dict[VehicleProfileType, VehicleProfile] = {
            VehicleProfileType.OLDER_VEHICLE: VehicleProfile(
                id=VehicleProfileType.OLDER_VEHICLE,
                name="Older Vehicle (Universal Retrofit Mode)",
                year_range="Pre-2015 / No Factory ADAS",
                description="Older car with standard analog instrumentation and no factory sensors. All ADAS capabilities are provided via laptop/phone vision, audio alerts, and modular simulation.",
                capabilities={
                    "driver_monitoring": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "forward_collision": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "blind_spot": CapabilityState.SIMULATION_ONLY,
                    "parking_assist": CapabilityState.SIMULATION_ONLY,
                    "road_hazard": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "diagnostics": CapabilityState.SIMULATION_ONLY,
                },
                factory_adas_present=False,
                suppress_factory_duplicates=False,
            ),
            VehicleProfileType.MODERN_VEHICLE: VehicleProfile(
                id=VehicleProfileType.MODERN_VEHICLE,
                name="Modern Vehicle (Supplement & Duplicate Suppression)",
                year_range="2016+ / Equipped with Factory ADAS",
                description="Vehicle with existing factory ADAS. AutoGuardian AI acts as a secondary verification layer and suppresses duplicate alerts when factory systems are active.",
                capabilities={
                    "driver_monitoring": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "forward_collision": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "blind_spot": CapabilityState.REQUIRES_HARDWARE,
                    "parking_assist": CapabilityState.REQUIRES_HARDWARE,
                    "road_hazard": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "diagnostics": CapabilityState.REQUIRES_HARDWARE,
                },
                factory_adas_present=True,
                suppress_factory_duplicates=True,
            ),
            VehicleProfileType.CUSTOM_DEMO: VehicleProfile(
                id=VehicleProfileType.CUSTOM_DEMO,
                name="Hackathon Evaluation & Custom Lab Vehicle",
                year_range="Universal Prototype Environment",
                description="Customizable test bench profile allowing granular toggling between live camera feeds, synthetic sensor injections, and simulated hardware scenarios.",
                capabilities={
                    "driver_monitoring": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "forward_collision": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "blind_spot": CapabilityState.SIMULATION_ONLY,
                    "parking_assist": CapabilityState.SIMULATION_ONLY,
                    "road_hazard": CapabilityState.AVAILABLE_IN_SOFTWARE,
                    "diagnostics": CapabilityState.SIMULATION_ONLY,
                },
                factory_adas_present=False,
                suppress_factory_duplicates=False,
            ),
        }
        self.active_profile_id: VehicleProfileType = VehicleProfileType.OLDER_VEHICLE

        # Events list (in-memory)
        self.events: List[SafetyEvent] = []

        # Current diagnostic status
        self.diagnostic_state: Dict[str, Any] = {
            "vehicle_connected": False,
            "connection_type": "Simulated OBD-II Interface",
            "check_engine_light": False,
            "engine_temp_c": 90.0,
            "battery_voltage": 12.6,
            "active_dtc_codes": [],
            "dtc_history": [],
            "last_scan_time": datetime.now(timezone.utc).isoformat(),
        }

        # Current blind spot state
        self.blind_spot_state: Dict[str, Any] = {
            "left_occupied": False,
            "right_occupied": False,
            "left_vehicle_distance_m": 4.5,
            "right_vehicle_distance_m": 5.0,
            "turn_signal_active": None,  # "left", "right", None
            "mode": OperatingMode.DEMO_SIMULATION.value,
        }

        # Current parking proximity state
        self.parking_state: Dict[str, Any] = {
            "front_distance_m": 2.5,
            "rear_distance_m": 2.8,
            "left_distance_m": 1.5,
            "right_distance_m": 1.5,
            "active_gear": "PARK",  # "REVERSE", "DRIVE", "PARK"
            "mode": OperatingMode.DEMO_SIMULATION.value,
        }

        # Driver monitoring state
        self.driver_state: Dict[str, Any] = {
            "camera_active": False,
            "face_detected": False,
            "eye_closure_sec": 0.0,
            "ear_value": 0.32,
            "drowsiness_detected": False,
            "yawning_detected": False,
            "head_droop_detected": False,
            "attention_score": 100,
            "last_blink_timestamp": None,
        }

    @property
    def current_profile(self) -> VehicleProfile:
        return self.profiles[self.active_profile_id]

    def set_active_profile(self, profile_id: VehicleProfileType) -> VehicleProfile:
        if profile_id in self.profiles:
            self.active_profile_id = profile_id
        return self.current_profile

    def record_event(self, input_data: RiskEvaluationInput) -> Tuple[SafetyEvent, bool]:
        event, is_suppressed = self.risk_engine.evaluate(
            input_data=input_data,
            profile=self.current_profile,
        )

        # Store in session event log
        self.events.insert(0, event)

        # Cap memory retention
        max_events = self.settings.data_retention_max_events
        if len(self.events) > max_events:
            self.events = self.events[:max_events]

        return event, is_suppressed

    def acknowledge_event(self, event_id: str) -> Optional[SafetyEvent]:
        for e in self.events:
            if e.id == event_id:
                e.acknowledged = True
                return e
        return None

    def clear_events(self) -> None:
        self.events.clear()

    def get_prioritized_events(self, limit: int = 50) -> List[SafetyEvent]:
        return self.risk_engine.prioritize_events(self.events)[:limit]

    def get_analytics(self) -> AnalyticsSummary:
        total = len(self.events)
        sev_counts: Dict[str, int] = {s.value: 0 for s in RiskSeverity}
        cat_counts: Dict[str, int] = {c.value: 0 for c in EventCategory}
        mode_counts: Dict[str, int] = {m.value: 0 for m in OperatingMode}

        total_risk = 0.0
        crit_high = 0
        unack = 0

        timeline: List[Dict[str, Any]] = []

        for e in self.events:
            sev_counts[e.severity.value] = sev_counts.get(e.severity.value, 0) + 1
            cat_counts[e.category.value] = cat_counts.get(e.category.value, 0) + 1
            mode_counts[e.mode.value] = mode_counts.get(e.mode.value, 0) + 1
            total_risk += e.risk_score

            if e.severity in (RiskSeverity.CRITICAL, RiskSeverity.HIGH):
                crit_high += 1
            if not e.acknowledged:
                unack += 1

            if len(timeline) < 30:
                timeline.append({
                    "id": e.id,
                    "timestamp": e.timestamp,
                    "risk_score": e.risk_score,
                    "severity": e.severity.value,
                    "category": e.category.value,
                    "title": e.title,
                })

        avg_risk = round(total_risk / total, 1) if total > 0 else 0.0

        return AnalyticsSummary(
            total_events=total,
            severity_counts=sev_counts,
            category_counts=cat_counts,
            mode_counts=mode_counts,
            average_risk_score=avg_risk,
            active_critical_high_count=crit_high,
            unacknowledged_count=unack,
            timeline=list(reversed(timeline)),
        )

    def export_csv(self) -> str:
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "Event ID",
            "Timestamp (UTC)",
            "Category",
            "Severity",
            "Risk Score (0-100)",
            "Confidence (0-1)",
            "Operating Mode",
            "Source Module",
            "Title",
            "Explanation",
            "Guidance",
            "Acknowledged",
        ])

        for e in self.events:
            writer.writerow([
                e.id,
                e.timestamp,
                e.category.value,
                e.severity.value,
                e.risk_score,
                e.confidence,
                e.mode.value,
                e.source_module,
                e.title,
                e.explanation,
                e.guidance,
                "YES" if e.acknowledged else "NO",
            ])

        return output.getvalue()


# Global singleton
state_manager = StateManager()
