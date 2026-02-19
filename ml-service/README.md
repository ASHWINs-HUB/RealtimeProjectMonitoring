"""
NOTE: This ML service requires Python 3.10–3.12 with scikit-learn and xgboost.
Python 3.15 alpha does not yet have pre-built wheels for scikit-learn.

To install Python 3.12:
  1. Download from https://www.python.org/downloads/release/python-3121/
  2. Or use: winget install Python.Python.3.12
  3. Then: py -3.12 -m pip install -r requirements.txt
  4. Generate data: py -3.12 scripts/generate_training_data.py
  5. Train model: py -3.12 scripts/train_model.py
  6. Start server: py -3.12 main.py

The Node.js backend has a built-in ML fallback engine that works without
this Python service. The Python service provides higher-accuracy XGBoost
predictions when available.
"""
