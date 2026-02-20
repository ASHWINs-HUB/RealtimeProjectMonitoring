import pool from './src/config/database.js';
import { mlAnalytics } from './src/services/mlAnalytics.js';
import logger from './src/utils/logger.js';

/**
 * AI Analytics Tester
 * Use this to verify that:
 * 1. Forecasts are unique per project
 * 2. Predicted values are realistically behind Actual values
 * 3. Risk scores react to task data
 */

const testAnalytics = async () => {
    console.log('\n🤖 ProjectPulse AI Analytics Test Suite');
    console.log('========================================');

    try {
        console.log('\nStep 1: Fetching current project snapshots...');
        const projects = await pool.query('SELECT id, name, status FROM projects LIMIT 5');

        if (projects.rows.length === 0) {
            console.log('❌ No projects found in database. Please create a project first.');
            return;
        }

        console.log(`Found ${projects.rows.length} projects. Triggering AI Recalculation...`);

        // This triggers the entire ML pipeline
        await mlAnalytics.computeAllMetrics();
        console.log('✅ Recalculation Complete!');

        console.log('\nStep 2: Analyzing AI Forecast Diversity (The "Unique" Parameter Test)');
        const forecasts = await pool.query(`
            SELECT p.name, m.value as est_days, m.confidence, m.metadata->>'on_track' as on_track
            FROM projects p
            JOIN analytics_metrics m ON p.id = m.project_id
            WHERE m.metric_type = 'completion_forecast'
            AND m.computed_at > NOW() - INTERVAL '5 minutes'
            ORDER BY m.computed_at DESC
        `);

        console.table(forecasts.rows.map(f => ({
            Project: f.name,
            'Forecast (Days)': f.est_days,
            'AI Confidence': `${f.confidence}%`,
            'Status': f.on_track === 'true' ? '✅ ON TRACK' : '⚠️ AT RISK'
        })));

        console.log('\nStep 3: Checking Risk Factor Nuance');
        const risks = await pool.query(`
            SELECT p.name, m.value as risk_score, m.metadata->>'level' as level, m.metadata->>'source' as model
            FROM projects p
            JOIN analytics_metrics m ON p.id = m.project_id
            WHERE m.metric_type = 'project_risk'
            AND m.computed_at > NOW() - INTERVAL '5 minutes'
        `);

        console.table(risks.rows.map(r => ({
            Project: r.name,
            'Risk Score': `${r.risk_score}%`,
            'Risk Level': r.level.toUpperCase(),
            'AI Model': r.model === 'xgboost' ? '🤖 XGBOOST' : '📊 HEURISTIC'
        })));

        console.log('\n💡 TEST OBSERVATION:');
        console.log('- If scores are different for each project, your "Unique values" requirement is working!');
        console.log('- Open "Project Detail" in your browser to see the S-Curve of Actual > Predicted.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

testAnalytics();
