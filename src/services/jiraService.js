// src/services/jiraService.js
const axios = require('axios');

const JIRA_API = process.env.JIRA_BASE_URL;

const jiraService = {
  async getProjects() {
    const res = await axios.get(
      `${JIRA_API}/rest/api/3/project`,
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

  async createProject(projectKey, projectName) {
    try {
      console.log('Creating Jira project:', { projectKey, projectName });
      console.log('Jira API URL:', `${JIRA_API}/rest/api/3/project`);
      console.log('Jira credentials configured:', !!process.env.JIRA_EMAIL && !!process.env.JIRA_API_TOKEN);
      
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
      console.log('Jira project created successfully:', res.data);
      return res.data;
    } catch (error) {
      console.error('Jira project creation failed:', error.response?.data || error.message);
      throw error;
    }
  },
  // Add more Jira API methods as needed
};

module.exports = jiraService;
