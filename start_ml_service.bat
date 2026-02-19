@echo off
setlocal

echo ==================================================
echo   ProjectPulse AI - Starting ML Microservice
echo ==================================================

:: Set project root and move to ml-service
cd /d "%~dp0"
cd ml-service

echo [INFO] Working Directory: %CD%

:: Always use the detected working python 3.13
set PYTHON_CMD=python

echo [INFO] Using Python: %PYTHON_CMD%
%PYTHON_CMD% --version

:: Create Virtual Environment
if not exist ".venv" (
    echo [INFO] Creating virtual environment...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: Activate Virtual Environment
echo [INFO] Activating virtual environment...
set "VIRTUAL_ENV=%CD%\.venv"
set "PATH=%VIRTUAL_ENV%\Scripts;%PATH%"

:: Check if activation worked
where python
python --version

:: Install Dependencies
echo [INFO] Checking dependencies...
python -m pip install --quiet --upgrade pip
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [WARNING] Dependency installation had issues. Carrying on...
)

:: Check Models
if not exist "models\risk_classifier.joblib" (
    echo [INFO] Models missing. Running training...
    if not exist "data" mkdir data
    if not exist "models" mkdir models
    
    python scripts\generate_training_data.py
    python scripts\train_model.py
)

:: Start the service
echo [INFO] Starting AI Engine (FastAPI)...
echo [INFO] http://localhost:8000
echo.

python main.py

pause
endlocal
