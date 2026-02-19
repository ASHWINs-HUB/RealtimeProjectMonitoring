import axios from 'axios';
import config from '../config/index.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

class GitHubService {
  constructor() {
    this.baseURL = config.github.apiUrl;
    this.token = config.github.token;
    this.headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json'
    };
  }

  async request(method, endpoint, data = null) {
    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: this.headers,
        data
      });
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      logger.error(`GitHub API error [${method} ${endpoint}]: ${errMsg}`);
      throw new Error(`GitHub API error: ${errMsg}`);
    }
  }

  // ==================== REPOSITORIES ====================

  async createRepo({ name, description, private: isPrivate = false }) {
    const org = config.github.org;
    // Use org endpoint if an org is specified and isn't 'personal'
    const endpoint = (org && org !== 'personal') ? `/orgs/${org}/repos` : '/user/repos';

    try {
      return await this.request('POST', endpoint, {
        name,
        description,
        private: isPrivate,
        auto_init: true,
        gitignore_template: 'Node',
        license_template: 'mit'
      });
    } catch (error) {
      if (error.message.includes('Resource not accessible by personal access token')) {
        logger.error(
          'GitHub token lacks repository creation permissions. ' +
          'For fine-grained PATs: enable Administration (Read & Write) permission. ' +
          'For classic tokens: enable the "repo" scope. ' +
          'Regenerate at https://github.com/settings/tokens'
        );
        throw new Error(
          'GitHub token does not have permission to create repositories. ' +
          'Please update GITHUB_TOKEN in .env with a token that has the "repo" or "Administration" scope.'
        );
      }
      throw error;
    }
  }

  async getRepository(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}`);
  }

  async listUserRepos(perPage = 30) {
    return this.request('GET', `/user/repos?per_page=${perPage}&sort=updated`);
  }

  // ==================== COMMITS ====================

  async getCommits(owner, repo, params = {}) {
    const { per_page = 30, since, sha } = params;
    let endpoint = `/repos/${owner}/${repo}/commits?per_page=${per_page}`;
    if (since) endpoint += `&since=${since}`;
    if (sha) endpoint += `&sha=${sha}`;
    return this.request('GET', endpoint);
  }

  async getCommitDetail(owner, repo, sha) {
    return this.request('GET', `/repos/${owner}/${repo}/commits/${sha}`);
  }

  // ==================== ACTIVITY & STATS ====================

  async getContributors(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}/contributors`);
  }

  async getLanguages(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}/languages`);
  }

  async getCommitActivity(owner, repo) {
    // Returns weekly commit count for last 52 weeks
    return this.request('GET', `/repos/${owner}/${repo}/stats/commit_activity`);
  }

  // ==================== PULL REQUESTS ====================

  async getPullRequests(owner, repo, state = 'all') {
    return this.request('GET', `/repos/${owner}/${repo}/pulls?state=${state}`);
  }

  async getPullRequestDetail(owner, repo, pullNumber) {
    return this.request('GET', `/repos/${owner}/${repo}/pulls/${pullNumber}`);
  }

  async getCodeFrequency(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}/stats/code_frequency`);
  }

  async getParticipation(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}/stats/participation`);
  }

  // ==================== PULL REQUESTS ====================

  async getPullRequests(owner, repo, state = 'all') {
    return this.request('GET', `/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`);
  }

  // ==================== WEBHOOKS ====================

  async createWebhook(owner, repo, webhookUrl) {
    return this.request('POST', `/repos/${owner}/${repo}/hooks`, {
      name: 'web',
      active: true,
      events: ['push', 'pull_request', 'issues'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        insecure_ssl: '0'
      }
    });
  }

  // ==================== BRANCHES ====================

  async getReference(owner, repo, ref) {
    // ref example: 'heads/main'
    return this.request('GET', `/repos/${owner}/${repo}/git/ref/${ref}`);
  }

  async createBranch(owner, repo, branchName, sha) {
    return this.request('POST', `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha
    });
  }

  // ==================== SYNC COMMITS TO DB ====================

  async syncCommitsToDb(projectId) {
    try {
      // Get GitHub mapping for project
      const mapping = await pool.query(
        'SELECT * FROM github_mapping WHERE project_id = $1 LIMIT 1',
        [projectId]
      );

      if (mapping.rows.length === 0) {
        logger.info(`No GitHub mapping found for project ${projectId}`);
        return { synced: 0 };
      }

      const { id: mappingId, repo_full_name } = mapping.rows[0];
      const [owner, repo] = repo_full_name.split('/');

      // Get latest synced commit date
      const lastCommit = await pool.query(
        'SELECT committed_at FROM github_commits WHERE github_mapping_id = $1 ORDER BY committed_at DESC LIMIT 1',
        [mappingId]
      );

      const since = lastCommit.rows.length > 0
        ? lastCommit.rows[0].committed_at.toISOString()
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // Last 90 days

      const commits = await this.getCommits(owner, repo, { per_page: 100, since });

      let synced = 0;
      for (const commit of commits) {
        try {
          // Get detailed commit info for additions/deletions
          let additions = 0, deletions = 0, filesChanged = 0;
          try {
            const detail = await this.getCommitDetail(owner, repo, commit.sha);
            additions = detail.stats?.additions || 0;
            deletions = detail.stats?.deletions || 0;
            filesChanged = detail.files?.length || 0;
          } catch (e) {
            // Non-blocking, continue without details
          }

          await pool.query(
            `INSERT INTO github_commits (github_mapping_id, commit_sha, author_name, author_email, message, additions, deletions, files_changed, committed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT DO NOTHING`,
            [
              mappingId,
              commit.sha,
              commit.commit?.author?.name,
              commit.commit?.author?.email,
              commit.commit?.message,
              additions,
              deletions,
              filesChanged,
              commit.commit?.author?.date
            ]
          );
          synced++;
        } catch (e) {
          // Skip duplicate commits
        }
      }

      // Update last synced timestamp
      await pool.query(
        'UPDATE github_mapping SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1',
        [mappingId]
      );

      logger.info(`Synced ${synced} commits for project ${projectId}`);
      return { synced };
    } catch (error) {
      logger.error(`Commit sync failed for project ${projectId}:`, error.message);
      throw error;
    }
  }

  // ==================== ANALYTICS ====================

  async getRepositoryAnalytics(owner, repo) {
    try {
      const [commits, contributors, languages, pullRequests] = await Promise.all([
        this.getCommits(owner, repo, { per_page: 100 }).catch(() => []),
        this.getContributors(owner, repo).catch(() => []),
        this.getLanguages(owner, repo).catch(() => ({})),
        this.getPullRequests(owner, repo).catch(() => [])
      ]);

      // Compute daily commit frequency for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentCommits = commits.filter(c =>
        new Date(c.commit?.author?.date) > thirtyDaysAgo
      );

      const commitsByDay = {};
      recentCommits.forEach(c => {
        const day = c.commit?.author?.date?.split('T')[0];
        if (day) commitsByDay[day] = (commitsByDay[day] || 0) + 1;
      });

      // Unique contributors in last 30 days
      const recentContributors = new Set(
        recentCommits.map(c => c.commit?.author?.email).filter(Boolean)
      );

      return {
        totalCommits: commits.length,
        recentCommits: recentCommits.length,
        commitsByDay,
        contributors: contributors.map(c => ({
          login: c.login,
          contributions: c.contributions,
          avatar_url: c.avatar_url
        })),
        recentContributors: recentContributors.size,
        languages,
        totalLanguageBytes: Object.values(languages).reduce((a, b) => a + b, 0),
        pullRequests: {
          total: pullRequests.length,
          open: pullRequests.filter(pr => pr.state === 'open').length,
          merged: pullRequests.filter(pr => pr.merged_at).length,
          closed: pullRequests.filter(pr => pr.state === 'closed' && !pr.merged_at).length
        },
        lastCommit: commits[0] ? {
          sha: commits[0].sha,
          message: commits[0].commit?.message,
          author: commits[0].commit?.author?.name,
          date: commits[0].commit?.author?.date
        } : null
      };
    } catch (error) {
      logger.error(`GitHub analytics failed for ${owner}/${repo}:`, error.message);
      return null;
    }
  }
}

export const githubService = new GitHubService();
