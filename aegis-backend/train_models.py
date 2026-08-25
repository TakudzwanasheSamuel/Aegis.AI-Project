import json
import os

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from app.services.feature_space import HARMONIZED_FEATURES

print("=== AegisAI Machine Learning Training Pipeline ===")
print("[*] Feature space: 8-dimensional live-harmonized CIC-MalMem-2022 subset")


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


print("[*] Loading CIC-MalMem-2022 for training…")

data_path = "data/raw/Obfuscated-MalMem2022.csv"
if not os.path.exists(data_path):
    raise FileNotFoundError(f"Dataset not found at {data_path}")

df = pd.read_csv(data_path)
print(f"[*] Loaded Dataset: {df.shape[0]} samples, {df.shape[1]} columns")

missing = [col for col in HARMONIZED_FEATURES if col not in df.columns]
if missing:
    raise ValueError(f"Harmonized features missing from dataset: {missing}")

target_col = None
for col in ["Class", "category", "label", "Category"]:
    if col in df.columns:
        target_col = col
        break

if not target_col:
    raise ValueError("Target column ('Class' or 'Category') not found in dataset.")

X = df[HARMONIZED_FEATURES].apply(pd.to_numeric, errors="coerce").fillna(0.0)
y = df[target_col].apply(
    lambda val: 1 if "Malware" in str(val) or "Ransomware" in str(val) or str(val) == "1" else 0
)

print(f"[*] Training Features Count: {X.shape[1]}")
print(f"[*] Features: {list(X.columns)}")
print(f"[*] Target Distribution: Benign ({int((y == 0).sum())}), Malicious ({int((y == 1).sum())})")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
X_train_res = pd.DataFrame(X_train_res, columns=HARMONIZED_FEATURES)
X_test = X_test[HARMONIZED_FEATURES]

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_res)
X_test_scaled = scaler.transform(X_test)

print("\n[*] Training Random Forest Classifier...")
rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf_model.fit(X_train_scaled, y_train_res)
rf_preds = rf_model.predict(X_test_scaled)
rf_probs = rf_model.predict_proba(X_test_scaled)[:, 1]

rf_metrics = {
    "accuracy": float(accuracy_score(y_test, rf_preds)),
    "precision": float(precision_score(y_test, rf_preds)),
    "recall": float(recall_score(y_test, rf_preds)),
    "f1": float(f1_score(y_test, rf_preds)),
    "roc_auc": float(roc_auc_score(y_test, rf_probs)),
}

print("\n--- Random Forest Benchmark Results ---")
for key, value in rf_metrics.items():
    print(f"{key.capitalize():<10}: {value:.4f}")

print("\n[*] Training XGBoost Classifier...")
xgb_model = XGBClassifier(n_estimators=100, learning_rate=0.1, random_state=42, eval_metric="logloss")
xgb_model.fit(X_train_scaled, y_train_res)
xgb_preds = xgb_model.predict(X_test_scaled)
xgb_probs = xgb_model.predict_proba(X_test_scaled)[:, 1]

xgb_metrics = {
    "accuracy": float(accuracy_score(y_test, xgb_preds)),
    "precision": float(precision_score(y_test, xgb_preds)),
    "recall": float(recall_score(y_test, xgb_preds)),
    "f1": float(f1_score(y_test, xgb_preds)),
    "roc_auc": float(roc_auc_score(y_test, xgb_probs)),
}

print("\n--- XGBoost Benchmark Results ---")
for key, value in xgb_metrics.items():
    print(f"{key.capitalize():<10}: {value:.4f}")

rng = np.random.RandomState(42)
background_size = min(64, X_train_scaled.shape[0])
background_idx = rng.choice(X_train_scaled.shape[0], size=background_size, replace=False)
shap_background = X_train_scaled[background_idx]

os.makedirs("app/ml", exist_ok=True)
joblib.dump(rf_model, "app/ml/random_forest.pkl")
joblib.dump(xgb_model, "app/ml/xgboost.pkl")
joblib.dump(scaler, "app/ml/scaler.pkl")
joblib.dump(list(HARMONIZED_FEATURES), "app/ml/feature_names.pkl")
joblib.dump(shap_background, "app/ml/shap_background.pkl")

training_metrics = {
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
        **rf_metrics,
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
        **xgb_metrics,
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

with open("app/ml/training_metrics.json", "w", encoding="utf-8") as handle:
    json.dump(training_metrics, handle, indent=2)

print("\n[SUCCESS] Model artifacts saved to app/ml/")
print("[SUCCESS] training_metrics.json written with RF and XGBoost scores.")
