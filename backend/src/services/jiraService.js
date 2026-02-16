import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class JiraService {
    constructor() {
        this.baseUrl = config.jira.baseUrl;
        this.auth = {
            username: config.jira.email,
            password: config.jira.apiToken
        };
        this.headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };
    }

    async request(method, endpoint, data = null) {
        try {
            const response = await axios({
                method,
                url: `${this.baseUrl}${endpoint}`,
                auth: this.auth,
                headers: this.headers,
                data
            });
            return response.data;
        } catch (error) {
            const data = error.response?.data;
            const errorMessages = data?.errorMessages || [];
            const errors = data?.errors ? Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`) : [];

            const errMsg = [...errorMessages, ...errors].join('; ')
                || data?.message
                || error.message;

            logger.error(`Jira API error [${method} ${endpoint}]: ${errMsg}`);
            throw new Error(`Jira API error: ${errMsg}`);
        }
    }

    // ==================== PROJECTS ====================

    async createProject(projectKey, projectName) {
        // Get the current user's account ID for lead assignment
        let leadAccountId;
        try {
            const me = await this.request('GET', '/rest/api/3/myself');
            leadAccountId = me.accountId;
        } catch (e) {
            logger.warn('Could not get Jira account ID, skipping lead assignment');
        }

        const payload = {
            key: projectKey,
            name: projectName,
            projectTypeKey: 'software',
            projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-scrum-template',
            ...(leadAccountId && { leadAccountId })
        };

        return this.request('POST', '/rest/api/3/project', payload);
    }

    async getProjects() {
        return this.request('GET', '/rest/api/3/project');
    }

    async getProject(projectKeyOrId) {
        return this.request('GET', `/rest/api/3/project/${projectKeyOrId}`);
    }

    // ==================== ISSUES ====================

    async createIssue(projectKey, summary, description, priority = 'medium') {
        const priorityMap = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Highest'
        };

        const payload = {
            fields: {
                project: { key: projectKey },
                summary,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: description || 'No description provided' }]
                    }]
                },
                issuetype: { name: 'Task' },
                priority: { name: priorityMap[priority] || 'Medium' }
            }
        };

        return this.request('POST', '/rest/api/3/issue', payload);
    }

    async getIssue(issueKey) {
        return this.request('GET', `/rest/api/3/issue/${issueKey}`);
    }

    async getProjectIssues(projectKey, maxResults = 100) {
        const jql = `project = ${projectKey} ORDER BY created DESC`;
        return this.request('GET', `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`);
    }

    async updateIssueStatus(issueKey, status) {
        // Get available transitions
        const transitions = await this.request('GET', `/rest/api/3/issue/${issueKey}/transitions`);

        const statusMap = {
            'todo': ['To Do', 'Backlog', 'Open'],
            'in_progress': ['In Progress', 'In Development'],
            'in_review': ['In Review', 'Review'],
            'done': ['Done', 'Closed', 'Resolved'],
            'blocked': ['Blocked']
        };

        const targetNames = statusMap[status] || [status];
        const transition = transitions.transitions?.find(t =>
            targetNames.some(name => t.name.toLowerCase() === name.toLowerCase())
        );

        if (transition) {
            await this.request('POST', `/rest/api/3/issue/${issueKey}/transitions`, {
                transition: { id: transition.id }
            });
            return { transitioned: true, to: transition.name };
        }

        return { transitioned: false, available: transitions.transitions?.map(t => t.name) };
    }

    // ==================== SPRINTS & BOARDS ====================

    async getBoards(projectKey) {
        return this.request('GET', `/rest/agile/1.0/board?projectKeyOrId=${projectKey}`);
    }

    async getSprints(boardId) {
        return this.request('GET', `/rest/agile/1.0/board/${boardId}/sprint`);
    }

    async getSprintIssues(sprintId) {
        return this.request('GET', `/rest/agile/1.0/sprint/${sprintId}/issue`);
    }

    async getVelocity(boardId) {
        try {
            const sprints = await this.getSprints(boardId);
            const closedSprints = sprints.values?.filter(s => s.state === 'closed') || [];

            const velocityData = [];
            for (const sprint of closedSprints.slice(-6)) {
                const issues = await this.getSprintIssues(sprint.id);
                const completedPoints = issues.issues?.reduce((sum, issue) => {
                    if (issue.fields?.status?.statusCategory?.name === 'Done') {
                        return sum + (issue.fields?.story_points || issue.fields?.customfield_10028 || 0);
                    }
                    return sum;
                }, 0) || 0;

                velocityData.push({
                    sprint: sprint.name,
                    sprintId: sprint.id,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    completedPoints,
                    totalIssues: issues.issues?.length || 0,
                    completedIssues: issues.issues?.filter(i =>
                        i.fields?.status?.statusCategory?.name === 'Done'
                    ).length || 0
                });
            }

            return velocityData;
        } catch (error) {
            logger.warn('Velocity fetch failed:', error.message);
            return [];
        }
    }

    // ==================== ANALYTICS DATA ====================

    async getProjectAnalytics(projectKey) {
        try {
            const [issues, boards] = await Promise.all([
                this.getProjectIssues(projectKey),
                this.getBoards(projectKey)
            ]);

            let velocity = [];
            if (boards.values?.length > 0) {
                velocity = await this.getVelocity(boards.values[0].id);
            }

            const issueList = issues.issues || [];
            const analytics = {
                totalIssues: issues.total || 0,
                statusDistribution: {},
                priorityDistribution: {},
                avgResolutionDays: 0,
                issueCompletionRate: 0,
                velocity,
                recentIssues: issueList.slice(0, 10).map(i => ({
                    key: i.key,
                    summary: i.fields?.summary,
                    status: i.fields?.status?.name,
                    priority: i.fields?.priority?.name,
                    created: i.fields?.created,
                    resolved: i.fields?.resolutiondate
                }))
            };

            // Calculate distributions
            let resolvedCount = 0;
            let totalResolutionMs = 0;

            issueList.forEach(issue => {
                const status = issue.fields?.status?.name || 'Unknown';
                const priority = issue.fields?.priority?.name || 'Unknown';

                analytics.statusDistribution[status] = (analytics.statusDistribution[status] || 0) + 1;
                analytics.priorityDistribution[priority] = (analytics.priorityDistribution[priority] || 0) + 1;

                if (issue.fields?.resolutiondate) {
                    resolvedCount++;
                    const created = new Date(issue.fields.created);
                    const resolved = new Date(issue.fields.resolutiondate);
                    totalResolutionMs += resolved - created;
                }
            });

            analytics.issueCompletionRate = issueList.length > 0
                ? Math.round((resolvedCount / issueList.length) * 100)
                : 0;

            analytics.avgResolutionDays = resolvedCount > 0
                ? Math.round(totalResolutionMs / resolvedCount / (1000 * 60 * 60 * 24))
                : 0;

            return analytics;
        } catch (error) {
            logger.error('Jira analytics fetch failed:', error.message);
            return null;
        }
    }
}

export const jiraService = new JiraService();
