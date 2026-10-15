# Explainable Unified Safety Intelligence Engine — Specification & Scoring Guide

AutoGuardian AI features a centralized, deterministic safety risk engine located in `backend/app/core/risk_engine.py`. Unlike "black-box" models, this engine provides full traceability, explainable logic, and calibrated thresholds.

---

## 1. Risk States & Priority Ordering

Every safety event is assigned a severity level and a prioritized weight:

| Risk Severity | Priority Rank | Risk Score Range | Color Code | Action Required |
| :--- | :---: | :---: | :---: | :--- |
| **CRITICAL** | 5 (Highest) | 85.0 – 100.0 | Red (`#ef4444`) | Immediate driver attention or emergency stop |
| **HIGH** | 4 | 70.0 – 84.9 | Orange (`#f97316`) | Caution: reduce speed or delay lane change |
| **MEDIUM** | 3 | 40.0 – 69.9 | Amber (`#f59e0b`) | Advisory: monitor developing traffic conditions |
| **LOW** | 2 | 15.0 – 39.9 | Blue (`#3b82f6`) | Nominal tracking at safe range |
| **NORMAL** | 1 | 0.0 – 14.9 | Emerald (`#10b981`) | Path clear, nominal vehicle state |
| **INSUFFICIENT_DATA**| 0 | Variable | Gray (`#64748b`) | Sensor offline, low confidence, or uncalibrated |

