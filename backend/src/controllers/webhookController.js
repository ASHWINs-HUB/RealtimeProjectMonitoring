import logger from '../utils/logger.js';
import pool from '../config/database.js';
import { jiraSyncService } from '../application/services/JiraSyncService.js';

/**
 * Handle incoming Jira Webhooks
 * This allows receiving "parameters" (issue data, status changes) directly from Jira in real-time.
 */
export const handleJiraWebhook = async (req, res) => {
    try {
        const payload = req.body;
        const eventType = payload.webhookEvent; // e.g., jira:issue_updated
        const issue = payload.issue;

        logger.info(`Received Jira Webhook: ${eventType} for issue ${issue?.key}`);

        if (!issue || !issue.key) {
            return res.status(200).json({ success: true, message: 'No issue data found, skipping' });
        }

        // Example of "receiving a parameter" - extracting a specific field
        // Jira parameters are usually in issue.fields
        const status = issue.fields?.status?.name;
        const summary = issue.fields?.summary;
        const projectKey = issue.fields?.project?.key;

        logger.info(`Jira Parameter Received - Event: ${eventType}, Issue: ${issue.key}, Status: ${status}`);

        // If it's a project we are tracking, we can sync it
        const mapping = await pool.query(
            'SELECT project_id FROM jira_mapping WHERE jira_project_key = $1 LIMIT 1',
            [projectKey]
        );

        if (mapping.rows.length > 0) {
            const projectId = mapping.rows[0].project_id;
            // Optionally trigger a sync or update specific task
            await jiraSyncService.syncProject(projectId);
            logger.info(`Triggered real-time sync for project ${projectId} via Jira Webhook`);
        }

        // Always return 200 to Jira to acknowledge receipt
        res.status(200).json({ success: true, received: true });
    } catch (error) {
        logger.error('Jira Webhook processing failed:', error.message);
        // Still return 200 or 500 depending on if we want Jira to retry
        res.status(500).json({ success: false, error: error.message });
    }
};
