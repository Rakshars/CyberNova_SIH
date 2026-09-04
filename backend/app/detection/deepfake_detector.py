"""
detection/deepfake_detector.py
-------------------------------
Lightweight Digital & Spectral Forensics Deepfake Detector.

Analyzes uploaded images for synthetic/AI-generated manipulation signatures using:
1. OpenCV Face Cascade (Facial region detection & Bounding Box)
2. Frequency-Domain DCT (Discrete Cosine Transform) High-Frequency Spectral Artifact Analysis
3. Laplacian Edge & Chrominance Variance (Detects GAN/Diffusion over-smoothing & upsampling noise)

Designed for ultra-low memory footprints (<30MB RAM) to run flawlessly on 512MB free cloud tiers.
"""

import io
import cv2
import numpy as np
from PIL import Image

_face_cascade = None

def get_face_cascade():
    global _face_cascade
    if _face_cascade is None:
        _face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    return _face_cascade


def analyze_image_bytes(content: bytes) -> dict:
    """
    Analyzes image bytes for synthetic deepfake / AI generation artifacts.
    Returns {"fake_probability": float 0-1, "bbox": {x_pct, y_pct, w_pct, h_pct} | None}.
    """
    try:
        arr = np.frombuffer(content, dtype=np.uint8)
        img_cv = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img_cv is None:
            return {"error": "unreadable image"}

        img_h, img_w = img_cv.shape[:2]

        # 1. Face Detection & Bounding Box
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        faces = get_face_cascade().detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
        bbox = None
        face_roi = gray

        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            bbox = {
                "x_pct": round(x / img_w * 100, 1),
                "y_pct": round(y / img_h * 100, 1),
                "w_pct": round(w / img_w * 100, 1),
                "h_pct": round(h / img_h * 100, 1),
            }
            face_roi = gray[y:y+h, x:x+w]

        # 2. Spectral Frequency Analysis (DCT)
        # Synthetic / AI images exhibit characteristic high-frequency grid artifacts from GAN/Diffusion deconvolution
        resized_roi = cv2.resize(face_roi, (128, 128))
        float_roi = np.float32(resized_roi) / 255.0
        dct = cv2.dct(float_roi)

        # High frequency energy ratio
        total_energy = np.sum(np.abs(dct)) + 1e-6
        high_freq_energy = np.sum(np.abs(dct[64:, 64:]))
        freq_ratio = high_freq_energy / total_energy

        # 3. Laplacian Variance & Noise Texture (Diffusion hyper-smoothing vs natural skin grain)
        laplacian_var = cv2.Laplacian(resized_roi, cv2.CV_64F).var()

        # 4. Color Channel Variance (YCrCb Chrominance distribution)
        ycrcb = cv2.cvtColor(cv2.resize(img_cv, (256, 256)), cv2.COLOR_BGR2YCrCb)
        cr_std = np.std(ycrcb[:, :, 1])
        cb_std = np.std(ycrcb[:, :, 2])
        color_std_ratio = abs(cr_std - cb_std)

        # 5. Composite Risk Score Calculation
        risk = 0.15 # Baseline

        # High frequency artifact penalty
        if freq_ratio > 0.045 or freq_ratio < 0.005:
            risk += 0.35
        elif freq_ratio > 0.035 or freq_ratio < 0.01:
            risk += 0.20

        # Hyper-smoothness or unnatural sharpness penalty
        if laplacian_var < 80.0:  # Hyper-smooth AI generated skin
            risk += 0.30
        elif laplacian_var > 1500.0: # Artificial noise injection
            risk += 0.20

        # Chrominance imbalance penalty
        if color_std_ratio > 18.0 or color_std_ratio < 3.0:
            risk += 0.15

        # Normalize score between 0.05 and 0.96
        fake_prob = float(np.clip(risk, 0.05, 0.96))

        return {"fake_probability": fake_prob, "bbox": bbox}

    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}


