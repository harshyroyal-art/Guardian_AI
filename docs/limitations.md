# AutoGuardian AI — Technical Limitations, Privacy, & Safety Scope

AutoGuardian AI is committed to honesty and transparency. This document details the technical assumptions, operational limitations, privacy policies, and safety constraints of the system.

---

## 1. Strict Advisory & Warning-Only Safety Scope

AutoGuardian AI is an experimental hackathon prototype designed solely for driver assistance and situational awareness:

- **No Vehicle Actuation**: The software NEVER controls, overrides, or interferes with vehicle steering, service brakes, parking brakes, acceleration, throttle bodies, ignition timing, or occupant restraints (airbags).
- **No Direct Control Bus Connection**: The software does not transmit actuation frames on safety-critical automotive buses (CAN-C, FlexRay, or Automotive Ethernet).
- **Stationary Testing Only**: Testing must take place on stationary benches, laptops, simulated test rigs, or prerecorded footage. Never attempt to configure or interact with this prototype while driving on public highways.
- **Human Responsibility**: The licensed motor vehicle operator retains sole legal and operational responsibility for vehicle control, following distances, and roadway compliance.

---

## 2. Sensor & Hardware Limitations

### A. Monocular Camera Optical Distance Estimation
- A single webcam or smartphone camera operates via monocular 2D optical projection.
- Bounding box pixel size and vertical positioning in the image frame provide heuristic proximity hints (`VERY_CLOSE`, `MODERATE`, `DISTANT`), but **do not establish certified physical metric distances**.
- Factors such as camera mounting angle, lens focal length, road elevation changes, vehicle ride height, and vehicle size variations introduce non-trivial depth estimation error.
- Certified production ADAS relies on calibrated stereoscopic cameras, millimeter-wave radar, or LiDAR.

### B. Blind-Spot Coverage Geometry
- A laptop webcam or dashboard-mounted mobile phone oriented forward or inward cannot physically image the rear-quarter blind spots of an automobile.
- The Blind-Spot Assistance page is explicitly a top-down simulation harness. Toggling to **Hardware Mode** displays an honest `HARDWARE NOT CONNECTED` indicator.

### C. Road Surface & Hazard Detection
- Pretrained COCO neural networks (such as YOLOv8) are trained to recognize vehicles, people, bicycles, animals, and traffic signs.
- They are **not** trained to recognize subtle road surface defects such as potholes, asphalt delamination, or black ice.
- AutoGuardian AI provides deterministic simulated hazard scenarios rather than hallucinating synthetic pothole detections.

---

## 3. Driver Monitoring & Fatigue Limitations

- **Optical Measurement Only**: The system estimates eye aperture state using facial landmarks and Eye Aspect Ratio (EAR) algorithms.
- **Not a Medical Instrument**: Optical closure measurement is an advisory proxy for alertness; it is not a medical or neurological diagnostic instrument.
- **Occlusion & Lighting Factors**: Polarized sunglasses, heavy eyewear, facial hair, low cockpit lighting, and steep head turns may reduce landmark accuracy. The system reports `INSUFFICIENT_DATA` or `Driver Face Not Detected` during occlusion.

---

## 4. Privacy & Biometric Data Handling

- **In-Memory Volatile Processing**: Video streams captured via the browser's `MediaDevices` API are analyzed frame-by-frame in RAM.
- **No Disk Storage**: Raw camera footage, facial imagery, and biometric landmark coordinates are never saved to persistent storage.
- **No Cloud Upload**: Inference runs 100% locally on the student laptop. No video, audio, or telemetry is transmitted across the internet.
- **Track Teardown**: Clicking "Stop Camera" immediately calls `track.stop()` on all active video tracks, cutting off webcam power.

---

## 5. Network & Android Local Access Constraints

- **Local Subnet Only**: The system is designed to communicate strictly across the user's private local Wi-Fi subnet.
- **Browser Camera Security**: Modern mobile browsers (including Android Chrome) enforce secure origin policies: camera access is restricted to `https://` or `localhost`. Accessing the laptop over plain local HTTP (`http://192.168.x.x:5173`) will display the cockpit interface, but may restrict direct phone camera streaming. The integrated simulation mode provides a complete fallback.
