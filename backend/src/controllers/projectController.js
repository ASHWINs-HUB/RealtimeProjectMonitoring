import logger from '../utils/logger.js';
import githubService from '../services/githubService.js';

export const createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      projectKey,
      description,
      repoName,
      private: isPrivate,
      teamLeader,
      teamMembers
    } = req.body;

    logger.info(`Starting project creation: ${projectName} (${projectKey})`);

    // 1. Create GitHub repository
    const repo = await githubService.createRepository({
      name: repoName,
      description: `${projectName} - ${description}`,
      private: isPrivate
    });

    logger.info(`Repository created: ${repo.html_url}`);

    // 2. Create branches
    const branches = ['dev', 'staging', 'prod'];
    for (const branch of branches) {
      await githubService.createBranch(repo.full_name, 'main', branch);
      logger.info(`Branch created: ${branch}`);
    }

    // 3. Create feature branches for each team member
    const allMembers = [teamLeader, ...teamMembers];
    for (const member of allMembers) {
      await githubService.createBranch(repo.full_name, 'dev', `feature/${member}`);
      logger.info(`Feature branch created: feature/${member}`);
    }

    // 4. Create README.md
    const readmeContent = generateReadme(projectName, description, projectKey, teamLeader, teamMembers);
    await githubService.createFile(repo.full_name, 'main', 'README.md', readmeContent, 'Initial commit: Add README.md');
    logger.info('README.md created');

    // 5. Create BRANCHING_GUIDE.md
    const branchingGuideContent = generateBranchingGuide();
    await githubService.createFile(repo.full_name, 'main', 'BRANCHING_GUIDE.md', branchingGuideContent, 'Add branching guide');
    logger.info('BRANCHING_GUIDE.md created');

    // 6. Apply branch protection rules
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

    // 7. Add collaborators
    for (const member of teamMembers) {
      await githubService.addCollaborator(repo.full_name, member, 'push');
      logger.info(`Collaborator added: ${member}`);
    }

    logger.info(`Project creation completed: ${repo.html_url}`);

    return res.status(201).json({
      success: true,
      repoUrl: repo.html_url,
      repoName: repo.name,
      message: 'Repository created successfully with all configurations'
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
   ```bash
   git checkout feature/<your-username>
   git pull origin dev
   ```

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
