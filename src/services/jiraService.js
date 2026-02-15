// src/services/jiraService.js
const axios = require('axios');

const JIRA_API = process.env.JIRA_BASE_URL;

const jiraService = {
  async createProject(projectKey, projectName) {
    const res = await axios.post(
      `${JIRA_API}/rest/api/3/project`,
      {
        key: projectKey,
        name: projectName,
        projectTypeKey: 'software',
        projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-scrum-template',
      },
      {
        auth: {
          username: process.env.JIRA_EMAIL,
          password: process.env.JIRA_API_TOKEN,
        },
        headers: {
          Accept: 'application/json',
        },
      }
    );
    return res.data;
  },
  // Add more Jira API methods as needed
};

module.exports = jiraService;
