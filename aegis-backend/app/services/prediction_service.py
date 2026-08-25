from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.services.feature_space import HARMONIZED_FEATURES

ML_DIR = Path(__file__).resolve().parents[1] / "ml"


class PredictionService:
    def __init__(self):
        rf_path = ML_DIR / "random_forest.pkl"
        xgb_path = ML_DIR / "xgboost.pkl"
        scaler_path = ML_DIR / "scaler.pkl"
        names_path = ML_DIR / "feature_names.pkl"

        missing = [str(p) for p in (rf_path, xgb_path, scaler_path, names_path) if not p.exists()]
        if missing:
            raise FileNotFoundError(
                "Required ML artifacts are missing. Run train_models.py first. "
                f"Missing: {missing}"
            )

        self.rf_model = joblib.load(rf_path)
        self.xgb_model = joblib.load(xgb_path)
        self.scaler = joblib.load(scaler_path)
        loaded_names = list(joblib.load(names_path))
        self.feature_names = loaded_names if loaded_names else list(HARMONIZED_FEATURES)

        if list(self.feature_names) != list(HARMONIZED_FEATURES):
            raise ValueError(
                "feature_names.pkl does not match the live harmonized feature space. "
                f"expected={HARMONIZED_FEATURES} got={self.feature_names}"
            )

    def to_frame(self, harmonized_vector: dict) -> pd.DataFrame:
        row = [float(harmonized_vector.get(name, 0.0) or 0.0) for name in self.feature_names]
        return pd.DataFrame([row], columns=self.feature_names)

    def scale(self, harmonized_vector: dict) -> np.ndarray:
        return self.scaler.transform(self.to_frame(harmonized_vector))

    def predict(self, harmonized_vector: dict) -> tuple[str, float, int, str]:
        scaled = self.scale(harmonized_vector)
        rf_prob = float(self.rf_model.predict_proba(scaled)[0, 1])
        xgb_prob = float(self.xgb_model.predict_proba(scaled)[0, 1])
        malware_probability = float(np.clip((rf_prob + xgb_prob) / 2.0, 0.0, 1.0))

        risk_score = int(round(malware_probability * 100.0))
        predicted_malicious = malware_probability >= 0.5
        confidence = malware_probability if predicted_malicious else (1.0 - malware_probability)
        confidence = float(round(confidence, 4))

        if risk_score >= 80:
            return "Critical Threat", confidence, risk_score, "CRITICAL"
        if risk_score >= 60:
            return "High Risk", confidence, risk_score, "HIGH"
        if risk_score >= 30:
            return "Moderate Risk", confidence, risk_score, "MEDIUM"
        return "Safe", confidence, risk_score, "LOW"
