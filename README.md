# AutoGuardian AI — Universal AI-Powered Vehicle Safety and Driver Assistance System

> **Tagline:** Intelligent Safety for Every Generation of Vehicle  
> **Hackathon Track:** NIAT Hackathon | Software-First Prototype | Laptop + Android Compatible  
> **GitHub Repository:** [https://github.com/harshyroyal-art/Guardian_AI](https://github.com/harshyroyal-art/Guardian_AI)

---

## 1. Executive Summary

Over 60% of vehicles currently on roads worldwide lack modern Advanced Driver Assistance Systems (ADAS). Older vehicles lack factory cameras and radar, leaving drivers unprotected against microsleep drowsiness, forward collisions, and blind-spot accidents. Meanwhile, newer vehicles vary widely in active safety capabilities.

**AutoGuardian AI** is an affordable, modular safety assistant designed to retrofit older vehicles while complementing newer ones. It transforms standard laptop and smartphone hardware into an intelligent safety co-pilot using:
- **Genuine Neural Computer Vision**: Real pretrained YOLOv8 object detection on CPU and OpenCV facial landmark analysis.
- **Explainable Unified Safety Intelligence Engine**: A centralized, deterministic risk assessment engine that prioritizes hazards, suppresses duplicate audio alarms, and explains every warning decision in plain English.
- **Cross-Platform Cockpit**: Accessible on laptop screens and in-cockpit Android smartphone displays over trusted local Wi-Fi.
- **Strictly Warning-Only**: Zero interference with vehicle steering, braking, throttle, or airbags.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Browser MediaDevices API, Web Audio API (synthetic warning chimes), and Web Speech API (`SpeechSynthesis` advisory voice).
- **Backend**: Python 3.13, FastAPI, Uvicorn (async server), Pydantic v2 (strict validation), Pytest.
- **AI & Computer Vision**: Ultralytics YOLOv8n (pretrained 80-class COCO neural detector), OpenCV 5.0 (Haar cascades & HOG pedestrian detector), NumPy, Pillow.
- **Zero Paid Subscriptions**: 100% locally runnable on student hardware without paid APIs, subscriptions, or cloud dependencies.

---

## 3. All 14 Functional Application Pages

1. **Overview Dashboard**: Automotive cockpit command center with active alerts, live telemetry cards, and quick demo triggers.
2. **Driver Monitoring**: Real webcam feed with Eye Aspect Ratio (EAR) tracking, temporal eye closure duration, blink counter, and drowsiness warning.
3. **Road and Object Detection**: Genuine YOLOv8 inference with canvas bounding boxes, confidence scores, detected object list, and proximity hints.
4. **Forward Collision Risk Monitor**: Kinematic relative speed, estimated gap, and Time-to-Collision (TTC) envelope with physics sliders.
5. **Blind-Spot Assistance**: Top-down vehicle diagram with left/right flank sectors, turn-signal conflict detection, and honest `HARDWARE NOT CONNECTED` mode.
6. **Front/Rear Parking Assistance**: 360° proximity radar visualizer, emergency stop threshold (<= 0.5m), caution buffer (<= 1.2m), and acoustic beeps.
7. **Road Hazard Detection**: Detection of potholes, debris, stopped vehicles, and honest model capability disclosures.
8. **Vehicle Diagnostics**: Simulated OBD-II telemetry, Check Engine light, coolant temperature, battery voltage, and DTC fault code lookup.
9. **Unified Safety Alerts**: Comprehensive audit log with search, severity filters, transparent decision reasoning, and CSV export.
10. **Analytics and Reports**: Real-time Recharts visualizations: risk score timeline, severity distribution pie chart, and category bar chart.
11. **Vehicle Profiles**: Older Vehicle (Universal Retrofit), Modern Vehicle (Duplicate Suppression), and Custom Demo Lab.
12. **Settings and Calibration**: Acoustic beeps, spoken voice toggle, alert cooldown window, drowsiness thresholds, and privacy limits.
13. **Demo Scenario Simulator**: 14 deterministic, repeatable test scenarios with automated batch runner.
14. **About, Safety, and Limitations**: Hackathon pitch, 3–5 member team roles, safety scope, and technical disclaimers.

---

## 4. Quickstart: Installation & Startup

### Prerequisites
- Python 3.10 – 3.13
- Node.js v18+ and npm

### Step 1: Install Dependencies & Run Backend
In the project root directory:

```bash
# 1. Install Python backend dependencies
python -m pip install -r backend/requirements.txt

# 2. Launch FastAPI backend on 0.0.0.0:8000
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### Step 2: Install Dependencies & Run Frontend
In a new terminal window:

```bash
# 1. Change directory to frontend
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start Vite dev server on 0.0.0.0:5173
npm run dev
```
- Open your browser to: `http://localhost:5173`

---

## 5. Laptop + Android Phone Wi-Fi Setup

AutoGuardian AI is engineered to run the backend on a student laptop while serving as an in-cockpit auxiliary display on any Android phone connected to the same Wi-Fi network:

1. Connect both your laptop and Android smartphone to the **same trusted Wi-Fi network** (or phone mobile hotspot).
2. Find your laptop's local IPv4 address:
   - On Windows PowerShell, run: `ipconfig` (e.g. `192.168.1.105`).
3. On your Android Chrome browser, navigate to:
   ```
   http://192.168.1.105:5173
   ```
4. **Firewall Note**: If the page does not load on Android, verify that Windows Defender Firewall allows incoming connections on ports `5173` and `8000` for Private Networks.
5. **Mobile Camera Note**: Modern browsers restrict camera access over unencrypted local HTTP (`http://`). When accessing over local HTTP, use the **Interactive Simulation** slider to test drowsiness and attention detection safely.

---

## 6. Running Automated Tests & Builds

### Backend Automated Pytest Suite (21 Tests)
Run all unit and integration tests:

```bash
python -m pytest backend/tests -v
```
All 21 tests cover:
- Deterministic risk scoring and boundary thresholds.
- Sustained eye closure drowsiness hazard vs regular blinks.
- Low-confidence optical detection suppression (`INSUFFICIENT_DATA`).
- Blind-spot turn signal conflict resolution.
- Duplicate alert cooldown suppression across timestamps.
- Multi-threat prioritization (`CRITICAL` > `HIGH` > `MEDIUM`).
- Vehicle profile switching and CSV export formatting.

### Frontend Production Build Check
Verify full TypeScript compilation and Vite bundling:

```bash
cd frontend
npm run build
```

---

## 7. Project Documentation Index

- [`docs/architecture.md`](docs/architecture.md): Application architecture, component diagram, and end-to-end data flow.
- [`docs/risk-engine.md`](docs/risk-engine.md): Risk scoring formulas, priority weights, cooldown windows, and category rules.
- [`docs/demo-guide.md`](docs/demo-guide.md): 3–5 minute hackathon presentation script and guide to all 14 scenarios.
- [`docs/limitations.md`](docs/limitations.md): Honest technical limitations, optical distance constraints, privacy policy, and safety boundaries.

---

## 8. Strict Safety Scope

AutoGuardian AI is an experimental warning-only software prototype:
- **Never controls steering, brakes, throttle, or airbags.**
- **Never connects to critical vehicular control buses.**
- **Designed for stationary testing and educational demonstrations.**
- **Full driving responsibility remains with the human operator at all times.**
