"""
ProjectPulse AI — FastAPI ML Inference Service
================================================
Loads trained XGBoost models and exposes prediction endpoints.

Endpoints:
  GET  /health          — Service health check
  POST /predict         — Predict risk from feature vector
  POST /predict/batch   — Batch prediction
  POST /retrain         — Trigger model retraining
  GET  /model/info      — Model metadata
"""

import os
import json
import subprocess
import sys
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIG =====
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
SCRIPTS_DIR = os.path.join(os.path.dirname(__file__), "scripts")
PORT = int(os.getenv("ML_SERVICE_PORT", 8000))

# ===== MODELS =====
classifier = None
regressor = None
label_encoder = None
model_metadata = None

def load_models():
    """Load trained models from disk."""
    global classifier, regressor, label_encoder, model_metadata

    clf_path = os.path.join(MODELS_DIR, "risk_classifier.joblib")
    reg_path = os.path.join(MODELS_DIR, "risk_regressor.joblib")
    le_path = os.path.join(MODELS_DIR, "label_encoder.joblib")
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")

    if not os.path.exists(clf_path):
        print("⚠️  Models not found. Training will be required.")
        return False

    try:
        classifier = joblib.load(clf_path)
        regressor = joblib.load(reg_path)
        label_encoder = joblib.load(le_path)

        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                model_metadata = json.load(f)

        print(f"✅ Models loaded from {MODELS_DIR}")
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    print("🚀 [ML SERVICE] Startup: Loading models...")
    success = load_models()
    if success:
        print("✅ [ML SERVICE] Models loaded successfully!")
    else:
        print("❌ [ML SERVICE] Failed to load models on startup.")
    yield

# ===== APP =====
app = FastAPI(
    title="ProjectPulse ML Service",
    description="XGBoost-based risk prediction for project monitoring",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== SCHEMAS =====
class RiskFeatures(BaseModel):
    """Input features for risk prediction."""
    commit_frequency: float = Field(..., ge=0, le=20, description="Avg daily commits")
    pr_review_time_hrs: float = Field(..., ge=0, le=120, description="Avg PR review time (hours)")
    pr_rejection_ratio: float = Field(..., ge=0, le=1, description="Fraction of PRs rejected")
    issue_completion_days: float = Field(..., ge=0, le=60, description="Avg days to close issues")
    reopened_issues_ratio: float = Field(..., ge=0, le=1, description="Fraction of issues reopened")
    sprint_delay_pct: float = Field(..., ge=0, le=1, description="Sprint spillover fraction")
    overdue_task_ratio: float = Field(..., ge=0, le=1, description="Fraction of overdue tasks")
    blocked_task_ratio: float = Field(..., ge=0, le=1, description="Fraction of blocked tasks")
    team_size: int = Field(..., ge=1, le=50, description="Team size")
    days_remaining_ratio: float = Field(..., ge=0, le=1, description="Time elapsed ratio")
    effort_ratio: float = Field(..., ge=0, le=5, description="Actual/estimated hours ratio")
    inactive_contributors_ratio: float = Field(..., ge=0, le=1, description="Inactive team ratio")


class RiskPrediction(BaseModel):
    """Output prediction."""
    risk_score: float
    risk_class: str
    risk_level: str
    confidence: float
    model_version: Optional[str] = None
    features_used: dict


class BatchPredictionRequest(BaseModel):
    samples: list[RiskFeatures]


# ===== ENDPOINTS =====

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": classifier is not None,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ProjectPulse ML Service",
    }


@app.post("/predict", response_model=RiskPrediction)
async def predict(features: RiskFeatures):
    """Predict risk from feature vector."""
    if classifier is None or regressor is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Run /retrain first.")

    feature_array = np.array([[
        features.commit_frequency,
        features.pr_review_time_hrs,
        features.pr_rejection_ratio,
        features.issue_completion_days,
        features.reopened_issues_ratio,
        features.sprint_delay_pct,
        features.overdue_task_ratio,
        features.blocked_task_ratio,
        features.team_size,
        features.days_remaining_ratio,
        features.effort_ratio,
        features.inactive_contributors_ratio,
    ]])

    # Risk score (0–100)
    risk_score = float(np.clip(regressor.predict(feature_array)[0], 0, 100))

    # Risk class
    class_idx = classifier.predict(feature_array)[0]
    risk_class = label_encoder.inverse_transform([class_idx])[0]

    # Confidence from classifier probabilities
    probabilities = classifier.predict_proba(feature_array)[0]
    confidence = float(max(probabilities))

    # Human-readable risk level
    if risk_score > 65:
        risk_level = "high"
    elif risk_score > 40:
        risk_level = "medium"
    else:
        risk_level = "low"

    return RiskPrediction(
        risk_score=round(risk_score, 2),
        risk_class=risk_class,
        risk_level=risk_level,
        confidence=round(confidence, 4),
        model_version=model_metadata.get("trained_at", "unknown") if model_metadata else "unknown",
        features_used=features.dict(),
    )


@app.post("/predict/batch")
async def predict_batch(request: BatchPredictionRequest):
    """Batch predict risk for multiple samples."""
    if classifier is None or regressor is None:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    results = []
    for sample in request.samples:
        feature_array = np.array([[
            sample.commit_frequency, sample.pr_review_time_hrs,
            sample.pr_rejection_ratio, sample.issue_completion_days,
            sample.reopened_issues_ratio, sample.sprint_delay_pct,
            sample.overdue_task_ratio, sample.blocked_task_ratio,
            sample.team_size, sample.days_remaining_ratio,
            sample.effort_ratio, sample.inactive_contributors_ratio,
        ]])

        risk_score = float(np.clip(regressor.predict(feature_array)[0], 0, 100))
        class_idx = classifier.predict(feature_array)[0]
        risk_class = label_encoder.inverse_transform([class_idx])[0]
        probabilities = classifier.predict_proba(feature_array)[0]
        confidence = float(max(probabilities))

        risk_level = "high" if risk_score > 65 else "medium" if risk_score > 40 else "low"

        results.append({
            "risk_score": round(risk_score, 2),
            "risk_class": risk_class,
            "risk_level": risk_level,
            "confidence": round(confidence, 4),
        })

    return {"predictions": results, "count": len(results)}


@app.post("/retrain")
async def retrain():
    """Trigger full retraining: generate data → train model → reload."""
    try:
        # Step 1: Generate synthetic data
        gen_script = os.path.join(SCRIPTS_DIR, "generate_training_data.py")
        subprocess.run([sys.executable, gen_script], check=True, capture_output=True, text=True)

        # Step 2: Train model
        train_script = os.path.join(SCRIPTS_DIR, "train_model.py")
        result = subprocess.run([sys.executable, train_script], check=True, capture_output=True, text=True)

        # Step 3: Reload models
        load_models()

        return {
            "status": "success",
            "message": "Models retrained and loaded successfully",
            "output": result.stdout[-500:] if result.stdout else "",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {e.stderr[-300:]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model/info")
async def model_info():
    """Return current model metadata."""
    if model_metadata is None:
        return {"status": "no_model", "message": "No trained model available. Run /retrain."}
    return model_metadata


# ===== MAIN =====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
