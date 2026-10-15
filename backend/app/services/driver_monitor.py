"""
AutoGuardian AI - Driver Drowsiness & Attention Monitoring Service
Processes driver camera frames using OpenCV facial and eye detection landmarks.
Calculates temporal eye-closure duration, blink tracking, and head orientation indicators.
Suppresses transient blinks and triggers drowsiness alerts only on sustained closure.
"""
import io
import time
from typing import Any, Dict, Optional, Tuple
import numpy as np
from PIL import Image

from app.core.risk_engine import RiskEngine
from app.models.schemas import (
    EventCategory,
    OperatingMode,
    RiskEvaluationInput,
    SafetyEvent,
    SystemSettings,
)


class DriverMonitorService:
    def __init__(self, settings: Optional[SystemSettings] = None):
        self.settings = settings or SystemSettings()
        self.risk_engine = RiskEngine(self.settings)

        # Temporal tracking
        self.monitoring_active: bool = False
        self.closed_eye_start_time: Optional[float] = None
        self.current_closure_duration: float = 0.0
        self.blink_count: int = 0
        self.last_blink_time: float = 0.0
        self.yawn_count: int = 0
        self.total_frames_analyzed: int = 0
        self.face_lost_counter: int = 0

        # Load OpenCV Haar cascade classifiers
        self._init_classifiers()

    def _init_classifiers(self):
        try:
            import cv2
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_eye.xml"
            )
            self.classifiers_loaded = True
        except Exception:
            self.classifiers_loaded = False

    def reset_session(self):
        """Resets all temporal measurements and counters."""
        self.closed_eye_start_time = None
        self.current_closure_duration = 0.0
        self.blink_count = 0
        self.last_blink_time = 0.0
        self.yawn_count = 0
        self.total_frames_analyzed = 0
        self.face_lost_counter = 0

    def analyze_frame(
        self,
        image_bytes: Optional[bytes] = None,
        telemetry: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes a camera frame or client-side landmark telemetry.
        Returns:
            face_detected: bool
            eyes_open: bool
            eye_closure_sec: float
            ear_value: float (approx Eye Aspect Ratio)
            attention_score: int (0 to 100)
            status: str
            risk_event: Optional[SafetyEvent]
        """
        now = time.time()
        self.total_frames_analyzed += 1

        face_detected = False
        eyes_detected = False
        ear_value = 0.32
        yawning = False
        head_droop = False
        bounding_boxes = []

        if image_bytes and self.classifiers_loaded:
            try:
                import cv2
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                w, h = pil_img.size
                cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

                # Detect face
                faces = self.face_cascade.detectMultiScale(
                    gray, scaleFactor=1.2, minNeighbors=5, minSize=(60, 60)
                )

                if len(faces) > 0:
                    face_detected = True
                    self.face_lost_counter = 0
                    fx, fy, fw, fh = faces[0]
                    bounding_boxes.append({
                        "type": "face",
                        "box_2d": [fy / h, fx / w, (fy + fh) / h, (fx + fw) / w],
                    })

                    # Region of interest for eyes (upper half of face)
                    roi_gray = gray[fy : fy + int(fh * 0.6), fx : fx + fw]
                    eyes = self.eye_cascade.detectMultiScale(
                        roi_gray, scaleFactor=1.15, minNeighbors=4, minSize=(20, 20)
                    )

                    if len(eyes) >= 1:
                        eyes_detected = True
                        ear_value = 0.30 + min(0.1, len(eyes) * 0.05)
                        for ex, ey, ew, eh in eyes[:2]:
                            bounding_boxes.append({
                                "type": "eye",
                                "box_2d": [
                                    (fy + ey) / h,
                                    (fx + ex) / w,
                                    (fy + ey + eh) / h,
                                    (fx + ex + ew) / w,
                                ],
                            })
                    else:
                        eyes_detected = False
                        ear_value = 0.15  # Low EAR indicates closed eyes
                else:
                    self.face_lost_counter += 1
            except Exception:
                face_detected = False
        elif telemetry:
            # Client-side processed telemetry from Web MediaPipe / Face landmarks
            face_detected = bool(telemetry.get("face_detected", True))
            eyes_detected = bool(telemetry.get("eyes_detected", True))
            ear_value = float(telemetry.get("ear_value", 0.30))
            yawning = bool(telemetry.get("yawning", False))
            head_droop = bool(telemetry.get("head_droop", False))

        # Temporal closure tracking: sustained closure vs normal blink
        # Normal human blink lasts between 0.1 and 0.4 seconds
        if face_detected:
            if not eyes_detected or ear_value < 0.20:
                if self.closed_eye_start_time is None:
                    self.closed_eye_start_time = now
                self.current_closure_duration = round(now - self.closed_eye_start_time, 2)
            else:
                # Eyes reopened
                if self.closed_eye_start_time is not None:
                    closure_time = now - self.closed_eye_start_time
                    if 0.08 <= closure_time < 0.5:
                        self.blink_count += 1
                        self.last_blink_time = now
                    self.closed_eye_start_time = None
                self.current_closure_duration = 0.0
        else:
            self.closed_eye_start_time = None
            self.current_closure_duration = 0.0

        # Calculate attention score (100 = fully alert, 0 = critical fatigue/distraction)
        attention_score = 100
        if not face_detected:
            attention_score = max(20, 70 - (self.face_lost_counter * 5))
        elif self.current_closure_duration > 0.5:
            penalty = int(self.current_closure_duration * 35)
            attention_score = max(0, 100 - penalty)
        elif yawning or head_droop:
            attention_score = 65

        # Evaluate risk through deterministic risk engine
        evidence = {
            "face_detected": face_detected,
            "camera_active": True,
            "eye_closure_sec": self.current_closure_duration,
            "ear_value": round(ear_value, 3),
            "yawning": yawning,
            "head_droop": head_droop,
            "blink_count": self.blink_count,
            "attention_score": attention_score,
        }

        eval_input = RiskEvaluationInput(
            category=EventCategory.DRIVER_ATTENTION,
            source_module="driver_drowsiness_monitor",
            mode=OperatingMode.LIVE_CAMERA if image_bytes else OperatingMode.MODEL_PROCESSING,
            evidence=evidence,
            confidence=0.92 if face_detected else 0.50,
        )

        risk_event, is_suppressed = self.risk_engine.evaluate(eval_input)

        return {
            "face_detected": face_detected,
            "eyes_open": eyes_detected or ear_value >= 0.20,
            "eye_closure_sec": self.current_closure_duration,
            "ear_value": round(ear_value, 3),
            "attention_score": attention_score,
            "blink_count": self.blink_count,
            "yawn_count": self.yawn_count,
            "bounding_boxes": bounding_boxes,
            "risk_event": risk_event if not is_suppressed else None,
            "status": "ALERT" if attention_score < 50 else ("CAUTION" if attention_score < 75 else "NOMINAL"),
        }


# Global singleton
driver_monitor_service = DriverMonitorService()