When multiple hazards occur simultaneously, the engine sorts active events:
1. Severity priority descending (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW` > `NORMAL` > `INSUFFICIENT_DATA`)
2. Risk score descending (e.g. 95.0 before 90.0)
3. Timestamp descending (newest first)

---

## 2. Category Scoring Rules

### A. Driver Drowsiness & Attention (`DRIVER_ATTENTION`)
- **Evidence**: `camera_active` (bool), `face_detected` (bool), `eye_closure_sec` (float), `ear_value` (float).
- **Rule 1 (Camera Inactive)**: If `camera_active` is False $\rightarrow$ `INSUFFICIENT_DATA`, score = 0.0.
  - *Explanation*: "Driver monitoring camera feed is offline or permissions not granted."
- **Rule 2 (Face Lost)**: If `face_detected` is False $\rightarrow$ `MEDIUM`, score = 50.0.
  - *Explanation*: "Face landmark detector did not identify a human face. Possible driver distraction or occlusion."
- **Rule 3 (Sustained Eye Closure Hazard)**: If `eye_closure_sec >= threshold` (Default: 1.5s) $\rightarrow$ `CRITICAL`, score = $85.0 + 10 \times (\text{closure} - \text{threshold})$.
  - *Explanation*: "Continuous eye closure exceeded configured critical threshold."
  - *Guidance*: "Driver attention warning. If you feel drowsy, stop at a safe location and rest."
- **Rule 4 (Prolonged Blink Vigilance)**: If `eye_closure_sec >= threshold * 0.65` $\rightarrow$ `HIGH`, score = 70.0.
- **Rule 5 (Nominal)**: Normal blinking (closure < 0.4s) $\rightarrow$ `NORMAL`, score = 10.0.

### B. Forward Collision (`FORWARD_COLLISION`)
- **Evidence**: `lead_vehicle_detected` (bool), `estimated_distance_m` (float), `lead_speed_kmh` (float), `own_speed_kmh` (float), `ttc_seconds` (float), `confidence` (float).
- **Rule 1 (Low Confidence Cutoff)**: If `confidence < 0.35` $\rightarrow$ `INSUFFICIENT_DATA`, score = 20.0.
  - *Explanation*: "Object detection confidence below 0.35 reliability threshold. Monocular tracking cannot verify obstacle."
- **Rule 2 (Critical Gap / TTC Breach)**: If `estimated_distance_m <= 6.0m` OR `ttc_seconds <= 1.8s` $\rightarrow$ `CRITICAL`, score = 95.0.
  - *Explanation*: "Lead vehicle critically close or time-to-collision below emergency braking margin."
  - *Guidance*: "Vehicle detected ahead. Assess the road and maintain a safe following distance."
- **Rule 3 (Advisory Caution)**: If `estimated_distance_m <= collision_distance_threshold` (Default: 15.0m) $\rightarrow$ `HIGH`, score = 75.0.
- **Rule 4 (Safe Tracking)**: If `estimated_distance_m > 25.0m` $\rightarrow$ `LOW`, score = 20.0.

### C. Blind-Spot Flank Assistance (`BLIND_SPOT`)
- **Evidence**: `side` ("left" / "right"), `occupied` (bool), `turn_signal_active` (bool), `simulated` (bool).
- **Rule 1 (Lane Change Conflict)**: If `occupied == True` AND `turn_signal_active == True` $\rightarrow$ `CRITICAL`, score = 92.0.
  - *Explanation*: "Conflict: turn signal active while flank sector reports an active vehicle."
  - *Guidance*: "Blind spot occupied — delay the lane change."
- **Rule 2 (Occupied While Cruising)**: If `occupied == True` AND `turn_signal_active == False` $\rightarrow$ `HIGH`, score = 70.0.
- **Rule 3 (Zone Clear)**: If `occupied == False` $\rightarrow$ `NORMAL`, score = 5.0.

### D. Parking Proximity (`PARKING_PROXIMITY`)
- **Evidence**: `zone` ("front" / "rear" / "left" / "right"), `distance_m` (float).
- **Rule 1 (Imminent Obstacle Stop)**: If `distance_m <= parking_stop_threshold` (Default: 0.50m) $\rightarrow$ `CRITICAL`, score = 95.0.
  - *Explanation*: "Proximity reading inside emergency stopping threshold."
  - *Guidance*: "Obstacle detected — halt vehicle movement immediately."
- **Rule 2 (Caution Proximity)**: If `distance_m <= parking_caution_threshold` (Default: 1.20m) $\rightarrow$ `HIGH`, score = 75.0.
- **Rule 3 (Outer Sensor Buffer)**: If `distance_m <= 2.20m` $\rightarrow$ `MEDIUM`, score = 40.0.

### E. Vehicle Diagnostics (`VEHICLE_DIAGNOSTICS`)
- **Evidence**: `dtc_codes` (list of strings), `check_engine` (bool), `engine_temp_c` (float), `battery_voltage` (float).
- **Rule 1 (Critical Faults)**: If severe DTC (P0300, P0217, P0524) OR `engine_temp_c >= 115°C` OR `battery_voltage < 11.2V` $\rightarrow$ `CRITICAL`, score = 90.0.
  - *Explanation*: "Telemetry reports conditions that may cause vehicle shutdown or mechanical damage."
  - *Guidance*: "Diagnostic warning — review reported fault. Inspect vehicle safely."
- **Rule 2 (Advisory Faults)**: If `check_engine == True` OR non-critical DTCs $\rightarrow$ `MEDIUM`, score = 60.0.

---

## 3. Duplicate Event Suppression & Cooldown

To prevent continuous repetitive auditory spam while driving:
- Every event is indexed by `(category, source_module, severity)`.
- If an event with the same key recurs within the configured cooldown window (`alert_cooldown_seconds`, default: 3.0s), acoustic and spoken voice announcements are suppressed.
- `CRITICAL` severity events bypass non-critical cooldowns when conditions escalate, ensuring safety-critical hazards are never silenced.

---

## 4. Automated Pytest Verification

The risk engine is covered by automated unit tests in `backend/tests/test_risk_engine.py`:
- `test_driver_monitoring_sustained_closure`: Verifies critical scoring on 2.2s closure.
- `test_driver_monitoring_attentive`: Verifies normal scoring on regular blinks.
- `test_driver_monitoring_camera_offline`: Verifies honest `INSUFFICIENT_DATA`.
- `test_forward_collision_critical_proximity`: Verifies critical scoring on 4.5m gap.
- `test_forward_collision_low_confidence_suppression`: Verifies suppression on confidence < 0.35.
- `test_blind_spot_turn_signal_conflict`: Verifies critical conflict resolution.
- `test_parking_proximity_emergency_stop`: Verifies 0.3m stop cutoff.
- `test_vehicle_diagnostics_critical_code`: Verifies DTC P0300 severity.
- `test_duplicate_event_cooldown`: Verifies cooldown window suppression across timestamps.
