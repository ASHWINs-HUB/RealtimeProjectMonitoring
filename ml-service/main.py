from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging
from datetime import datetime, timedelta
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ProjectPulse AI ML Service", version="1.0.0")

# Global variables for models
risk_classifier = None
delivery_regressor = None
scaler = None
model_version = "1.0.0"

# Model paths
RISK_MODEL_PATH = "./models/risk_classifier.pkl"
DELIVERY_MODEL_PATH = "./models/delivery_regressor.pkl"
SCALER_PATH = "./models/scaler.pkl"

class SprintData(BaseModel):
    total_story_points: int
    remaining_story_points: int
    avg_pr_merge_time: float
    reopened_issues: int
    commit_frequency: float
    developer_workload: float
    sprint_velocity: float
    active_developers: int
    overdue_issues: int
    completed_tasks: int
    total_tasks: int

class PredictionRequest(BaseModel):
    sprint_data: SprintData
    project_id: Optional[str] = None

class TrainingData(BaseModel):
    sprint_data: List[SprintData]
    labels: List[Dict[str, Any]]  # Contains risk_category and delivery_days

class PredictionResponse(BaseModel):
    risk_probability: float
    risk_category: str
    predicted_delivery_date: Optional[str]
    confidence_score: float
    feature_importance: Dict[str, float]

class TrainingResponse(BaseModel):
    message: str
    model_version: str
    risk_accuracy: float
    delivery_mae: float
    training_samples: int
    feature_importance: Dict[str, float]

def create_models_directory():
    """Create models directory if it doesn't exist"""
    os.makedirs("./models", exist_ok=True)

def load_models():
    """Load pre-trained models if they exist"""
    global risk_classifier, delivery_regressor, scaler, model_version
    
    try:
        if os.path.exists(RISK_MODEL_PATH):
            risk_classifier = joblib.load(RISK_MODEL_PATH)
            logger.info("Risk classifier model loaded")
        
        if os.path.exists(DELIVERY_MODEL_PATH):
            delivery_regressor = joblib.load(DELIVERY_MODEL_PATH)
            logger.info("Delivery regressor model loaded")
        
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info("Scaler loaded")
            
    except Exception as e:
        logger.error(f"Error loading models: {e}")

def prepare_features(sprint_data: SprintData) -> np.ndarray:
    """Prepare features for prediction"""
    features = np.array([[
        sprint_data.total_story_points,
        sprint_data.remaining_story_points,
        sprint_data.avg_pr_merge_time,
        sprint_data.reopened_issues,
        sprint_data.commit_frequency,
        sprint_data.developer_workload,
        sprint_data.sprint_velocity,
        sprint_data.active_developers,
        sprint_data.overdue_issues,
        sprint_data.completed_tasks,
        sprint_data.total_tasks
    ]])
    
    # Scale features if scaler is available
    if scaler is not None:
        features = scaler.transform(features)
    
    return features

def calculate_risk_category(probability: float) -> str:
    """Convert probability to risk category"""
    if probability < 0.3:
        return "Low"
    elif probability < 0.7:
        return "Medium"
    else:
        return "High"

def predict_delivery_date(sprint_data: SprintData, days_until_completion: float) -> str:
    """Predict delivery date based on sprint data"""
    current_date = datetime.now()
    predicted_date = current_date + timedelta(days=int(days_until_completion))
    return predicted_date.isoformat()

