"""Recompute confusion / ROC / importance from existing pickles without retraining."""

import json
import os

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.metrics import confusion_matrix, roc_curve
from sklearn.model_selection import train_test_split

from app.services.feature_space import HARMONIZED_FEATURES

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(ROOT, "data", "raw", "Obfuscated-MalMem2022.csv")
ML_DIR = os.path.join(ROOT, "app", "ml")
METRICS_PATH = os.path.join(ML_DIR, "training_metrics.json")


def _confusion_payload(y_true, y_pred) -> dict:
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    return {
        "true_positive": int(tp),
        "false_positive": int(fp),
        "true_negative": int(tn),
        "false_negative": int(fn),
    }


def _roc_payload(y_true, rf_probs, xgb_probs, steps: int = 25) -> list[dict]:
    rf_fpr, rf_tpr, _ = roc_curve(y_true, rf_probs)
    xgb_fpr, xgb_tpr, _ = roc_curve(y_true, xgb_probs)
    grid = np.linspace(0.0, 1.0, steps)
    return [
        {
            "fpr": float(fpr),
            "tprRandomForest": float(np.interp(fpr, rf_fpr, rf_tpr)),
            "tprXgboost": float(np.interp(fpr, xgb_fpr, xgb_tpr)),
        }
        for fpr in grid
    ]


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    target_col = next(col for col in ["Class", "category", "label", "Category"] if col in df.columns)
    X = df[HARMONIZED_FEATURES].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    y = df[target_col].apply(
        lambda val: 1 if "Malware" in str(val) or "Ransomware" in str(val) or str(val) == "1" else 0
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    scaler = joblib.load(os.path.join(ML_DIR, "scaler.pkl"))
    rf_model = joblib.load(os.path.join(ML_DIR, "random_forest.pkl"))
    xgb_model = joblib.load(os.path.join(ML_DIR, "xgboost.pkl"))
    X_test_scaled = scaler.transform(X_test[HARMONIZED_FEATURES])

    rf_preds = rf_model.predict(X_test_scaled)
    rf_probs = rf_model.predict_proba(X_test_scaled)[:, 1]
    xgb_preds = xgb_model.predict(X_test_scaled)
    xgb_probs = xgb_model.predict_proba(X_test_scaled)[:, 1]

    existing: dict = {}
    if os.path.exists(METRICS_PATH):
        existing = json.loads(open(METRICS_PATH, encoding="utf-8").read())

    rf_metrics = existing.get("random_forest", {})
    xgb_metrics = existing.get("xgboost", {})
    scalar_keys = ("accuracy", "precision", "recall", "f1", "roc_auc")

    payload = {
        "dataset": "CIC-MalMem-2022",
        "n_samples": int(df.shape[0]),
        "n_features": len(HARMONIZED_FEATURES),
        "features": list(HARMONIZED_FEATURES),
        "test_size": 0.2,
        "smote": True,
        "scaler": "StandardScaler",
        "class_counts": {
            "benign": int((y == 0).sum()),
            "malware": int((y == 1).sum()),
        },
        "class_distribution": {
            "pre_smote_train": {
                "benign": int((y_train == 0).sum()),
                "malware": int((y_train == 1).sum()),
            },
            "post_smote_train": {
                "benign": int((y_train_res == 0).sum()),
                "malware": int((y_train_res == 1).sum()),
            },
        },
        "random_forest": {
            **{key: rf_metrics[key] for key in scalar_keys if key in rf_metrics},
            "confusion_matrix": _confusion_payload(y_test, rf_preds),
            "feature_importance": [
                {"feature": name, "importance": float(score)}
                for name, score in sorted(
                    zip(HARMONIZED_FEATURES, rf_model.feature_importances_),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ],
        },
        "xgboost": {
            **{key: xgb_metrics[key] for key in scalar_keys if key in xgb_metrics},
            "confusion_matrix": _confusion_payload(y_test, xgb_preds),
            "feature_importance": [
                {"feature": name, "importance": float(score)}
                for name, score in sorted(
                    zip(HARMONIZED_FEATURES, xgb_model.feature_importances_),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ],
        },
        "roc_curve": _roc_payload(y_test, rf_probs, xgb_probs),
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    print(f"[SUCCESS] Wrote evaluation visuals to {METRICS_PATH}")


if __name__ == "__main__":
    main()
