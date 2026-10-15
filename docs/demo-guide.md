# AutoGuardian AI — Hackathon Demonstration & Evaluation Guide

This guide provides a structured 3–5 minute hackathon demonstration script designed for hackathon judges, evaluators, and peer engineers.

---

## 1. 3–5 Minute Hackathon Presentation Script

### Minute 0:00 – 0:45: The Problem & Solution Pitch
- **Opening Statement**: *"Over 60% of vehicles on roads today lack modern Advanced Driver Assistance Systems (ADAS). Older cars don't have cameras or radar, leaving drivers vulnerable to fatigue and blind-spot collisions. AutoGuardian AI is an affordable, universal software safety assistant that bridges this divide."*
- **The Core Innovation**: *"Our central innovation is the **Explainable Unified Safety Intelligence Engine**, which takes commodity laptop or phone cameras, runs real neural computer vision, evaluates risks deterministically, suppresses duplicate alarms, and provides transparent, actionable guidance."*

### Minute 0:45 – 1:30: Vehicle Profiles & Genuine Neural Detection
- Navigate to **Vehicle Profiles** page:
  - Demonstrate switching from **Older Vehicle (Universal Retrofit)** to **Modern Vehicle (Factory ADAS)**.
  - Show how the capability matrix updates dynamically and how modern mode activates duplicate suppression.
- Navigate to **Road & Object Detection** page:
  - Upload a test dashboard image or street scene.
  - Click **Run Neural Inference**.
  - Point out real bounding boxes, detected classes (cars, pedestrians, trucks), confidence scores, and optical proximity hints powered by Ultralytics YOLOv8n.

### Minute 1:30 – 2:30: Driver Monitoring & Attention Tracking
- Navigate to **Driver Monitoring** page:
  - Click **Start Browser Camera** to show real-time webcam feed with Eye Aspect Ratio (EAR) tracking.
  - Or use the **Drowsiness Simulator** slider: move the slider to 2.3 seconds of eye closure.
  - Point out:
    1. Warning chime sounds immediately via Web Audio API.
    2. Spoken voice alert announces: *"Driver attention warning. If you feel drowsy, stop at a safe location and rest."*
    3. Notice how normal blinks (0.2s) are suppressed, and only sustained closure breaches the critical threshold.

### Minute 2:30 – 3:30: Blind-Spot, Parking & Collision Scenarios
- Navigate to **Blind-Spot Assistance**:
  - Show the top-down vehicle diagram.
  - Turn on **Left Turn Signal** while **Left Vehicle** is present.
  - Watch the indicator turn red and trigger a critical conflict warning: *"Left blind spot occupied — delay the lane change."*
  - Toggle to **Physical Hardware Mode** to showcase the honest `HARDWARE NOT CONNECTED` badge rather than faking a physical radar connection.
- Navigate to **Parking Assistance**:
  - Drag the rear obstacle slider down to **0.35m** (below the 0.50m stop threshold).
  - Hear the acoustic warning beeps and observe the emergency stop prompt.

### Minute 3:30 – 4:30: Multi-Threat Prioritization & Diagnostics
- Navigate to **Demo Simulator** page:
  - Click **Scenario #11: Simultaneous Multi-Threat Prioritization**.
  - Show the cockpit: three simultaneous hazards are triggered (Collision + Drowsiness + Blind Spot).
  - Point to the Active Alert Banner: the engine automatically elevates the `CRITICAL` Forward Collision / Drowsiness threat first, sorting by severity and risk score.
- Navigate to **Vehicle Diagnostics**:
  - Inspect simulated OBD-II fault codes (e.g. DTC P0300 Random Misfire).
  - Review the follow-up advice for vehicle service.

### Minute 4:30 – 5:00: Analytics, CSV Export & Conclusion
- Navigate to **Analytics & Reports**:
  - Point to real session charts: Severity distribution pie chart, Category bar chart, and Risk score timeline.
  - Click **Export Audit CSV** and show the downloaded CSV file containing event IDs, UTC timestamps, categories, severities, explanations, and acknowledgement statuses.
- **Closing Statement**: *"AutoGuardian AI is 100% warning-only, respectful of driver privacy, runs entirely on local consumer hardware without cloud fees, and brings intelligent safety to every generation of vehicle."*

---

## 2. Table of 14 Deterministic Evaluation Scenarios

| # | Scenario ID | Target Subsystem | Expected Severity | Key Trigger Condition |
| :-: | :--- | :--- | :---: | :--- |
| **1** | `normal_operation` | Driver Attention | `NORMAL` | Face attentive, blinks < 0.3s, gap nominal |
| **2** | `sustained_eye_closure` | Driver Attention | `CRITICAL` | Eye closure = 2.3s (threshold: 1.5s) |
| **3** | `vehicle_detected_ahead` | Forward Collision | `LOW` | Lead car tracked at 24.0m range |
| **4** | `high_collision_risk` | Forward Collision | `CRITICAL` | Lead car at 5.2m, relative approach speed closing |
| **5** | `left_blind_spot` | Blind Spot | `CRITICAL` | Left flank occupied + Left turn signal active |
| **6** | `right_blind_spot` | Blind Spot | `HIGH` | Right flank occupied while cruising straight |
| **7** | `front_parking_obstacle` | Parking Proximity | `HIGH` | Obstacle at 0.95m in DRIVE gear (caution buffer) |
| **8** | `rear_parking_stop` | Parking Proximity | `CRITICAL` | Obstacle at 0.35m in REVERSE gear (< 0.5m stop) |
| **9** | `road_hazard` | Road Hazard | `HIGH` | Deep pothole detected at 12m ahead |
| **10**| `vehicle_diagnostic_fault` | Diagnostics | `CRITICAL` | DTC P0300 Misfire + Coolant Temp 108°C |
| **11**| `multiple_hazards` | Risk Engine | `CRITICAL` | Multi-hazard simultaneous prioritization test |
| **12**| `camera_unavailable` | System Health | `MEDIUM` | Webcam stream offline or permission denied |
| **13**| `sensor_unavailable` | System Health | `MEDIUM` | Physical radar offline; simulation fallback |
| **14**| `low_confidence_detection`| Forward Collision | `INSUFFICIENT_DATA` | Optical detection confidence = 0.22 (< 0.35 cutoff) |