@app.on_event("startup")
async def startup_event():
    """Initialize the ML service"""
    create_models_directory()
    load_models()
    logger.info("ML Service started successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ProjectPulse AI ML Service",
        "version": model_version,
        "status": "running",
        "models_loaded": {
            "risk_classifier": risk_classifier is not None,
            "delivery_regressor": delivery_regressor is not None,
            "scaler": scaler is not None
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": {
            "risk_classifier": risk_classifier is not None,
            "delivery_regressor": delivery_regressor is not None,
            "scaler": scaler is not None
        }
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """Predict project risk and delivery date"""
    global risk_classifier, delivery_regressor, scaler
    
    if risk_classifier is None or delivery_regressor is None:
        raise HTTPException(
            status_code=503, 
            detail="Models not trained yet. Please train the models first."
        )
    
    try:
        # Prepare features
        features = prepare_features(request.sprint_data)
        
        # Predict risk probability
        risk_prob = risk_classifier.predict_proba(features)[0][1]  # Probability of high risk
        
        # Predict delivery days
        delivery_days = delivery_regressor.predict(features)[0]
        
        # Calculate risk category
        risk_category = calculate_risk_category(risk_prob)
        
        # Predict delivery date
        predicted_delivery_date = predict_delivery_date(request.sprint_data, delivery_days)
        
        # Calculate confidence score
        confidence_score = max(risk_prob, 1 - risk_prob) * 100
        
        # Get feature importance
        feature_names = [
            'total_story_points', 'remaining_story_points', 'avg_pr_merge_time',
            'reopened_issues', 'commit_frequency', 'developer_workload',
            'sprint_velocity', 'active_developers', 'overdue_issues',
            'completed_tasks', 'total_tasks'
        ]
        
        feature_importance = dict(zip(
            feature_names, 
            risk_classifier.feature_importances_
        ))
        
        return PredictionResponse(
            risk_probability=round(risk_prob * 100, 2),
            risk_category=risk_category,
            predicted_delivery_date=predicted_delivery_date,
            confidence_score=round(confidence_score, 2),
            feature_importance=feature_importance
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train", response_model=TrainingResponse)
async def train_models(training_data: TrainingData, background_tasks: BackgroundTasks):
    """Train the ML models with provided data"""
    global risk_classifier, delivery_regressor, scaler, model_version
    
    try:
        # Prepare training data
        X = []
        risk_labels = []
        delivery_labels = []
        
        for sprint, label in zip(training_data.sprint_data, training_data.labels):
            features = [
                sprint.total_story_points,
                sprint.remaining_story_points,
                sprint.avg_pr_merge_time,
                sprint.reopened_issues,
                sprint.commit_frequency,
                sprint.developer_workload,
                sprint.sprint_velocity,
                sprint.active_developers,
                sprint.overdue_issues,
                sprint.completed_tasks,
                sprint.total_tasks
            ]
            X.append(features)
            
            # Risk label (convert category to binary: High/Medium = 1, Low = 0)
            risk_category = label.get('risk_category', 'Low')
            risk_labels.append(1 if risk_category in ['High', 'Medium'] else 0)
            
            # Delivery label (days until completion)
            delivery_labels.append(label.get('delivery_days', 30))
        
        X = np.array(X)
        risk_labels = np.array(risk_labels)
        delivery_labels = np.array(delivery_labels)
        
        if len(X) < 10:
            raise HTTPException(
                status_code=400, 
                detail="Insufficient training data. Minimum 10 samples required."
            )
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data for validation
        X_train, X_test, y_risk_train, y_risk_test, y_delivery_train, y_delivery_test = train_test_split(
            X_scaled, risk_labels, delivery_labels, test_size=0.2, random_state=42
        )
        
        # Train risk classifier
        risk_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        risk_classifier.fit(X_train, y_risk_train)
        
        # Train delivery regressor
        delivery_regressor = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        delivery_regressor.fit(X_train, y_delivery_train)
        
        # Evaluate models
        risk_accuracy = accuracy_score(y_risk_test, risk_classifier.predict(X_test))
        delivery_mae = mean_absolute_error(y_delivery_test, delivery_regressor.predict(X_test))
        
        # Save models
        joblib.dump(risk_classifier, RISK_MODEL_PATH)
        joblib.dump(delivery_regressor, DELIVERY_MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)
        
        # Update model version
        model_version = f"1.{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Get feature importance
        feature_names = [
            'total_story_points', 'remaining_story_points', 'avg_pr_merge_time',
            'reopened_issues', 'commit_frequency', 'developer_workload',
            'sprint_velocity', 'active_developers', 'overdue_issues',
            'completed_tasks', 'total_tasks'
        ]
        
        feature_importance = dict(zip(
            feature_names, 
            risk_classifier.feature_importances_
        ))
        
        logger.info(f"Models trained successfully. Risk accuracy: {risk_accuracy:.2f}, Delivery MAE: {delivery_mae:.2f}")
        
        return TrainingResponse(
            message="Models trained successfully",
            model_version=model_version,
            risk_accuracy=round(risk_accuracy * 100, 2),
            delivery_mae=round(delivery_mae, 2),
            training_samples=len(X),
            feature_importance=feature_importance
        )
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/models/status")
async def get_models_status():
    """Get current models status"""
    return {
        "model_version": model_version,
        "models_loaded": {
            "risk_classifier": risk_classifier is not None,
            "delivery_regressor": delivery_regressor is not None,
            "scaler": scaler is not None
        },
        "model_paths": {
            "risk_classifier": RISK_MODEL_PATH,
            "delivery_regressor": DELIVERY_MODEL_PATH,
            "scaler": SCALER_PATH
        }
    }

@app.delete("/models")
async def reset_models():
    """Reset all trained models"""
    global risk_classifier, delivery_regressor, scaler, model_version
    
    try:
        # Delete model files
        for path in [RISK_MODEL_PATH, DELIVERY_MODEL_PATH, SCALER_PATH]:
            if os.path.exists(path):
                os.remove(path)
        
        # Reset global variables
        risk_classifier = None
        delivery_regressor = None
        scaler = None
        model_version = "1.0.0"
        
        logger.info("Models reset successfully")
        
        return {"message": "Models reset successfully"}
        
    except Exception as e:
        logger.error(f"Model reset error: {e}")
        raise HTTPException(status_code=500, detail=f"Model reset failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
