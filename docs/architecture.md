# AutoGuardian AI — System Architecture & Data Flow

AutoGuardian AI is a modular, universal AI-powered vehicle safety and driver assistance system designed to retrofit older vehicles and intelligently supplement modern vehicles.

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                            COCKPIT INTERACTION LAYER                             |
|                                                                                   |
|  [Student Laptop Browser (Chrome/Edge)]     <--->     [Android Phone on Local Wi-Fi]  |
|            (Host: 0.0.0.0:5173)                             (Client Display)     |
+-----------------------------------------------------------------------------------+
                                        |  REST API & Local HTTP Proxy
                                        v
+-----------------------------------------------------------------------------------+
|                        FRONTEND CLIENT (React 19 + TypeScript)                    |
|                                                                                   |
|  * 14 Integrated Pages               * Recharts Session Visualizers              |
|  * Persistent Navigation & Drawer    * Web Audio Synthetic Chimes                |
|  * MediaDevices Video Stream         * Web Speech API Spoken Advisory             |
|  * Canvas Bounding Box Overlays      * Dynamic Capability & Mode Badging          |
+-----------------------------------------------------------------------------------+
                                        |  HTTP REST Calls / Uploads
                                        v
+-----------------------------------------------------------------------------------+
|                        BACKEND ENGINE (FastAPI + Python 3.13)                     |
|                                                                                   |
|  [API Router: /api/*]                                                             |
|    |                                                                              |
|    +---> DetectionService (Genuine Ultralytics YOLOv8n + OpenCV Vision)           |
|    +---> DriverMonitorService (Haar Cascade Face/Eye Detection & EAR Tracking)    |
|    +---> StateManager (In-Memory Session Store, Profiles, Diagnostics, Simulation)|
|    +---> ScenarioRunner (14 Deterministic Hackathon Test Scenarios)               |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|             EXPLAINABLE UNIFIED SAFETY INTELLIGENCE ENGINE (core/risk_engine.py)  |
|                                                                                   |
|  * Deterministic Multi-Modal Risk Scoring (0.0 - 100.0)                           |
|  * Strict Severity Prioritization (CRITICAL > HIGH > MEDIUM > LOW > NORMAL)       |
|  * Duplicate Alert Cooldown Suppression (Default: 3.0s window)                    |
|  * Transparent Explainability Rules (Rule trigger, evidence, and guidance)        |
|  * Vehicle Profile Adaptation (Older Retrofit vs Modern Factory ADAS)             |
+-----------------------------------------------------------------------------------+
```

## 2. Core Subsystems

### A. Frontend (React 19, TypeScript, Tailwind CSS v4)
- **Modular Pages**: 14 distinct functional sections catering to driver attention, collision detection, blind spots, parking, diagnostics, analytics, profiles, and demo scenarios.
- **Auditory & Speech Feedback**:
  - `audioAlerts.ts` generates synthetic dual-tone warning chimes using the HTML5 `AudioContext` without requiring external sound files.
  - Browser Text-To-Speech (`SpeechSynthesis`) speaks non-repeating safety guidance with configurable cooldowns.
- **Cross-Device Responsiveness**: The UI adapts seamlessly between laptop screens and portrait/landscape Android smartphones.

### B. Backend (FastAPI, Uvicorn, Python 3.13)
- **High-Performance Asynchronous Endpoints**: Provides typed REST interfaces for event streams, image inference, driver telemetry, diagnostics, and settings.
- **In-Memory Volatile Session Store**: Ensures complete privacy. No camera frames, driver biometrics, or videos are written to persistent disk or transmitted to any third-party cloud.
- **Cross-Origin Resource Sharing (CORS)**: Configured to accept connections from local subnets so mobile devices on the same Wi-Fi can communicate with the backend.

### C. Computer Vision Pipeline
- **Genuine Neural Model**: Leverages `ultralytics` YOLOv8n (COCO 80-classes) for forward vehicle, pedestrian, truck, and obstacle detection.
- **Graceful OpenCV Fallback**: If neural weights are offline, falls back to OpenCV's built-in HOG (Histogram of Oriented Gradients) person detector and Haar cascade face/eye classifiers.
- **Honest Metric Distance**: Explicitly disclaims that monocular optical bounding box size alone does not establish physical distance without radar/lidar calibration.

---

## 3. Data Flow

1. **Input Stage**:
   - Live Webcam Feed / Uploaded Image / Synthetic Sensor Injection / Telemetry Slider.
2. **Analysis Stage**:
   - Model extracts detections: bounding boxes, labels, confidence scores, EAR values, closure seconds.
3. **Evaluation Stage**:
   - The central `RiskEngine` processes evidence through deterministic rules.
   - Evaluates whether values breach configured thresholds (e.g., eye closure >= 1.5s, distance <= 15m, DTC codes).
   - Determines severity and calculates explainable text.
4. **Prioritization & Cooldown**:
   - If a duplicate non-critical event occurs within the cooldown window, acoustic announcements are suppressed.
   - Active events are sorted: `CRITICAL` > `HIGH` > `MEDIUM` > `LOW` > `NORMAL`.
5. **Presentation & Action**:
   - Active Alert Banner renders at top of screen.
   - Synthetic acoustic chime sounds; spoken guidance advisory is verbalized.
   - Session analytics and CSV export audit log update.
