"""
ProjectPulse AI — XGBoost Model Training Pipeline
====================================================
Trains two models:
  1. XGBClassifier for risk classification (low / medium / high)
  2. XGBRegressor for risk score prediction (0–100)

Saves models to ../models/ directory.
Prints classification report and feature importances.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from xgboost import XGBClassifier, XGBRegressor


FEATURE_COLUMNS = [
    "commit_frequency",
    "pr_review_time_hrs",
    "pr_rejection_ratio",
    "issue_completion_days",
    "reopened_issues_ratio",
    "sprint_delay_pct",
    "overdue_task_ratio",
    "blocked_task_ratio",
    "team_size",
    "days_remaining_ratio",
    "effort_ratio",
    "inactive_contributors_ratio",
]

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_data() -> pd.DataFrame:
    """Load training data CSV."""
    path = os.path.join(DATA_DIR, "training_data.csv")
    if not os.path.exists(path):
        print("❌ training_data.csv not found. Run generate_training_data.py first.")
        sys.exit(1)
    df = pd.read_csv(path)
    print(f"📂 Loaded {len(df)} samples from {path}")
    return df


def train_classifier(X_train, X_test, y_train, y_test, le):
    """Train XGBoost classifier for risk class."""
    print("\n" + "=" * 60)
    print("🎯 TRAINING RISK CLASSIFIER (XGBoost)")
    print("=" * 60)

    clf = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="mlogloss",
        use_label_encoder=False,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    print("\n📊 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    print("📊 Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(pd.DataFrame(cm, index=le.classes_, columns=le.classes_))

    # Cross-validation
    cv_scores = cross_val_score(clf, X_train, y_train, cv=5, scoring="accuracy")
    print(f"\n🔄 5-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    return clf


def train_regressor(X_train, X_test, y_train_score, y_test_score):
    """Train XGBoost regressor for risk score (0–100)."""
    print("\n" + "=" * 60)
    print("📈 TRAINING RISK SCORE REGRESSOR (XGBoost)")
    print("=" * 60)

    reg = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="rmse",
    )
    reg.fit(X_train, y_train_score)

    y_pred = reg.predict(X_test)

    mae = mean_absolute_error(y_test_score, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test_score, y_pred))
    r2 = r2_score(y_test_score, y_pred)

    print(f"\n📊 Regression Metrics:")
    print(f"   MAE:  {mae:.2f}")
    print(f"   RMSE: {rmse:.2f}")
    print(f"   R²:   {r2:.4f}")

    return reg


def print_feature_importance(model, feature_names, title="Feature Importances"):
    """Print sorted feature importances."""
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    print(f"\n🏆 {title}:")
    for i, idx in enumerate(sorted_idx):
        bar = "█" * int(importances[idx] * 50)
        print(f"   {i+1:2d}. {feature_names[idx]:<30s} {importances[idx]:.4f} {bar}")


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    # Load data
    df = load_data()

    X = df[FEATURE_COLUMNS].values
    y_score = df["risk_score"].values
    y_class = df["risk_class"].values

    # Encode labels
    le = LabelEncoder()
    y_class_encoded = le.fit_transform(y_class)

    # Split
    X_train, X_test, y_cls_train, y_cls_test, y_scr_train, y_scr_test = train_test_split(
        X, y_class_encoded, y_score, test_size=0.2, random_state=42, stratify=y_class_encoded
    )

    print(f"📊 Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"📊 Classes: {dict(zip(le.classes_, np.bincount(y_class_encoded)))}")

    # Train classifier
    clf = train_classifier(X_train, X_test, y_cls_train, y_cls_test, le)
    print_feature_importance(clf, FEATURE_COLUMNS, "Classifier Feature Importances")

    # Train regressor
    reg = train_regressor(X_train, X_test, y_scr_train, y_scr_test)
    print_feature_importance(reg, FEATURE_COLUMNS, "Regressor Feature Importances")

    # Save models
    clf_path = os.path.join(MODELS_DIR, "risk_classifier.joblib")
    reg_path = os.path.join(MODELS_DIR, "risk_regressor.joblib")
    le_path = os.path.join(MODELS_DIR, "label_encoder.joblib")

    joblib.dump(clf, clf_path)
    joblib.dump(reg, reg_path)
    joblib.dump(le, le_path)

    print(f"\n💾 Models saved:")
    print(f"   Classifier → {clf_path}")
    print(f"   Regressor  → {reg_path}")
    print(f"   Encoder    → {le_path}")

    # Save metadata
    metadata = {
        "trained_at": datetime.utcnow().isoformat(),
        "n_samples": len(df),
        "n_features": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "classes": list(le.classes_),
        "model_type": "XGBoost",
        "classifier_cv_accuracy": float(cross_val_score(clf, X_train, y_cls_train, cv=5, scoring="accuracy").mean()),
        "regressor_r2": float(r2_score(y_scr_test, reg.predict(X_test))),
    }

    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"   Metadata   → {meta_path}")

    print("\n✅ Training pipeline complete!")


if __name__ == "__main__":
    main()
