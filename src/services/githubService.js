// Enhanced GitHub Service with comprehensive integration
const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.baseURL = GITHUB_API;
  }

  // Create repository with detailed configuration
  async createRepo(repoData) {
    const { name, description, private: isPrivate, autoInit = true } = repoData;
    
    try {
      const res = await axios.post(
        `${this.baseURL}/user/repos`,
        {
          name,
          description,
          private: isPrivate || false,
          auto_init: autoInit,
          gitignore_template: 'Node',
          license_template: 'mit'
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      return res.data;
    } catch (error) {
      throw new Error(`Failed to create repository: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get repository details
  async getRepository(owner, repo) {
    try {
      const res = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to fetch repository: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get repository commits for analytics
  async getCommits(owner, repo, limit = 10) {
    try {
      const res = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/commits`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          per_page: limit,
          sort: 'created',
          direction: 'desc'
        }
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to fetch commits: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get repository contributors
  async getContributors(owner, repo) {
    try {
      const res = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contributors`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to fetch contributors: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get repository statistics for analytics
  async getRepositoryStats(owner, repo) {
    try {
      const [languagesRes, contributorsRes, commitsRes] = await Promise.all([
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/languages`, {
          headers: { Authorization: `token ${this.token}` }
        }),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/contributors`, {
          headers: { Authorization: `token ${this.token}` }
        }),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/commits`, {
          headers: { Authorization: `token ${this.token}` },
          params: { per_page: 1 }
        })
      ]);

      return {
        languages: languagesRes.data,
        contributors: contributorsRes.data.length,
        lastCommit: commitsRes.data[0]?.commit?.author?.date
      };
    } catch (error) {
      throw new Error(`Failed to fetch repository stats: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create webhook for real-time updates
  async createWebhook(owner, repo, webhookUrl) {
    try {
      const res = await axios.post(`${this.baseURL}/repos/${owner}/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push', 'pull_request', 'issues', 'release'],
        config: {
          url: webhookUrl,
          content_type: 'json'
        }
      }, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get repository activity for analytics
  async getRepositoryActivity(owner, repo, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const [commits, issues, pullRequests] = await Promise.all([
        this.getCommits(owner, repo, 100),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/issues`, {
          headers: { Authorization: `token ${this.token}` },
          params: { state: 'all', per_page: 50, since: since.toISOString() }
        }),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls`, {
          headers: { Authorization: `token ${this.token}` },
          params: { state: 'all', per_page: 50, since: since.toISOString() }
        })
      ]);

      const recentCommits = commits.filter(commit => 
        new Date(commit.commit.author.date) > since
      ).length;

      const recentIssues = issues.data.filter(issue => 
        new Date(issue.created_at) > since
      ).length;

      const recentPRs = pullRequests.data.filter(pr => 
        new Date(pr.created_at) > since
      ).length;

      return {
        commits: recentCommits,
        issues: recentIssues,
        pullRequests: recentPRs,
        activityScore: recentCommits + (recentIssues * 2) + (recentPRs * 3)
      };
    } catch (error) {
      throw new Error(`Failed to fetch repository activity: ${error.response?.data?.message || error.message}`);
    }
  }

  // Legacy method for backward compatibility
  async createRepoLegacy(repoName) {
    return this.createRepo({ name: repoName });
  }
}

const githubService = new GitHubService();
module.exports = githubService;
