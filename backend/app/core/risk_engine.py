"""
AutoGuardian AI - Explainable Unified Safety Intelligence Engine
Central deterministic risk assessment, prioritization, cooldown, and explanation module.
"""
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional, Tuple

from app.models.schemas import (
    EventCategory,
    OperatingMode,
    RiskEvaluationInput,
    RiskSeverity,
    SafetyEvent,
    SystemSettings,
    VehicleProfile,
)


class RiskEngine:
    """
    Explainable, deterministic safety risk engine that combines multi-modal evidence,
    applies configurable thresholds, prioritizes simultaneous threats, suppresses duplicates,
    and produces human-understandable explanations and advisory guidance.
    """

    SEVERITY_ORDER: Dict[RiskSeverity, int] = {
        RiskSeverity.CRITICAL: 5,
        RiskSeverity.HIGH: 4,
        RiskSeverity.MEDIUM: 3,
        RiskSeverity.LOW: 2,
        RiskSeverity.NORMAL: 1,
        RiskSeverity.INSUFFICIENT_DATA: 0,
    }

    def __init__(self, settings: Optional[SystemSettings] = None):
        self.settings: SystemSettings = settings or SystemSettings()
        # Cooldown tracking: key -> float timestamp (epoch seconds)
        self._last_event_timestamps: Dict[str, float] = {}

    def update_settings(self, new_settings: SystemSettings) -> None:
        self.settings = new_settings

    def evaluate(
        self,
        input_data: RiskEvaluationInput,
        profile: Optional[VehicleProfile] = None,
        timestamp_epoch: Optional[float] = None,
    ) -> Tuple[SafetyEvent, bool]:
        """
        Evaluate evidence input, calculate risk score and severity,
        generate explanation and advisory guidance, and check cooldown.

        Returns: (SafetyEvent, is_suppressed_duplicate)
        """
        now_dt = datetime.now(timezone.utc)
        iso_timestamp = now_dt.isoformat()
        now_epoch = timestamp_epoch if timestamp_epoch is not None else now_dt.timestamp()

        category = input_data.category
        source = input_data.source_module
        mode = input_data.mode
        evidence = input_data.evidence
        confidence = input_data.confidence if input_data.confidence is not None else 1.0

        # Evaluate based on category
        severity, risk_score, title, message, explanation, guidance = self._dispatch_evaluation(
            category=category,
            evidence=evidence,
            confidence=confidence,
            mode=mode,
            profile=profile,
        )

        # Check for duplicate suppression
        cooldown_key = f"{category.value}_{source}_{severity.value}"
        last_time = self._last_event_timestamps.get(cooldown_key, 0.0)
        cooldown_period = self.settings.alert_cooldown_seconds
        is_suppressed = (now_epoch - last_time) < cooldown_period and severity not in (
            RiskSeverity.CRITICAL,
        )

        if not is_suppressed:
            self._last_event_timestamps[cooldown_key] = now_epoch

        event_id = f"evt_{uuid.uuid4().hex[:10]}"
        event = SafetyEvent(
            id=event_id,
            timestamp=iso_timestamp,
            category=category,
            source_module=source,
            severity=severity,
            risk_score=round(max(0.0, min(100.0, risk_score)), 1),
            confidence=round(max(0.0, min(1.0, confidence)), 2),
            mode=mode,
            title=title,
            message=message,
            explanation=explanation,
            guidance=guidance,
            supporting_evidence=evidence,
            acknowledged=False,
        )

        return event, is_suppressed

    def prioritize_events(self, events: List[SafetyEvent]) -> List[SafetyEvent]:
        """
        Sort safety events by severity priority (CRITICAL > HIGH > MEDIUM > LOW > NORMAL > INSUFFICIENT),
        then by risk_score descending, then by timestamp descending.
        """
        return sorted(
            events,
            key=lambda e: (
                self.SEVERITY_ORDER.get(e.severity, 0),
                e.risk_score,
                e.timestamp,
            ),
            reverse=True,
        )

    # ----------------- Category Specific Evaluators -----------------

    def _dispatch_evaluation(
        self,
        category: EventCategory,
        evidence: Dict[str, Any],
        confidence: float,
        mode: OperatingMode,
        profile: Optional[VehicleProfile],
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        if category == EventCategory.DRIVER_ATTENTION:
            return self._eval_driver_attention(evidence, confidence)
        elif category == EventCategory.FORWARD_COLLISION:
            return self._eval_forward_collision(evidence, confidence)
        elif category == EventCategory.BLIND_SPOT:
            return self._eval_blind_spot(evidence, confidence)
        elif category == EventCategory.PARKING_PROXIMITY:
            return self._eval_parking_proximity(evidence, confidence)
        elif category == EventCategory.ROAD_HAZARD:
            return self._eval_road_hazard(evidence, confidence)
        elif category == EventCategory.VEHICLE_DIAGNOSTICS:
            return self._eval_diagnostics(evidence, confidence)
        elif category == EventCategory.SYSTEM_HEALTH:
            return self._eval_system_health(evidence, confidence, mode)
        else:
            return (
                RiskSeverity.INSUFFICIENT_DATA,
                0.0,
                "Unknown Category",
                "Unrecognized safety event received.",
                "The safety intelligence engine received an unrecognized event category.",
                "Ensure vehicle sensor integration operates normally.",
            )

    def _eval_driver_attention(
        self, evidence: Dict[str, Any], confidence: float
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        face_detected = evidence.get("face_detected", True)
        camera_active = evidence.get("camera_active", True)
        eye_closure_sec = float(evidence.get("eye_closure_sec", 0.0))
        yawning = bool(evidence.get("yawning", False))
        head_droop = bool(evidence.get("head_droop", False))

        if not camera_active:
            return (
                RiskSeverity.INSUFFICIENT_DATA,
                0.0,
                "Driver Camera Inactive",
                "Driver monitoring camera stream is offline.",
                "Driver monitoring cannot run because the camera feed is inactive or permissions are not granted.",
                "Verify camera connection and browser permissions.",
            )

        if not face_detected:
            return (
                RiskSeverity.MEDIUM,
                50.0,
                "Driver Face Not Detected",
                "Unable to detect driver face in current frame.",
                "The facial landmark detector did not identify a human face. Driver may be distracted, out-of-position, or obstructed.",
                "Adjust camera angle, ensure adequate cockpit lighting, and keep eyes on the road.",
            )

        threshold = self.settings.eye_closure_threshold_seconds

        if eye_closure_sec >= threshold:
            score = min(100.0, 85.0 + (eye_closure_sec - threshold) * 10.0)
            return (
                RiskSeverity.CRITICAL,
                score,
                "Drowsiness Detected: Sustained Eye Closure",
                f"Sustained eye closure for {eye_closure_sec:.1f}s exceeded critical threshold ({threshold:.1f}s).",
                f"Facial landmark analysis measured {eye_closure_sec:.2f} seconds of continuous eye closure, which exceeds the configured threshold of {threshold:.1f}s.",
                "Driver attention warning. If you feel drowsy, stop at a safe location and rest.",
            )
        elif eye_closure_sec >= (threshold * 0.65):
            score = 65.0 + (eye_closure_sec / threshold) * 15.0
            return (
                RiskSeverity.HIGH,
                score,
                "Driver Vigilance Warning: Prolonged Blink",
                f"Eye closure duration of {eye_closure_sec:.1f}s indicates microsleep or heavy fatigue.",
                f"Eye closure duration of {eye_closure_sec:.2f}s is approaching the safety cutoff threshold of {threshold:.1f}s.",
                "Driver vigilance alert. Maintain eye contact with the road ahead.",
            )
        elif yawning or head_droop:
            return (
                RiskSeverity.MEDIUM,
                55.0,
                "Driver Fatigue Indicators Detected",
                "Yawning or downward head tilt detected during continuous monitoring.",
                "Facial orientation and mouth openness metrics suggest early driver fatigue patterns.",
                "Fatigue indicator detected. Consider scheduling a rest stop soon.",
            )
        else:
            return (
                RiskSeverity.NORMAL,
                10.0,
                "Driver Attentive",
                "Driver is alert and facing forward.",
                "Normal blinking cycle detected and head posture is centered within safety tolerances.",
                "Continue attentive driving.",
            )

    def _eval_forward_collision(
        self, evidence: Dict[str, Any], confidence: float
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        lead_detected = bool(evidence.get("lead_vehicle_detected", False))
        if not lead_detected:
            return (
                RiskSeverity.NORMAL,
                5.0,
                "Forward Path Clear",
                "No lead vehicle or obstacle in forward trajectory.",
                "Computer vision model detected no vehicles or high-risk obstacles in immediate forward path.",
                "Maintain normal road scanning and safe following distance.",
            )

        if confidence < 0.35:
            return (
                RiskSeverity.INSUFFICIENT_DATA,
                20.0,
                "Unreliable Forward Detection",
                "Lead object detected but confidence is below reliability cutoff.",
                f"Object detection confidence of {confidence:.2f} is under the 0.35 threshold. Bounding box position cannot reliably confirm a forward collision hazard.",
                "Observe road manually; visual detection confidence is currently low.",
            )

        dist_m = evidence.get("estimated_distance_m")
        ttc = evidence.get("ttc_seconds")
        lead_speed_kmh = evidence.get("lead_speed_kmh", 0.0)
        own_speed_kmh = evidence.get("own_speed_kmh", 50.0)
        relative_speed = own_speed_kmh - lead_speed_kmh

        # If no distance measurement exists
        if dist_m is None:
            return (
                RiskSeverity.LOW,
                30.0,
                "Vehicle Detected Ahead",
                "Forward vehicle identified; physical distance requires sensor calibration.",
                "The neural model confirmed a forward vehicle, but optical monocular camera alone without sensor calibration cannot definitively measure metric distance.",
                "Vehicle detected ahead. Assess the road and maintain a safe following distance.",
            )

        dist_m = float(dist_m)
        stop_dist = self.settings.collision_distance_threshold_meters

        if dist_m <= 6.0 or (ttc is not None and float(ttc) <= 1.8):
            score = 95.0
            return (
                RiskSeverity.CRITICAL,
                score,
                "Forward Collision Hazard",
                f"Close lead vehicle at {dist_m:.1f}m (relative speed: {relative_speed:+.1f} km/h).",
                f"Obstacle distance ({dist_m:.1f}m) is critically close to or below safety braking envelope with TTC={ttc or 'N/A'}s.",
                "Vehicle detected ahead. Assess the road and maintain a safe following distance.",
            )
        elif dist_m <= stop_dist or (ttc is not None and float(ttc) <= 3.0):
            score = 75.0
            return (
                RiskSeverity.HIGH,
                score,
                "Reduced Following Distance",
                f"Lead vehicle at {dist_m:.1f}m. Safety margin is decreasing.",
                f"Following distance ({dist_m:.1f}m) has breached the configured advisory threshold of {stop_dist:.1f}m.",
                "Vehicle detected ahead. Assess the road and maintain a safe following distance.",
            )
        elif dist_m <= stop_dist * 1.8:
            return (
                RiskSeverity.MEDIUM,
                45.0,
                "Lead Vehicle Monitored",
                f"Lead vehicle detected at {dist_m:.1f}m in active lane.",
                f"Vehicle tracked within nominal caution buffer ({dist_m:.1f}m).",
                "Maintain steady following distance and monitor lead vehicle brake lights.",
            )
        else:
            return (
                RiskSeverity.LOW,
                20.0,
                "Lead Vehicle at Safe Range",
                f"Lead vehicle tracked at {dist_m:.1f}m.",
                f"Following gap ({dist_m:.1f}m) exceeds safe baseline margins.",
                "Continue standard driving vigilance.",
            )

    def _eval_blind_spot(
        self, evidence: Dict[str, Any], confidence: float
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        side = str(evidence.get("side", "left")).lower()
        occupied = bool(evidence.get("occupied", False))
        turn_signal = bool(evidence.get("turn_signal_active", False))
        simulated = bool(evidence.get("simulated", True))

        sim_tag = " (simulated scenario)" if simulated else ""

        if not occupied:
            return (
                RiskSeverity.NORMAL,
                5.0,
                f"{side.capitalize()} Blind Spot Clear{sim_tag}",
                f"No vehicles detected in {side} adjacent lane.",
                f"Zone sensors reported clear path in {side} flank sector.",
                "Standard lane checks apply before maneuvering.",
            )

        if turn_signal:
            return (
                RiskSeverity.CRITICAL,
                92.0,
                f"Critical: {side.capitalize()} Blind Spot Occupied{sim_tag}",
                f"Lane change indicator active while vehicle is present in {side} blind spot.",
                f"Conflict detected: turn signal is ON for {side} maneuver while {side} proximity sector reports an active vehicle.",
                f"{side.capitalize()} blind spot occupied{sim_tag}. Delay the lane change.",
            )
        else:
            return (
                RiskSeverity.HIGH,
                70.0,
                f"Vehicle in {side.capitalize()} Blind Spot{sim_tag}",
                f"Adjacent vehicle detected in {side} blind-spot zone.",
                f"Adjacent radar/ultrasonic simulation flagged presence in {side} flank envelope.",
                f"Be aware: vehicle in {side} blind spot. Delay lateral moves until clear.",
            )

    def _eval_parking_proximity(
        self, evidence: Dict[str, Any], confidence: float
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        zone = str(evidence.get("zone", "rear")).lower()
        dist_m = float(evidence.get("distance_m", 3.0))
        simulated = bool(evidence.get("simulated", True))
        sim_tag = " (simulated parking scenario)" if simulated else ""

        stop_th = self.settings.parking_stop_threshold_meters
        caution_th = self.settings.parking_caution_threshold_meters

        if dist_m <= stop_th:
            return (
                RiskSeverity.CRITICAL,
                95.0,
                f"STOP: {zone.capitalize()} Obstacle Imminent{sim_tag}",
                f"Obstacle in {zone} zone at {dist_m:.2f}m (Stop cutoff: {stop_th:.2f}m).",
                f"Proximity sensor reports object inside emergency stopping threshold ({dist_m:.2f}m <= {stop_th:.2f}m).",
                f"Rear obstacle detected{sim_tag} — halt vehicle movement.",
            )
        elif dist_m <= caution_th:
            return (
                RiskSeverity.HIGH,
                75.0,
                f"Caution: {zone.capitalize()} Obstacle Near{sim_tag}",
                f"Obstacle detected in {zone} zone at {dist_m:.2f}m.",
                f"Distance reading ({dist_m:.2f}m) is within the active parking caution boundary ({caution_th:.2f}m).",
                f"Approaching obstacle in {zone} zone. Maneuver slowly.",
            )
        elif dist_m <= 2.2:
            return (
                RiskSeverity.MEDIUM,
                40.0,
                f"{zone.capitalize()} Obstacle Detected{sim_tag}",
                f"Object detected at {dist_m:.2f}m.",
                f"Distance reading is within the outer parking sensor field.",
                "Continue maneuvering at low speed.",
            )
        else:
            return (
                RiskSeverity.NORMAL,
                5.0,
                f"{zone.capitalize()} Parking Area Clear{sim_tag}",
                f"No close obstacles in {zone} zone ({dist_m:.2f}m).",
                "Clearance is above parking sensor warning distance.",
                "Proceed with standard visual parking checks.",
            )

    def _eval_road_hazard(
        self, evidence: Dict[str, Any], confidence: float
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        hazard_type = str(evidence.get("hazard_type", "surface_anomaly"))
        dist_m = evidence.get("distance_m")
        severity_label = str(evidence.get("severity_level", "medium")).lower()

        if confidence < 0.35:
            return (
                RiskSeverity.INSUFFICIENT_DATA,
                20.0,
                "Possible Road Surface Anomaly",
                f"Potential {hazard_type} flagged with low visual confidence ({confidence:.2f}).",
                f"Model score of {confidence:.2f} does not meet the 0.35 confidence threshold for reliable hazard classification.",
                "Scan roadway surface attentively.",
            )

        if severity_label == "severe" or (dist_m is not None and float(dist_m) < 15.0):
            return (
                RiskSeverity.HIGH,
                80.0,
                f"Road Hazard: {hazard_type.replace('_', ' ').title()}",
                f"{hazard_type.replace('_', ' ').capitalize()} identified on roadway ahead ({dist_m or 'approx'}m).",
                f"Visual hazard detector identified {hazard_type} with {confidence*100:.0f}% confidence.",
                "Road hazard ahead. Safely assess surrounding traffic and prepare to navigate with care.",
            )
        else:
            return (
                RiskSeverity.MEDIUM,
                55.0,
                f"Caution: {hazard_type.replace('_', ' ').title()}",
                f"Road surface issue ({hazard_type.replace('_', ' ')}) ahead.",
                f"Detectable road imperfection identified with {confidence*100:.0f}% model confidence.",
                "Observe road surface conditions and adjust driving line safely.",
            )

    def _eval_diagnostics(
        self, evidence: Dict[str, Any], confidence: float
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        dtc_codes: List[str] = evidence.get("dtc_codes", [])
        engine_temp_c = evidence.get("engine_temp_c")
        battery_voltage = evidence.get("battery_voltage")
        check_engine = bool(evidence.get("check_engine", False))

        # Check critical faults
        critical_codes = {"P0300", "P0217", "P0524", "P0700"}
        found_crit = [c for c in dtc_codes if c.upper() in critical_codes]

        temp_crit = engine_temp_c is not None and float(engine_temp_c) >= 115.0
        volt_crit = battery_voltage is not None and float(battery_voltage) < 11.2

        if found_crit or temp_crit or volt_crit:
            reasons = []
            if found_crit:
                reasons.append(f"Severe DTC codes: {', '.join(found_crit)}")
            if temp_crit:
                reasons.append(f"Engine coolant temp {engine_temp_c}°C (>115°C critical)")
            if volt_crit:
                reasons.append(f"Electrical bus voltage {battery_voltage}V (<11.2V)")

            return (
                RiskSeverity.CRITICAL,
                90.0,
                "Critical Vehicle Diagnostic Alert",
                "; ".join(reasons),
                f"OBD-II simulated telemetry reported conditions that may cause vehicle shutdown or mechanical damage: {'; '.join(reasons)}.",
                "Diagnostic warning — review the reported fault. Inspect vehicle safely.",
            )
        elif check_engine or dtc_codes or (engine_temp_c is not None and float(engine_temp_c) >= 102.0):
            return (
                RiskSeverity.MEDIUM,
                60.0,
                "Vehicle Diagnostic Advisory",
                f"Fault reported: {', '.join(dtc_codes) if dtc_codes else 'Elevated engine parameters'}.",
                "Diagnostic monitor received non-critical fault notifications from powertrain control module.",
                "Diagnostic warning — review the reported fault. Service vehicle when convenient.",
            )
        else:
            return (
                RiskSeverity.NORMAL,
                5.0,
                "Vehicle Diagnostics Normal",
                "All reported powertrain and electrical telemetry within standard bounds.",
                "Diagnostic query reported no active DTCs, temperature normal, battery healthy.",
                "Vehicle operating within safe parameters.",
            )

    def _eval_system_health(
        self, evidence: Dict[str, Any], confidence: float, mode: OperatingMode
    ) -> Tuple[RiskSeverity, float, str, str, str, str]:
        component = str(evidence.get("component", "subsystem"))
        status = str(evidence.get("status", "unknown")).lower()

        if status in ("disconnected", "error", "permission_denied", "missing_weights"):
            return (
                RiskSeverity.MEDIUM,
                40.0,
                f"System Advisory: {component.title()} {status.replace('_', ' ').title()}",
                f"{component.title()} reports status: {status}.",
                f"Subsystem '{component}' is currently unavailable. Safety assistant operating with degraded inputs.",
                "Camera unavailable — driver monitoring is inactive. Exercise full manual driver vigilance.",
            )
        else:
            return (
                RiskSeverity.NORMAL,
                0.0,
                f"{component.title()} Operational",
                f"{component.title()} is active and communicating normally.",
                "Subsystem self-test reports operational status.",
                "System active.",
            )
