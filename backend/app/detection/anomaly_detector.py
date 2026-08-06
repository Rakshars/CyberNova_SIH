"""
detection/anomaly_detector.py
-------------------------------
Adapted from src/anomaly_detection.py in the original prototype.

WHAT CHANGED:
- Model is now saved to disk with joblib so it doesn't retrain on every run
- Class-based interface (AnomalyDetector) instead of bare functions
- Added load_or_train() — loads saved model if it exists, trains if not
- predict_single() scores a single event dict in real-time
- Type hints throughout

WHAT IS PRESERVED:
- Isolation Forest algorithm (exact same hyperparameters: n_estimators=200, random_state=42)
- Same 7 FEATURE_COLUMNS
- Same 0-100 rescaling formula

WHY ISOLATION FOREST:
  Unsupervised — we have no labeled "attack" data; the model learns what
  NORMAL looks like and flags deviations.
  Fast, interpretable, and works well on tabular data without tuning.
"""

from __future__ import annotations
import os
import logging
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from app.detection.feature_engineering import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml", "artifacts", "isolation_forest.pkl"
)
SCALER_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml", "artifacts", "score_scaler.pkl"
)


class AnomalyDetector:
    """
    Wraps Isolation Forest with persistence and single-event inference.

    Usage:
        detector = AnomalyDetector()
        detector.load_or_train(df)      # train on historical data, save model
        score = detector.predict_single(event_features)  # score one event
    """

    def __init__(self, contamination: float = 0.08) -> None:
        self.contamination = contamination
        self.model: IsolationForest | None = None
        # These are computed on training data and used to rescale at inference
        self._score_min: float = 0.0
        self._score_max: float = 1.0

    def train(self, df: pd.DataFrame) -> None:
        """Train the Isolation Forest on a DataFrame with FEATURE_COLUMNS present."""
        X = df[FEATURE_COLUMNS].fillna(0)
        self.model = IsolationForest(
            n_estimators=200,
            contamination=self.contamination,
            random_state=42,
        )
        self.model.fit(X)
        raw_scores = self.model.decision_function(X)
        self._score_min = float(raw_scores.min())
        self._score_max = float(raw_scores.max())
        logger.info("Isolation Forest trained on %d events.", len(df))

    def save(self) -> None:
        """Persist model and scaling parameters to disk."""
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump({"min": self._score_min, "max": self._score_max}, SCALER_PATH)
        logger.info("Model saved to %s", MODEL_PATH)

    def load(self) -> bool:
        """Load model from disk. Returns True if successful, False if not found."""
        if not os.path.exists(MODEL_PATH):
            return False
        self.model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        self._score_min = scaler["min"]
        self._score_max = scaler["max"]
        logger.info("Model loaded from %s", MODEL_PATH)
        return True

    def load_or_train(self, df: pd.DataFrame) -> None:
        """Load existing model, or train a new one if none is saved."""
        if not self.load():
            logger.info("No saved model found. Training from scratch...")
            self.train(df)
            self.save()

    def _raw_to_score(self, raw: float) -> float:
        """
        Rescale Isolation Forest decision_function output to 0-100.
        Higher score = MORE anomalous (inverted from sklearn convention).
        """
        span = self._score_max - self._score_min
        if span == 0:
            return 50.0
        return float(100 * (self._score_max - raw) / span)

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Score all rows in a DataFrame. Returns df with added columns."""
        assert self.model is not None, "Model not trained or loaded."
        df = df.copy()
        X = df[FEATURE_COLUMNS].fillna(0)
        raw = self.model.decision_function(X)
        df["anomaly_score_raw"] = raw
        df["ml_anomaly_score"] = [self._raw_to_score(r) for r in raw]
        df["is_anomaly"] = (self.model.predict(X) == -1).astype(int)
        return df

    def predict_single(self, features: dict) -> dict:
        """
        Score a single event feature dict.
        Returns a dict with ml_anomaly_score and is_anomaly added.
        """
        assert self.model is not None, "Model not trained or loaded."
        X = np.array([[features.get(col, 0) for col in FEATURE_COLUMNS]])
        raw = float(self.model.decision_function(X)[0])
        prediction = int(self.model.predict(X)[0])
        features["ml_anomaly_score"] = round(self._raw_to_score(raw), 2)
        features["is_anomaly"] = 1 if prediction == -1 else 0
        return features


# Module-level singleton — loaded once at startup by pipeline_service
_detector_instance: AnomalyDetector | None = None


def get_detector() -> AnomalyDetector:
    """Return the module-level detector singleton."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = AnomalyDetector()
    return _detector_instance
