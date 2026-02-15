import logger from '../utils/logger.js';
// import githubService from '../services/githubService.js';
import { ProjectModel } from '../models/projectModel.js';
import { TaskModel } from '../models/taskModel.js';
import { UserModel } from '../models/userModel.js';

export const createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      projectKey,
      description,
      repoName,
      private: isPrivate,
      teamLeader,
      teamMembers,
      createdBy
    } = req.body;

    logger.info(`Starting project creation: ${projectName} (${projectKey})`);

    // 1. Create project in database first
    const projectData = {
      name: projectName,
      description,
      project_key: projectKey,
      team_leader: teamLeader,
      created_by: createdBy || 1 // Default to user ID 1 if not provided
    };

    const project = await ProjectModel.create(projectData);
    logger.info(`Project created in database: ${project.name} (ID: ${project.id})`);

    // TODO: Re-enable GitHub integration when database is working
    /*
    try {
      // 2. Create GitHub repository
      const repo = await githubService.createRepository({
        name: repoName,
        description: `${projectName} - ${description}`,
        private: isPrivate
      });

      logger.info(`Repository created: ${repo.html_url}`);

      // 3. Update project with repo information
      await ProjectModel.update(project.id, {
        repo_url: repo.html_url,
        repo_name: repo.name
      });

      // 4. Create branches
      const branches = ['dev', 'staging', 'prod'];
      for (const branch of branches) {
        await githubService.createBranch(repo.full_name, 'main', branch);
        logger.info(`Branch created: ${branch}`);
      }

      // 5. Create feature branches for each team member
      const allMembers = [teamLeader, ...teamMembers];
      for (const member of allMembers) {
        await githubService.createBranch(repo.full_name, 'dev', `feature/${member}`);
        logger.info(`Feature branch created: feature/${member}`);
      }

      // 6. Create README.md
      const readmeContent = generateReadme(projectName, description, projectKey, teamLeader, teamMembers);
      await githubService.createFile(repo.full_name, 'main', 'README.md', readmeContent, 'Initial commit: Add README.md');
      logger.info('README.md created');

      // 7. Create BRANCHING_GUIDE.md
      const branchingGuideContent = generateBranchingGuide();
      await githubService.createFile(repo.full_name, 'main', 'BRANCHING_GUIDE.md', branchingGuideContent, 'Add branching guide');
      logger.info('BRANCHING_GUIDE.md created');

      // 8. Apply branch protection rules
      await githubService.protectBranch(repo.full_name, 'main', {
        requirePullRequest: true,
        requiredApprovals: 1
      });
      logger.info('Branch protection applied to main');

      await githubService.protectBranch(repo.full_name, 'dev', {
        requirePullRequest: true,
        requiredApprovals: 1
      });
      logger.info('Branch protection applied to dev');

      // 9. Add collaborators
      for (const member of teamMembers) {
        await githubService.addCollaborator(repo.full_name, member, 'push');
        logger.info(`Collaborator added: ${member}`);
      }

      // 10. Add team members to project in database
      for (const member of teamMembers) {
        // Try to find user by email or create a placeholder
        const user = await UserModel.getByEmail(member) || await UserModel.create({
          name: member,
          email: member,
          role: 'developer',
          password: 'temp123' // Should be updated later
        });
        
        await UserModel.addToProject(user.id, project.id, 'member');
      }

      logger.info(`Project creation completed: ${repo.html_url}`);

      return res.status(201).json({
        success: true,
 projectId: project.id,
        repoUrl: repo.html_url,
        repoName: repo.name,
        message: 'Repository created successfully with all configurations'
      });

    } catch (githubError) {
      // If GitHub operations fail, clean up the database entry
      logger.error('GitHub operations failed, cleaning up database:', githubError);
      await ProjectModel.delete(project.id);
      throw githubError;
    }
    */

    // Add team members to project in database
    for (const member of teamMembers || []) {
      // Try to find user by email or create a placeholder
      const user = await UserModel.getByEmail(member) || await UserModel.create({
        name: member,
        email: member,
        role: 'developer',
        password: 'temp123' // Should be updated later
      });
      
      await UserModel.addToProject(user.id, project.id, 'member');
    }

    return res.status(201).json({
      success: true,
      projectId: project.id,
      message: 'Project created successfully in database'
    });

  } catch (error) {
    logger.error('Error creating project:', error);
    next(error);
  }
};

