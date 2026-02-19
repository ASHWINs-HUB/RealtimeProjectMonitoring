import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

export class GitHubClient {
    constructor() {
        this.baseURL = config.github.apiUrl;
        this.token = config.github.token;

        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 10000, // 10s timeout
            headers: {
                Authorization: `Bearer ${this.token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        // Configure retries with exponential backoff
        axiosRetry(this.axiosInstance, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
            },
            onRetry: (retryCount, error) => {
                logger.warn(`GitHub API Retry #${retryCount}: ${error.message}`);
            }
        });
    }

    async request(method, endpoint, data = null) {
        try {
            const response = await this.axiosInstance({
                method,
                url: endpoint,
                data
            });
            return response.data;
        } catch (error) {
            // Logic for circuit breaker would go here in a larger system
            const errMsg = error.response?.data?.message || error.message;
            logger.error(`GitHub API error [${method} ${endpoint}]: ${errMsg}`);
            throw new Error(`GitHub API error: ${errMsg}`);
        }
    }

    async getRepository(owner, repo) {
        return this.request('GET', `/repos/${owner}/${repo}`);
    }

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

    async getContributors(owner, repo) {
        return this.request('GET', `/repos/${owner}/${repo}/contributors`);
    }

    async getLanguages(owner, repo) {
        return this.request('GET', `/repos/${owner}/${repo}/languages`);
    }

    async getPullRequests(owner, repo, state = 'all') {
        return this.request('GET', `/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`);
    }

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
}

export const githubClient = new GitHubClient();
