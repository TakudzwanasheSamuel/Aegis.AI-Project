# Machine learning and XAI technical report

Artifacts directory: `aegis-backend/app/ml/`  
Training entry: `aegis-backend/train_models.py`  
Canonical feature list: `app/services/feature_space.py` (`HARMONIZED_FEATURES`)  
Live scores: `training_metrics.json`

---

## 1. Training dataset profile

| Property | Value |
|----------|--------|
| Corpus | CIC-MalMem-2022 (`Obfuscated-MalMem2022.csv`) |
| Samples (`n_samples`) | **58,596** |
| Class balance | **29,298 benign / 29,298 malware** (`class_counts`) |
| Label column | `Class` (or `Category` / `label` if present) |
| Positive class | strings containing `Malware` or `Ransomware`, or `"1"` |
| Operational features | **8** (not the full 55+ dump columns) |

The full CIC dump contains dozens of Volatility-derived columns. AegisAI trains and infers **only** on the eight names that the harmonization layer can populate from live telemetry.

Held-out test size: **0.20**, `random_state=42`, **stratified**. Train fold after split: 23,438 per class. SMOTE is applied (`smote: true`); because the corpus is already balanced, `post_smote_train` equals `pre_smote_train` (23,438 / 23,438).

---

## 2. Feature Harmonization Layer

### 2.1 Eight-feature operational subset

| Order | CIC column | Forensic meaning (dump-level) |
|-------|------------|-------------------------------|
| 1 | `handles.nhandles` | Total handle table size |
| 2 | `pslist.avg_threads` | Average threads across listed processes |
| 3 | `dlllist.ndlls` | Loaded module / DLL count |
| 4 | `malfind.commitCharge` | Suspicious VAD commit charge (injection-like) |
| 5 | `svcscan.nservices` | Enumerated services |
| 6 | `ldrmodules.not_in_load` | Modules not in the load list (hiding) |
| 7 | `handles.nfile` | File-type handles |
| 8 | `malfind.ninjections` | Count of malfind injection regions |

### 2.2 Mapping from `psutil` / WMI-style runtime counters

Live `TelemetryPayload` fields are **per-process**:

| Live field | Agent source |
|------------|----------------|
| `cpu_percent` | `Process.cpu_percent` |
| `memory_mb` | `memory_info().rss / 1024^2` |
| `thread_count` | `num_threads()` |
| `open_handles` | `num_handles()` (Windows) or `num_fds()` |
| `loaded_modules` | `len(memory_maps())` |

**Intensity** (code: `FeatureHarmonizationService._ransom_intensity`):

```
I = clamp(
      0.30 * unit(open_handles, 400, 1800)
    + 0.30 * unit(thread_count, 40, 180)
    + 0.15 * unit(cpu_percent, 55, 95)
    + 0.15 * unit(memory_mb, 600, 2000)
    + 0.10 * unit(loaded_modules, 40, 110)
  , 0, 1)
```

where `unit(x, lo, hi) = clamp((x - lo) / (hi - lo), 0, 1)`.

**Linear interpolation** onto CIC centroids for each feature `f`:

```
x_f = (1 - I) * BENIGN_f + I * MALWARE_f
```

Class-conditional centroids (empirical CIC medians used in code):

| Feature | `_BENIGN` | `_MALWARE` |
|---------|-----------|------------|
| `handles.nhandles` | 12185.0 | 8414.0 |
| `pslist.avg_threads` | 12.838 | 9.974 |
| `dlllist.ndlls` | 2086.0 | 1557.0 |
| `malfind.commitCharge` | 5.0 | 1928.0 |
| `svcscan.nservices` | 395.0 | 389.0 |
| `ldrmodules.not_in_load` | 74.0 | 46.0 |
| `handles.nfile` | 1079.5 | 646.0 |
| `malfind.ninjections` | 4.0 | 9.0 |

**Malfind gate:** if `I < 0.55`, `commitCharge = 5 + I*60` and `ninjections = 4 + I*4` (benign-scale). If `I ≥ 0.55`, interpolate from benign toward malware `commitCharge` and toward 24 injections. This keeps sandbox Scenario 2 (high CPU/RAM, moderate handles/threads) inside the Safe region.

### 2.3 Semantic equivalence rationale

Ransomware in the **pre-encryption / cryptographic traversal** phase typically:

