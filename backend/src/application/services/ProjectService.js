import { projectRepository } from '../../infrastructure/database/repositories/ProjectRepository.js';
import { jiraClient } from '../../infrastructure/external/JiraClient.js';
import { githubClient } from '../../infrastructure/external/GitHubClient.js';
import { taskRepository } from '../../infrastructure/database/repositories/TaskRepository.js';
import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

export class ProjectService {
    async initializeProject(data, creatorId) {
        const { name, projectKey, createGithubRepo, managerIds } = data;
        const key = projectKey || name.replace(/[^A-Za-z]/g, '').substring(0, 6).toUpperCase();

        const project = await projectRepository.createProject({
            ...data,
            projectKey: key,
            createdBy: creatorId
        });

        // External Integrations
        const integrations = { jira: null, github: null, warnings: [] };

        // 1. Jira Project Creation
        try {
            const jiraData = await jiraClient.request('POST', '/rest/api/3/project', {
                key,
                name,
                leadAccountId: "...", // This would usually be mapped from the creator
                projectTypeKey: "software",
                projectTemplateKey: "com.pyxis.greenhopper.jira:gh-kanban-optimized"
            });

            await pool.query(
                `INSERT INTO jira_mapping (project_id, jira_project_id, jira_project_key)
                 VALUES ($1, $2, $3)`,
                [project.id, jiraData.id?.toString(), jiraData.key]
            );
            integrations.jira = jiraData.key;
        } catch (err) {
            integrations.warnings.push(`Jira: ${err.message}`);
        }

        // 2. GitHub Repo Creation
        if (createGithubRepo) {
            try {
                const githubData = await githubClient.request('POST', '/user/repos', {
                    name: name.toLowerCase().replace(/\s+/g, '-'),
                    private: data.githubRepoPrivate || false
                });

                await pool.query(
                    `INSERT INTO github_mapping (project_id, repo_name, repo_url, repo_full_name, is_private)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [project.id, githubData.name, githubData.html_url, githubData.full_name, githubData.private]
                );
                integrations.github = githubData.full_name;
            } catch (err) {
                integrations.warnings.push(`GitHub: ${err.message}`);
            }
        }

        // 3. Manager Assignments & Notifications
        if (managerIds?.length > 0) {
            await projectRepository.assignManagers(project.id, managerIds);
            for (const mId of managerIds) {
                await taskRepository.createNotification({
                    userId: mId,
                    title: 'New Project Assignment',
                    message: `You have been assigned to review project "${name}"`,
                    link: `/projects/${project.id}`
                });
            }
        }

        return { project, integrations };
    }

    async getProjectDetails(projectId) {
        const project = await projectRepository.getProjectById(projectId);
        if (!project) return null;

        const integrations = await projectRepository.getProjectIntegrations(projectId);

        return {
            ...project,
            github: integrations.github,
            jira: integrations.jira
        };
    }
}

export const projectService = new ProjectService();
