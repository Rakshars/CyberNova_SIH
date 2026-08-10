"""
detection/deepfake_detector.py
-------------------------------
Real deepfake/synthetic-image detection using the Community Forensics ViT
model (Park & Owens, University of Michigan - arXiv:2411.04125), trained on
2.7M images across 4,800+ generators.

The model and preprocessing here match the authors' own reference
implementation (github.com/JeongsooP/Community-Forensics), reimplemented
directly rather than importing their repo, since their code pulls in
training-only dependencies (wandb, torchmetrics) not needed for inference.
"""

import io

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.detection.cf_model import ViTClassifier

_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

_model = None

def get_model():
    global _model
    if _model is None:
        _model = ViTClassifier.from_pretrained("OwensLab/commfor-model-384", device="cpu")
        _model.eval()
    return _model

# Matches the authors' dataloader.py get_transform(mode="test")
_preprocess = transforms.Compose([
    transforms.Resize(440),
    transforms.CenterCrop(384),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def analyze_image_bytes(content: bytes) -> dict:
    """
    Returns {"fake_probability": float 0-1, "bbox": {..percent-based..} | None}.
    Face detection is only used to locate a box for the UI heatmap - the
    classifier `itself runs on the full i`mage, since it was trained on whole
    images, not tight face crops.
    """
    arr = np.frombuffer(content, dtype=np.uint8)
    img_cv = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img_cv is None:
        return {"error": "unreadable image"}

    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    bbox = None
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        img_h, img_w = img_cv.shape[:2]
        bbox = {
            "x_pct": x / img_w * 100,
            "y_pct": y / img_h * 100,
            "w_pct": w / img_w * 100,
            "h_pct": h / img_h * 100,
        }

    pil_img = Image.open(io.BytesIO(content)).convert("RGB")
    x_tensor = _preprocess(pil_img).unsqueeze(0)
    with torch.no_grad():
        score = torch.sigmoid(get_model()(x_tensor)).item()

    return {"fake_probability": score, "bbox": bbox}
