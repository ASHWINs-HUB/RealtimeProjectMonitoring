// src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRoles('HR'), projectController.createProject);
router.put('/:id/approve', authenticateToken, authorizeRoles('MANAGER'), projectController.approveProject);
router.put('/:id/reject', authenticateToken, authorizeRoles('MANAGER'), projectController.rejectProject);
router.post('/:id/branches', authenticateToken, authorizeRoles('TEAM_LEADER'), projectController.addBranches);
router.post('/:id/team', authenticateToken, authorizeRoles('TEAM_LEADER'), projectController.addTeamMember);

module.exports = router;
