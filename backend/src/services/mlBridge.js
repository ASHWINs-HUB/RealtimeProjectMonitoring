/**
 * ProjectPulse — ML Bridge Service
 * Calls the Python FastAPI ML service for XGBoost predictions.
 * Falls back to the built-in heuristic engine if Python service is unavailable.
 */

import logger from '../utils/logger.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class MLBridgeService {
    constructor() {
        this.available = false;
        this.lastCheck = 0;
        this.checkInterval = 60000; // Re-check availability every 60s
    }

    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const resp = await fetch(`${ML_SERVICE_URL}/health`, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await resp.json();
            this.available = data.models_loaded === true;
            this.lastCheck = Date.now();
            return this.available;
        } catch {
            this.available = false;
            this.lastCheck = Date.now();
            return false;
        }
    }

    async isAvailable() {
        if (Date.now() - this.lastCheck > this.checkInterval) {
            return this.checkHealth();
        }
        return this.available;
    }

    /**
     * Call Python ML service for risk prediction
     * @param {Object} features - Feature vector
     * @returns {Object|null} Prediction result or null if unavailable
     */
    async predict(features) {
        if (!(await this.isAvailable())) return null;

        try {
            const resp = await fetch(`${ML_SERVICE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(features),
            });

            if (!resp.ok) return null;
            return await resp.json();
        } catch (err) {
            logger.warn('ML Bridge predict failed:', err.message);
            return null;
        }
    }

    /**
     * Trigger model retraining
     */
    async retrain() {
        if (!(await this.isAvailable())) {
            return { success: false, message: 'Python ML service unavailable' };
        }

        try {
            const resp = await fetch(`${ML_SERVICE_URL}/retrain`, { method: 'POST' });
            return await resp.json();
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
}

export const mlBridge = new MLBridgeService();
