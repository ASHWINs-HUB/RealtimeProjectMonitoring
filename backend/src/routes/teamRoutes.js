import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    getMyTeam, addTeamMember, getTeamStats,
    getManagerTeamLeaders, getHRManagers, getManagerStats
} from '../controllers/teamController.js';

const router = Router();
router.use(authenticateToken);

// Team Leader: see their developers, add developer
router.get('/my-team', getMyTeam);
router.post('/add-member', authorizeRoles('hr', 'manager', 'team_leader'), addTeamMember);

// Manager: see team leaders and their teams
router.get('/team-stats/:teamLeaderId', authorizeRoles('hr', 'manager', 'admin'), getTeamStats);

// Manager: see only their team leaders
router.get('/my-team-leaders', authorizeRoles('manager', 'admin'), getManagerTeamLeaders);

// HR: see only managers
router.get('/managers', authorizeRoles('hr', 'admin'), getHRManagers);
router.get('/manager-stats/:managerId', authorizeRoles('hr', 'admin'), getManagerStats);

export default router;
