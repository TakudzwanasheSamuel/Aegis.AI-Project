# Machine learning and XAI technical report

Artifacts directory: `aegis-backend/app/ml/`  
Training entry: `aegis-backend/train_models.py`  
Canonical feature list: `app/services/feature_space.py` (`HARMONIZED_FEATURES`)  
Live scores: `training_metrics.json`

---

## 1. Training dataset profile

| Property | Value |
|----------|--------|
| Corpus | CIC-MalMem-2022 |
| Samples (`n_samples`) | **58,062** |
| Class counts | **29,231 benign / 28,831 malware** (`class_distribution`) |
| Operational features | **8** system-wide indicators listed in `training_metrics.json` |
| Scaler recorded with the artifacts | **None** (tree models; the loaded `scaler.pkl` is a pass-through) |

These numbers are what `GET /api/v1/analytics/research-benchmark` serves. `train_models.py` still contains an older path (80/20 split, SMOTE, `StandardScaler`). Re-running that script would overwrite the pickles and this JSON. Do not retrain during a demonstration unless that overwrite is intended.

---

## 2. Feature Harmonization Layer

### 2.1 Eight-feature operational subset

| Order | CIC column | Meaning on a live snapshot |
|-------|------------|----------------------------|
| 1 | `pslist.nproc` | Process count |
| 2 | `pslist.nppid` | Parent-process count |
| 3 | `pslist.avg_threads` | Average threads per process |
| 4 | `pslist.avg_handlers` | Average handlers per process |
| 5 | `dlllist.ndlls` | DLL count |
| 6 | `dlllist.avg_dlls_per_proc` | Average DLLs per process |
| 7 | `handles.nhandles` | Handle count |
| 8 | `handles.avg_handles_per_proc` | Average handles per process |

### 2.2 Mapping from the agent payload

The agent sends one system-wide snapshot. Harmonization copies these payload fields onto the names above. Extra behavioural keys are ignored by the harmonizer.

| Payload field | CIC name |
|---------------|----------|
| `pslist_nproc` | `pslist.nproc` |
| `pslist_nppid` | `pslist.nppid` |
| `pslist_avg_threads` | `pslist.avg_threads` |
| `pslist_avg_handlers` | `pslist.avg_handlers` |
| `dlllist_ndlls` | `dlllist.ndlls` |
| `dlllist_avg_dlls_per_proc` | `dlllist.avg_dlls_per_proc` |
| `handles_nhandles` | `handles.nhandles` |
| `handles_avg_handles_per_proc` | `handles.avg_handles_per_proc` |

There is no ransom-intensity formula and no interpolation between class centroids.

### 2.3 What the trees see

On this subset, malware rows tend toward lower system-wide DLL and handle totals than benign rows. Sandbox Scenario 3 uses counts in that lower range. A busy machine with high counts (Scenario 2) stays in the benign range of the memory model. File encryption behaviour is a separate signal from the file-activity monitor, not a feature in this table.

---

## 3. Training pipeline and hyperparameters

Executed from `aegis-backend/` with `data/raw/Obfuscated-MalMem2022.csv` present.

| Stage | Setting in the shipped artifacts |
|-------|----------------------------------|
| Features | The eight names in section 2.1 |
| Scale | None. Trees are used unscaled |
| Ensemble | Mean of Random Forest and XGBoost malware probabilities |
| SHAP | `shap.TreeExplainer` on the Random Forest, interventional background in `shap_background.pkl` |

`train_models.py` still imports SMOTE and `StandardScaler`. The JSON next to the live pickles does not. Treat `training_metrics.json` as the record of the models that are loaded.

**Written artifacts**

| File | Content |
|------|---------|
| `random_forest.pkl` | sklearn RF used for the ensemble and for SHAP |
| `xgboost.pkl` | XGBClassifier |
| `scaler.pkl` | Pass-through transform |
| `feature_names.pkl` | The eight names in section 2.1 |
| `shap_background.pkl` | Background matrix for TreeExplainer |
| `training_metrics.json` | Held-out scores, confusion counts, feature importance, class counts |

---

## 4. Empirical benchmark performance

Source: `training_metrics.json`. Scores are rounded below. The research page reads the same file.

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|-----|---------|
| Random Forest | 0.9995 | 0.9998 | 0.9991 | 0.9995 | 1.0000 |
| XGBoost | 0.9996 | 1.0000 | 0.9991 | 0.9996 | 1.0000 |

**Random Forest confusion matrix:** TN 5846, FP 1, FN 5, TP 5761.

**XGBoost confusion matrix:** TN 5847, FP 0, FN 5, TP 5761.

**Feature importance (descending, from the JSON)**

| Feature | Importance |
|---------|------------|
| `dlllist.avg_dlls_per_proc` | 0.2938 |
| `handles.avg_handles_per_proc` | 0.2018 |
| `pslist.avg_handlers` | 0.1782 |
| `handles.nhandles` | 0.1167 |
| `pslist.avg_threads` | 0.0997 |
| `dlllist.ndlls` | 0.0764 |
| `pslist.nppid` | 0.0278 |
| `pslist.nproc` | 0.0055 |

Near-perfect scores describe this CIC subset. Live snapshots are judged separately. The online ensemble is `malware_probability = clip((P_rf + P_xgb) / 2, 0, 1)`. SHAP is computed on the Random Forest only. The final stored severity can be raised by the behavioural file-activity signal.

---

## 5. Explainability architecture

Class: `SHAPExplainabilityService` (`app/services/shap_service.py`).

| Item | Implementation |
|------|----------------|
| Algorithm | `shap.TreeExplainer` |
| Model | Loaded `random_forest.pkl` |
| Background | `shap_background.pkl`, interventional perturbation |
| Input | The eight-feature vector after the pass-through scaler |
| Class | Malware-class SHAP row (handles list / 2D / 3D TreeExplainer layouts) |

**JSON vector schema** (stored as text on `AssessmentRecord.top_shap_features` and returned as `SHAPImpact[]`):

```json
[
  { "feature": "dlllist.avg_dlls_per_proc", "impact": 0.250123 },
  { "feature": "handles.nhandles", "impact": 0.096001 }
]
```

- `feature`: exact CIC column name from `HARMONIZED_FEATURES`.
- `impact`: float, rounded to 6 decimal places; **positive** increases malware-class log-odds contribution; **negative** supports benign.
- Sorted by `abs(impact)` descending before persist.

Frontend charts (`/analysis`, `/sandbox`, history modal) plot this list as-is. They do not recompute SHAP in the browser.
