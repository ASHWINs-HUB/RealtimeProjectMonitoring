// src/services/githubService.js
const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

const githubService = {
  async createRepo(repoName) {
    const res = await axios.post(
      `${GITHUB_API}/orgs/${process.env.GITHUB_ORG}/repos`,
      { name: repoName },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    return res.data;
  },
  // Add more GitHub API methods as needed
};

module.exports = githubService;
