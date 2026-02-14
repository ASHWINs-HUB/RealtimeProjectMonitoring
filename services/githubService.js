const axios = require('axios');
const { handleExternalAPIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }

  // Get OAuth URL for GitHub
  getAuthUrl(state) {
    const scopes = ['repo', 'admin:org', 'read:org', 'user:email'];
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&scope=${scopes.join(' ')}&state=${state}`;
  }

  // Exchange code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Get authenticated user
  async getAuthenticatedUser(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/user`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Create repository
  async createRepository(accessToken, repoData) {
    try {
      const { name, description, private: isPrivate, auto_init } = repoData;
      
      const response = await axios.post(`${this.baseURL}/user/repos`, {
        name,
        description,
        private: isPrivate || false,
        auto_init: auto_init || true,
        gitignore_template: 'Node',
        license_template: 'mit'
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Create branch
  async createBranch(accessToken, owner, repo, branchName, baseBranch = 'main') {
    try {
      // Get base branch reference
      const baseRef = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // Create new branch
      const response = await axios.post(`${this.baseURL}/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha: baseRef.data.object.sha
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Create pull request
  async createPullRequest(accessToken, owner, repo, prData) {
    try {
      const { title, description, head, base, draft } = prData;
      
      const response = await axios.post(`${this.baseURL}/repos/${owner}/${repo}/pulls`, {
        title,
        body: description,
        head,
        base,
        draft: draft || false
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Get repository commits
  async getCommits(accessToken, owner, repo, since = null, until = null) {
    try {
      let url = `${this.baseURL}/repos/${owner}/${repo}/commits`;
      const params = {};
      
      if (since) params.since = since;
      if (until) params.until = until;
      if (Object.keys(params).length > 0) {
        url += '?' + new URLSearchParams(params).toString();
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Get pull requests
  async getPullRequests(accessToken, owner, repo, state = 'all') {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls?state=${state}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Get pull request details
  async getPullRequest(accessToken, owner, repo, pullNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls/${pullNumber}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Merge pull request
  async mergePullRequest(accessToken, owner, repo, pullNumber, commitTitle, mergeMethod = 'merge') {
    try {
      const response = await axios.put(`${this.baseURL}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
        commit_title: commitTitle,
        merge_method: mergeMethod
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Get repository contributors
  async getContributors(accessToken, owner, repo) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contributors`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Get repository statistics
  async getRepositoryStats(accessToken, owner, repo) {
    try {
      // Get basic repo info
      const repoInfo = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // Get languages
      const languages = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/languages`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // Get contributors
      const contributors = await this.getContributors(accessToken, owner, repo);

      return {
        repository: repoInfo.data,
        languages: languages.data,
        contributors: contributors
      };
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Calculate PR merge time statistics
  async calculatePRMergeTime(accessToken, owner, repo, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const pullRequests = await this.getPullRequests(accessToken, owner, repo, 'closed');
      
      const mergeTimes = pullRequests
        .filter(pr => pr.merged_at && new Date(pr.created_at) >= since)
        .map(pr => {
          const created = new Date(pr.created_at);
          const merged = new Date(pr.merged_at);
          return (merged - created) / (1000 * 60 * 60); // Convert to hours
        });

      if (mergeTimes.length === 0) {
        return {
          average_merge_time_hours: 0,
          median_merge_time_hours: 0,
          total_prs_merged: 0,
          period_days: days
        };
      }

      const average = mergeTimes.reduce((sum, time) => sum + time, 0) / mergeTimes.length;
      const sorted = mergeTimes.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      return {
        average_merge_time_hours: Math.round(average * 100) / 100,
        median_merge_time_hours: Math.round(median * 100) / 100,
        total_prs_merged: mergeTimes.length,
        period_days: days
      };
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }

  // Calculate commit frequency
  async calculateCommitFrequency(accessToken, owner, repo, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const commits = await this.getCommits(accessToken, owner, repo, since.toISOString());
      
      // Group commits by date
      const commitsByDate = {};
      commits.forEach(commit => {
        const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
        commitsByDate[date] = (commitsByDate[date] || 0) + 1;
      });

      const totalCommits = commits.length;
      const averageCommitsPerDay = totalCommits / days;
      
      return {
        total_commits: totalCommits,
        average_commits_per_day: Math.round(averageCommitsPerDay * 100) / 100,
        commits_by_date: commitsByDate,
        period_days: days
      };
    } catch (error) {
      throw handleExternalAPIError(error, 'GitHub');
    }
  }
}

module.exports = new GitHubService();
