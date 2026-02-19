import { githubClient } from '../../infrastructure/external/GitHubClient.js';
import logger from '../../utils/logger.js';

export class GitHubGraphQLClient {
    /**
     * Fetches all core project data (info, commits, PRs, contributors) in a SINGLE BATCH
     * This eliminates the N+1 REST explosion.
     */
    async fetchProjectBatch(owner, repo, cursor = null, since = null) {
        const query = `
            query ($owner: String!, $repo: String!, $since: DateTime, $cursor: String) {
                repository(owner: $owner, name: $repo) {
                    name
                    description
                    stargazerCount
                    forkCount
                    primaryLanguage { name }
                    defaultBranchRef { name }
                    
                    # Incremental Commits
                    defaultBranchRef {
                        target {
                            ... on Commit {
                                history(first: 50, since: $since, after: $cursor) {
                                    totalCount
                                    pageInfo {
                                        hasNextPage
                                        endCursor
                                    }
                                    nodes {
                                        oid
                                        message
                                        committedDate
                                        author {
                                            name
                                            email
                                            user { login }
                                        }
                                        additions
                                        deletions
                                        changedFilesCount
                                    }
                                }
                            }
                        }
                    }

                    # Recent Pull Requests
                    pullRequests(last: 20, states: [OPEN, MERGED]) {
                        nodes {
                            number
                            title
                            state
                            mergedAt
                            createdAt
                            author { login }
                        }
                    }

                    # Basic Contributor Data (Static but important)
                    mentionableUsers(first: 10) {
                        nodes {
                            login
                            name
                        }
                    }
                }
                
                # Rate Limit Intelligence
                rateLimit {
                    limit
                    remaining
                    resetAt
                    used
                }
            }
        `;

        const variables = { owner, repo, since, cursor };

        try {
            const result = await githubClient.request('POST', '/graphql', { query, variables });

            // Log quota usage for adaptive throttling metrics
            const rl = result.data?.rateLimit;
            if (rl) {
                logger.info(`[GitHub-Quota] Used: ${rl.used}, Remaining: ${rl.remaining}, ResetAt: ${rl.resetAt}`);
            }

            return result.data;
        } catch (error) {
            logger.error(`GitHub GraphQL Batch failed: ${error.message}`);
            throw error;
        }
    }
}

export const githubGraphQLClient = new GitHubGraphQLClient();
