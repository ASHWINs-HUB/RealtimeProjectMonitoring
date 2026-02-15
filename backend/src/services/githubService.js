import axios from 'axios';
import logger from '../utils/logger.js';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG;

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN environment variable is required');
}

if (!GITHUB_ORG) {
  throw new Error('GITHUB_ORG environment variable is required');
}

const githubApi = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  }
});

class GitHubService {
  async createRepository({ name, description, private: isPrivate = false }) {
    try {
      logger.info(`Creating repository: ${GITHUB_ORG}/${name}`);
      
      const response = await githubApi.post('/orgs/{org}/repos'.replace('{org}', GITHUB_ORG), {
        name,
        description,
        private: isPrivate,
        auto_init: false,
        gitignore_template: 'Node',
        license_template: 'mit'
      });

      logger.info(`Repository created successfully: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating repository:', error.response?.data || error.message);
      throw new Error(`Failed to create repository: ${error.response?.data?.message || error.message}`);
    }
  }

  async createBranch(repoFullName, sourceBranch, newBranch) {
    try {
      logger.info(`Creating branch: ${newBranch} from ${sourceBranch}`);

      // Get the SHA of the source branch
      const sourceResponse = await githubApi.get(`/repos/${repoFullName}/git/refs/heads/${sourceBranch}`);
      const sourceSha = sourceResponse.data.object.sha;

      // Create the new branch
      const response = await githubApi.post(`/repos/${repoFullName}/git/refs`, {
        ref: `refs/heads/${newBranch}`,
        sha: sourceSha
      });

      logger.info(`Branch created: ${newBranch}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating branch:', error.response?.data || error.message);
      throw new Error(`Failed to create branch ${newBranch}: ${error.response?.data?.message || error.message}`);
    }
  }

  async createFile(repoFullName, branch, path, content, message) {
    try {
      logger.info(`Creating file: ${path} on branch ${branch}`);

      const base64Content = Buffer.from(content).toString('base64');

      const response = await githubApi.put(`/repos/${repoFullName}/contents/${path}`, {
        message,
        content: base64Content,
        branch
      });

      logger.info(`File created: ${path}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating file:', error.response?.data || error.message);
      throw new Error(`Failed to create file ${path}: ${error.response?.data?.message || error.message}`);
    }
  }

  async protectBranch(repoFullName, branch, options = {}) {
    try {
      logger.info(`Applying protection to branch: ${branch}`);

      const protectionRules = {
        required_status_checks: null,
        enforce_admins: true,
        required_pull_request_reviews: {
          required_approving_review_count: options.requiredApprovals || 1,
          dismiss_stale_reviews: true,
          require_code_owner_reviews: false
        },
        restrictions: null,
        allow_force_pushes: false,
        allow_deletions: false
      };

      const response = await githubApi.put(
        `/repos/${repoFullName}/branches/${branch}/protection`,
        protectionRules
      );

      logger.info(`Branch protection applied: ${branch}`);
      return response.data;
    } catch (error) {
      logger.error('Error protecting branch:', error.response?.data || error.message);
      throw new Error(`Failed to protect branch ${branch}: ${error.response?.data?.message || error.message}`);
    }
  }

  async addCollaborator(repoFullName, username, permission = 'push') {
    try {
      logger.info(`Adding collaborator: ${username} to ${repoFullName}`);

      const response = await githubApi.put(`/repos/${repoFullName}/collaborators/${username}`, {
        permission
      });

      logger.info(`Collaborator added: ${username}`);
      return response.data;
    } catch (error) {
      logger.error('Error adding collaborator:', error.response?.data || error.message);
      throw new Error(`Failed to add collaborator ${username}: ${error.response?.data?.message || error.message}`);
    }
  }
}

export default new GitHubService();
