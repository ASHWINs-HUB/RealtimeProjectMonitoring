import axios from 'axios';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

export class JiraClient {
    constructor() {
        this.baseURL = config.jira.apiUrl;
        this.email = config.jira.email;
        this.apiToken = config.jira.token;
        this.authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
    }

    async request(method, endpoint, data = null) {
        try {
            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    Authorization: this.authHeader,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data
            });
            return response.data;
        } catch (error) {
            const errMsg = error.response?.data?.errorMessages?.[0] || error.message;
            logger.error(`Jira API error [${method} ${endpoint}]: ${errMsg}`);
            throw new Error(`Jira API error: ${errMsg}`);
        }
    }

    async getProjectIssues(projectKey) {
        return this.request('GET', `/rest/api/3/search?jql=project="${projectKey}"&maxResults=100`);
    }

    async updateIssueStatus(issueKey, transitionId) {
        return this.request('POST', `/rest/api/3/issue/${issueKey}/transitions`, {
            transition: { id: transitionId }
        });
    }

    async getTransitions(issueKey) {
        return this.request('GET', `/rest/api/3/issue/${issueKey}/transitions`);
    }
}

export const jiraClient = new JiraClient();
