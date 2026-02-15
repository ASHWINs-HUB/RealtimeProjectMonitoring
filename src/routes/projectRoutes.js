// src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const ProjectModel = require('../models/projectModel');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/test', async (req, res) => {
  try {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create-temp', async (req, res) => {
  try {
    const { jira_project_key, jira_project_name, description, repo_name, deadline } = req.body;
    if (!jira_project_key || !jira_project_name) {
      return res.status(400).json({ message: 'Project key and name are required' });
    }

    // Create project without JIRA integration for testing
    const project = await ProjectModel.create({
      jira_project_name,
      github_repo_name: repo_name || null,
      github_repo_url: null,
      status: 'PENDING',
      created_by: null
    });

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const projects = await ProjectModel.all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, projectController.getProjects);
router.get('/jira', authenticateToken, authorizeRoles('HR'), projectController.getJiraProjects);
router.post('/', authenticateToken, authorizeRoles('HR'), projectController.createProject);
router.put('/:id/approve', authenticateToken, authorizeRoles('MANAGER'), projectController.approveProject);
router.put('/:id/reject', authenticateToken, authorizeRoles('MANAGER'), projectController.rejectProject);
router.post('/:id/branches', authenticateToken, authorizeRoles('TEAM_LEADER'), projectController.addBranches);
router.get('/:id/offers', authenticateToken, authorizeRoles('MANAGER'), projectController.getOffers);
router.post('/offers/:offerId/accept', authenticateToken, authorizeRoles('MANAGER'), projectController.acceptOffer);
router.post('/offers/:offerId/reject', authenticateToken, authorizeRoles('MANAGER'), projectController.rejectOffer);
router.put('/:id/github', authenticateToken, authorizeRoles('MANAGER'), projectController.updateGitHubRepo);
router.post('/:id/team', authenticateToken, authorizeRoles('TEAM_LEADER'), projectController.addTeamMember);

module.exports = router;