const generateReadme = (projectName, description, projectKey, teamLeader, teamMembers) => {
  return `# ${projectName}

**Project Key:** ${projectKey}  
**Description:** ${description}

## 👥 Team

**Team Leader:** @${teamLeader}

**Team Members:**
${teamMembers.map(member => `- @${member}`).join('\n')}

## 🌿 Branching Strategy

This project follows a structured branching workflow. See [BRANCHING_GUIDE.md](./BRANCHING_GUIDE.md) for details.

## 🚀 Getting Started

1. Clone the repository
2. Checkout your feature branch: \`git checkout feature/<your-username>\`
3. Make your changes
4. Create a pull request to \`dev\` branch

## 📋 Project Status

Track project progress in JIRA using project key: **${projectKey}**

---

*This repository was automatically created by ProjectPulse AI* 🤖
`;
};

const generateBranchingGuide = () => {
  return `# Branching Guide

This document explains our branching strategy and workflow.

## 🌳 Branch Structure

### \`main\` → Production
- **Purpose:** Production-ready code
- **Protection:** Requires pull request + 1 approval
- **Deployment:** Auto-deploys to production environment

### \`dev\` → Integration
- **Purpose:** Development integration branch
- **Protection:** Requires pull request + 1 approval
- **Usage:** Merge feature branches here for testing

### \`staging\` → Testing
- **Purpose:** Pre-production testing
- **Usage:** Deploy to staging environment for QA

### \`prod\` → Release
- **Purpose:** Production release management
- **Usage:** Tag releases and manage deployments

### \`feature/<username>\` → Individual Development
- **Purpose:** Personal development workspace
- **Pattern:** \`feature/johndoe\`, \`feature/janesmith\`
- **Usage:** Each team member works on their own feature branch

## 🔄 Workflow

1. **Start Work**
   \`\`\`bash
   git checkout feature/<your-username>
   git pull origin dev
   \`\`\`

2. **Make Changes**
   - Commit regularly with meaningful messages
   - Push to your feature branch

3. **Create Pull Request**
   - From \`feature/<your-username>\` to \`dev\`
   - Request review from team leader
   - Address feedback

4. **Merge to Dev**
   - After approval, merge to \`dev\`
   - Test in development environment

5. **Deploy to Staging**
   - Create PR from \`dev\` to \`staging\`
   - QA testing

6. **Release to Production**
   - Create PR from \`staging\` to \`main\`
   - Final review and deployment

## 📝 Commit Message Convention

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation changes
- \`style:\` Code style changes
- \`refactor:\` Code refactoring
- \`test:\` Test changes
- \`chore:\` Build/tool changes

## 🛡️ Branch Protection Rules

All protected branches require:
- Pull request review
- At least 1 approval
- No direct pushes

---

*Questions? Contact your team leader.* 👨‍💼👩‍💼
`;
};

// Get all projects
export const getAllProjects = async (req, res, next) => {
  try {
    const projects = await ProjectModel.getAll();
    return res.status(200).json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    next(error);
  }
};

// Get project by ID
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.getById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project tasks
    const tasks = await TaskModel.getByProject(id);
    
    return res.status(200).json({
      success: true,
      data: {
        ...project,
        tasks
      }
    });
  } catch (error) {
    logger.error('Error fetching project:', error);
    next(error);
  }
};

// Update project
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const project = await ProjectModel.update(id, updateData);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    next(error);
  }
};

// Delete project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.delete(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    next(error);
  }
};

// Create task for project
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const taskData = {
      ...req.body,
      project_id: projectId
    };
    
    const task = await TaskModel.create(taskData);
    
    return res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    logger.error('Error creating task:', error);
    next(error);
  }
};

// Get tasks for project
export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const tasks = await TaskModel.getByProject(projectId);
    
    return res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    next(error);
  }
};

// Get project statistics
export const getProjectStats = async (req, res, next) => {
  try {
    const stats = await ProjectModel.getStatistics();
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching project statistics:', error);
    next(error);
  }
};
