from pathlib import Path

import joblib
import numpy as np
import shap

from app.services.feature_space import HARMONIZED_FEATURES

ML_DIR = Path(__file__).resolve().parents[1] / "ml"


class SHAPExplainabilityService:
    def __init__(self):
        rf_path = ML_DIR / "random_forest.pkl"
        background_path = ML_DIR / "shap_background.pkl"
        names_path = ML_DIR / "feature_names.pkl"

        missing = [str(p) for p in (rf_path, background_path, names_path) if not p.exists()]
        if missing:
            raise FileNotFoundError(
                "Required SHAP artifacts are missing. Run train_models.py first. "
                f"Missing: {missing}"
            )

        self.rf_model = joblib.load(rf_path)
        self.feature_names = list(joblib.load(names_path) or HARMONIZED_FEATURES)
        background = np.asarray(joblib.load(background_path), dtype=np.float64)
        if background.ndim == 1:
            background = background.reshape(1, -1)

        self.explainer = shap.TreeExplainer(
            self.rf_model,
            data=background,
            feature_perturbation="interventional",
        )

    def calculate_shap_values(self, scaled_vector: np.ndarray) -> list:
        sample = np.asarray(scaled_vector, dtype=np.float64)
        if sample.ndim == 1:
            sample = sample.reshape(1, -1)

        raw_values = self.explainer.shap_values(sample)
        impacts = self._malware_class_impacts(raw_values)

        ranked = [
            {"feature": name, "impact": float(round(float(value), 6))}
            for name, value in zip(self.feature_names, impacts)
        ]
        ranked.sort(key=lambda item: abs(item["impact"]), reverse=True)
        return ranked

    def _malware_class_impacts(self, raw_values) -> np.ndarray:
        values = raw_values
        if isinstance(values, list):
            values = values[1] if len(values) > 1 else values[0]
        array = np.asarray(values, dtype=np.float64)

        if array.ndim == 3:
            # (n_samples, n_features, n_classes) — take malware class
            class_index = 1 if array.shape[-1] > 1 else 0
            array = array[0, :, class_index]
        elif array.ndim == 2:
            if array.shape[0] == 1:
                array = array[0]
            elif array.shape[0] == 2 and array.shape[1] == len(self.feature_names):
                array = array[1]
            elif array.shape[1] == 2:
                array = array[:, 1]
            else:
                array = array[0]
        return array.reshape(-1)
