import sys
import cv2
import torch
from torchvision import transforms
from PIL import Image
from app.detection.cf_model import ViTClassifier

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

print("Loading Community Forensics model (one-time)...")
model = ViTClassifier.from_pretrained("OwensLab/commfor-model-384", device="cpu")
model.eval()

# Test-mode preprocessing, matching the authors' dataloader.py get_transform(mode="test")
preprocess = transforms.Compose([
    transforms.Resize(440),
    transforms.CenterCrop(384),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def analyze_image(path):
    img_cv = cv2.imread(path)
    if img_cv is None:
        return {"error": f"could not read {path}"}

    # Face detection is only used to draw a box for the UI heatmap - NOT fed to the classifier
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    bbox = None
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        bbox = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}

    # Classification runs on the FULL image - this model was trained on whole images,
    # not tight face crops, so cropping would push it out of its training distribution
    pil_img = Image.open(path).convert("RGB")
    x_tensor = preprocess(pil_img).unsqueeze(0)
    with torch.no_grad():
        score = torch.sigmoid(model(x_tensor)).item()

    verdict = "FAKE" if score >= 0.5 else "REAL"

    return {
        "bbox": bbox,
        "fake_probability": round(score, 4),
        "verdict": verdict,
    }


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "test_face.jpg"
    print(path, "->", analyze_image(path))
