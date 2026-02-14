const axios = require('axios');
const { handleExternalAPIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class JiraService {
  constructor() {
    this.baseURL = process.env.JIRA_BASE_URL;
    this.clientId = process.env.JIRA_CLIENT_ID;
    this.clientSecret = process.env.JIRA_CLIENT_SECRET;
  }

  // Get OAuth URL for Jira
  getAuthUrl(state) {
    const scopes = ['read:jira-work', 'read:jira-user', 'offline_access'];
    return `${this.baseURL}/plugins/servlet/oauth/authorize?client_id=${this.clientId}&scope=${scopes.join(' ')}&redirect_uri=${process.env.FRONTEND_URL}/auth/jira/callback&state=${state}`;
  }

  // Exchange code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.baseURL}/plugins/servlet/oauth/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Get authenticated user
  async getAuthenticatedUser(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Get project by key
  async getProject(accessToken, projectKey) {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/project/${projectKey}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Create project
  async createProject(accessToken, projectData) {
    try {
      const { key, name, description, projectTypeKey = 'software', leadAccountId } = projectData;
      
      const response = await axios.post(`${this.baseURL}/rest/api/3/project`, {
        key,
        name,
        description,
        projectTypeKey,
        leadAccountId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Get issues for project
  async getIssues(accessToken, projectKey, status = null) {
    try {
      let jql = `project = ${projectKey}`;
      if (status) {
        jql += ` AND status = "${status}"`;
      }

      const response = await axios.post(`${this.baseURL}/rest/api/3/search`, {
        jql,
        fields: [
          'id',
          'key',
          'summary',
          'description',
          'status',
          'priority',
          'assignee',
          'reporter',
          'created',
          'updated',
          'duedate',
          'resolutiondate',
          'customfield_10004', // Story points (common custom field)
          'timetracking'
        ],
        maxResults: 100
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Create issue
  async createIssue(accessToken, issueData) {
    try {
      const { projectKey, summary, description, issueType = 'Story', priority = 'Medium', assigneeId, storyPoints } = issueData;
      
      const payload = {
        fields: {
          project: { key: projectKey },
          summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description || ''
                  }
                ]
              }
            ]
          },
          issuetype: { name: issueType },
          priority: { name: priority }
        }
      };

      if (assigneeId) {
        payload.fields.assignee = { id: assigneeId };
      }

      if (storyPoints) {
        payload.fields.customfield_10004 = storyPoints; // Story points field
      }

      const response = await axios.post(`${this.baseURL}/rest/api/3/issue`, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Update issue
  async updateIssue(accessToken, issueKey, updateData) {
    try {
      const { summary, description, status, assigneeId, storyPoints } = updateData;
      
      const fields = {};
      
      if (summary) fields.summary = summary;
      if (description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: description
                }
              ]
            }
          ]
        };
      }
      if (status) fields.status = { name: status };
      if (assigneeId) fields.assignee = { id: assigneeId };
      if (storyPoints !== undefined) fields.customfield_10004 = storyPoints;

      const response = await axios.put(`${this.baseURL}/rest/api/3/issue/${issueKey}`, {
        fields
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Get sprints for project
  async getSprints(accessToken, projectKey) {
    try {
      // First get board ID for the project
      const boardsResponse = await axios.get(`${this.baseURL}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!boardsResponse.data.values || boardsResponse.data.values.length === 0) {
        return { sprints: [], boards: [] };
      }

      const boardId = boardsResponse.data.values[0].id;

      // Get sprints for the board
      const sprintsResponse = await axios.get(`${this.baseURL}/rest/agile/1.0/board/${boardId}/sprint?state=active,closed`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return {
        boards: boardsResponse.data.values,
        sprints: sprintsResponse.data.values
      };
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Get sprint issues
  async getSprintIssues(accessToken, sprintId) {
    try {
      const response = await axios.get(`${this.baseURL}/rest/agile/1.0/sprint/${sprintId}/issue`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Calculate sprint velocity
  async calculateSprintVelocity(accessToken, projectKey, sprintsCount = 5) {
    try {
      const { sprints } = await this.getSprints(accessToken, projectKey);
      
      if (sprints.length === 0) {
        return {
          average_velocity: 0,
          velocities: [],
          total_sprints: 0
        };
      }

      const velocities = [];
      const recentSprints = sprints.slice(-sprintsCount);

      for (const sprint of recentSprints) {
        try {
          const sprintIssues = await this.getSprintIssues(accessToken, sprint.id);
          const completedIssues = sprintIssues.issues.filter(issue => 
            issue.fields.status.name === 'Done' || 
            issue.fields.status.name === 'Complete'
          );

          const totalStoryPoints = completedIssues.reduce((sum, issue) => {
            const points = issue.fields.customfield_10004 || 0;
            return sum + points;
          }, 0);

          velocities.push({
            sprint_id: sprint.id,
            sprint_name: sprint.name,
            story_points: totalStoryPoints,
            completed_issues: completedIssues.length,
            start_date: sprint.startDate,
            end_date: sprint.endDate,
            complete_date: sprint.completeDate
          });
        } catch (error) {
          logger.warn(`Failed to get issues for sprint ${sprint.id}:`, error.message);
          velocities.push({
            sprint_id: sprint.id,
            sprint_name: sprint.name,
            story_points: 0,
            completed_issues: 0,
            start_date: sprint.startDate,
            end_date: sprint.endDate,
            complete_date: sprint.completeDate
          });
        }
      }

      const averageVelocity = velocities.reduce((sum, v) => sum + v.story_points, 0) / velocities.length;

      return {
        average_velocity: Math.round(averageVelocity * 100) / 100,
        velocities,
        total_sprints: velocities.length
      };
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Calculate issue metrics
  async calculateIssueMetrics(accessToken, projectKey, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const allIssues = await this.getIssues(accessToken, projectKey);
      const issues = allIssues.issues.filter(issue => 
        new Date(issue.fields.created) >= since
      );

      const metrics = {
        total_issues: issues.length,
        by_status: {},
        by_priority: {},
        reopened_issues: 0,
        avg_resolution_time_hours: 0,
        overdue_issues: 0,
        total_story_points: 0,
        completed_story_points: 0
      };

      const resolutionTimes = [];

      issues.forEach(issue => {
        // Status breakdown
        const status = issue.fields.status.name;
        metrics.by_status[status] = (metrics.by_status[status] || 0) + 1;

        // Priority breakdown
        const priority = issue.fields.priority.name;
        metrics.by_priority[priority] = (metrics.by_priority[priority] || 0) + 1;

        // Story points
        const storyPoints = issue.fields.customfield_10004 || 0;
        metrics.total_story_points += storyPoints;

        // Completed story points
        if (status === 'Done' || status === 'Complete') {
          metrics.completed_story_points += storyPoints;
        }

        // Resolution time
        if (issue.fields.resolutiondate) {
          const created = new Date(issue.fields.created);
          const resolved = new Date(issue.fields.resolutiondate);
          const resolutionTime = (resolved - created) / (1000 * 60 * 60); // Convert to hours
          resolutionTimes.push(resolutionTime);
        }

        // Overdue issues
        if (issue.fields.duedate && !issue.fields.resolutiondate) {
          const dueDate = new Date(issue.fields.duedate);
          if (dueDate < new Date()) {
            metrics.overdue_issues += 1;
          }
        }

        // Reopened issues (simplified - would need changelog for accurate count)
        if (issue.fields.status.name === 'In Progress' && issue.fields.resolutiondate) {
          metrics.reopened_issues += 1;
        }
      });

      // Average resolution time
      if (resolutionTimes.length > 0) {
        metrics.avg_resolution_time_hours = Math.round(
          (resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length) * 100
        ) / 100;
      }

      return {
        ...metrics,
        period_days: days,
        analysis_date: new Date().toISOString()
      };
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }

  // Get issue changelog (for tracking status changes)
  async getIssueChangelog(accessToken, issueKey) {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/issue/${issueKey}/changelog`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'Jira');
    }
  }
}

module.exports = new JiraService();
