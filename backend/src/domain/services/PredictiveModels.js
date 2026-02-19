/**
 * Pure Domain Models for ML Predictions.
 * No database or external API dependencies here.
 */
export class PredictiveModels {
    /**
     * Calculates Risk Score using Logistic Regression principles
     */
    static calculateRiskScore(features) {
        const weights = {
            blocked_rate: 3.5,
            overdue_rate: 4.0,
            schedule_pressure: 3.0,
            effort_ratio: 1.5,
            commit_frequency: -1.2,
            completion_rate: -2.5
        };

        let z = 0;
        z += (features.blocked_rate || 0) * weights.blocked_rate;
        z += (features.overdue_rate || 0) * weights.overdue_rate;
        z += (features.schedule_pressure || 0) * weights.schedule_pressure;
        z += Math.max(0, (features.effort_ratio - 1)) * weights.effort_ratio;
        z += Math.min(features.commit_frequency || 0, 5) * weights.commit_frequency;
        z += (features.completion_rate || 0) * weights.completion_rate;

        const riskProbability = 1 / (1 + Math.exp(-z));
        const score = Math.round(riskProbability * 100);

        return {
            score,
            level: score > 70 ? 'critical' : score > 50 ? 'high' : score > 30 ? 'medium' : 'low',
            confidence: this._calculateConfidence(features)
        };
    }

    /**
     * Predicts probability of sprint delay
     */
    static predictSprintDelay(features) {
        const delayProbability = features.overdue_rate > 0.3 ? 0.8
            : features.schedule_pressure > 0.2 ? 0.6
                : 0.2;

        const delayDays = Math.round(delayProbability * 14);

        return {
            probability: Math.round(delayProbability * 100),
            estimatedDays: delayDays,
            confidence: features.total_tasks > 5 ? 0.6 : 0.3
        };
    }

    /**
     * Multi-factor developer performance scoring
     */
    static calculateDevPerformance(stats) {
        const total = parseInt(stats.total) || 0;
        const completed = parseInt(stats.completed) || 0;
        const onTime = parseInt(stats.on_time) || 0;

        const completionRate = total > 0 ? completed / total : 0;
        const onTimeRate = completed > 0 ? onTime / completed : 0;

        const score = Math.round((completionRate * 0.6 + onTimeRate * 0.4) * 100);

        return {
            score,
            level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'average',
            confidence: total >= 3 ? 0.8 : 0.4
        };
    }

    /**
     * Burnout detection based on workload and late-night activity
     */
    static detectBurnout(stats) {
        const activeTasks = parseInt(stats.active_tasks) || 0;
        const lateCommits = parseInt(stats.late_commits) || 0;

        const score = Math.min(100, (activeTasks * 10) + (lateCommits * 5));

        return {
            score,
            level: score > 70 ? 'critical' : score > 40 ? 'moderate' : 'low',
            confidence: 0.7
        };
    }

    static _calculateConfidence(features) {
        const hasData = [
            features.total_tasks > 0,
            features.monthly_commits > 0
        ].filter(Boolean).length;
        return Math.round((hasData / 2) * 100);
    }
}
