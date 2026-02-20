import axios from 'axios';

/**
 * Jira Webhook Simulation Script
 * This script sends a mock payload to the backend to simulate an issue status update from Jira.
 */

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/jira';
const SECRET_TOKEN = 'secure_jira_pulse_token_2024';

const simulateJiraEvent = async () => {
    console.log('🚀 Starting Jira Webhook Simulation...');

    const payload = {
        webhookEvent: 'jira:issue_updated',
        issue: {
            key: 'PROJ-101',
            fields: {
                summary: 'Simulated Task Update',
                status: {
                    name: 'Done'
                },
                project: {
                    key: 'PROJ'
                },
                priority: {
                    name: 'High'
                }
            }
        }
    };

    try {
        const response = await axios.post(`${WEBHOOK_URL}?token=${SECRET_TOKEN}`, payload);
        console.log('✅ Simulation Successful!');
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
        console.log('\nCheck your server logs to see the "Done" parameter being processed.');
    } catch (error) {
        console.error('❌ Simulation Failed!');
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
    }
};

simulateJiraEvent();