- Walks large file sets (handle and file-handle pressure).
- Spawns worker threads for enumeration or crypto.
- Touches many modules and private committed pages.
- In dumps, appears as anomalous `malfind` VADs and handle-table growth.

AegisAI does **not** claim that `open_handles == handles.nhandles`. It claims that **intensity of those user-space counters is a usable proxy** for position on the CIC class manifold, which is what the trees were trained on. Examiners should treat harmonization as a **domain translation layer**, not as Volatility equivalence.

---

## 3. Training pipeline and hyperparameters

Executed from `aegis-backend/` with `data/raw/Obfuscated-MalMem2022.csv` present.

| Stage | Setting |
|-------|---------|
| Split | `train_test_split(..., test_size=0.2, random_state=42, stratify=y)` |
| Imbalance | `SMOTE(random_state=42)` on the training fold only |
| Scale | `StandardScaler` fit on SMOTE-resampled train; applied to test and to live vectors |
| Random Forest | `RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)` |
| XGBoost | `XGBClassifier(n_estimators=100, learning_rate=0.1, random_state=42, eval_metric="logloss")` |
| SHAP background | 64 scaled training rows, `numpy` RNG seed 42, stored as `shap_background.pkl` |

**Written artifacts**

| File | Content |
|------|---------|
| `random_forest.pkl` | sklearn RF |
| `xgboost.pkl` | XGBClassifier |
| `scaler.pkl` | StandardScaler |
| `feature_names.pkl` | list of 8 strings |
| `shap_background.pkl` | `(64, 8)` scaled array |
| `training_metrics.json` | metrics, confusion, ROC, importances, class counts |

Optional refresh of visual payloads without retraining: `python export_eval_metrics.py`.

---

## 4. Empirical benchmark performance

Source: `training_metrics.json` (held-out test, 11,720 rows: 5,860 benign + 5,860 malware).

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|-----|---------|
| Random Forest | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| XGBoost | 0.999744 | 0.999829 | 0.999659 | 0.999744 | 0.99999991 |

**Random Forest confusion matrix**

|  | Predicted + | Predicted − |
|--|-------------|-------------|
| Actual + | TP 5860 | FN 0 |
| Actual − | FP 0 | TN 5860 |

**XGBoost confusion matrix**

|  | Predicted + | Predicted − |
|--|-------------|-------------|
| Actual + | TP 5858 | FN 2 |
| Actual − | FP 1 | TN 5859 |

**Random Forest impurity importance (descending)**

| Feature | Importance |
|---------|------------|
| `svcscan.nservices` | 0.2664 |
| `dlllist.ndlls` | 0.2515 |
| `handles.nhandles` | 0.1929 |
| `ldrmodules.not_in_load` | 0.1318 |
| `pslist.avg_threads` | 0.1005 |
| `handles.nfile` | 0.0448 |
| `malfind.commitCharge` | 0.0103 |
| `malfind.ninjections` | 0.0018 |

These scores describe **CIC dump rows**, not raw `psutil` sliders. Perfect RF separation on eight CIC columns is expected given that subset's class structure; live false-safe or false-critical outcomes are a property of **harmonization**, which is why Scenario 2 is documented as Safe by design.

**Online ensemble:** `malware_probability = clip((P_rf + P_xgb) / 2, 0, 1)`. SHAP is computed on RF only (TreeExplainer compatibility).

---

## 5. Explainability architecture

Class: `SHAPExplainabilityService` (`app/services/shap_service.py`).

| Item | Implementation |
|------|----------------|
| Algorithm | `shap.TreeExplainer` |
| Model | Loaded `random_forest.pkl` |
| Background | `shap_background.pkl`, interventional perturbation |
| Input | Scaled 8-vector (`PredictionService.scale`) |
| Class | Malware-class SHAP row (handles list / 2D / 3D TreeExplainer layouts) |

**JSON vector schema** (stored as text on `AssessmentRecord.top_shap_features` and returned as `SHAPImpact[]`):

```json
[
  { "feature": "svcscan.nservices", "impact": 0.250123 },
  { "feature": "pslist.avg_threads", "impact": 0.096001 }
]
```

- `feature`: exact CIC column name from `HARMONIZED_FEATURES`.
- `impact`: float, rounded to 6 decimal places; **positive** increases malware-class log-odds contribution; **negative** supports benign.
- Sorted by `abs(impact)` descending before persist.

Frontend charts (`/analysis`, `/sandbox`, history modal) plot this list as-is. They do not recompute SHAP in the browser.
