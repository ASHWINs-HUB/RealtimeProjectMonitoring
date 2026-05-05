import pool from '../config/database.js';
import { SecurityDomain } from '../domain/services/SecurityDomain.js';
import logger from '../utils/logger.js';

// ── Pre-filled developer pool (mock candidates per role) ───────────────────────
const DEVELOPER_POOL = {
    'Senior QA Engineer': [
        { name: 'Ananya Sharma', email: 'ananya.sharma@talent.io', skills: ['Selenium', 'JIRA', 'Python', 'API Testing'], exp: '6 yrs', rate: '₹18L/yr', avatar: 'AS' },
        { name: 'Rohit Verma', email: 'rohit.verma@talent.io', skills: ['Cypress', 'TestRail', 'Postman', 'CI/CD'], exp: '5 yrs', rate: '₹16L/yr', avatar: 'RV' },
        { name: 'Priya Nair', email: 'priya.nair@talent.io', skills: ['Playwright', 'k6', 'Jest', 'SDET'], exp: '7 yrs', rate: '₹20L/yr', avatar: 'PN' },
    ],
    'QA Automation Engineer': [
        { name: 'Karan Mehta', email: 'karan.mehta@talent.io', skills: ['Selenium', 'Java', 'TestNG', 'Jenkins'], exp: '3 yrs', rate: '₹11L/yr', avatar: 'KM' },
        { name: 'Sneha Reddy', email: 'sneha.reddy@talent.io', skills: ['Cypress', 'JavaScript', 'GitHub Actions'], exp: '2.5 yrs', rate: '₹9L/yr', avatar: 'SR' },
        { name: 'Aditya Patel', email: 'aditya.patel@talent.io', skills: ['Robot Framework', 'Python', 'Allure'], exp: '4 yrs', rate: '₹13L/yr', avatar: 'AP' },
    ],
    'Backend Developer': [
        { name: 'Vikram Singh', email: 'vikram.singh@talent.io', skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'], exp: '5 yrs', rate: '₹17L/yr', avatar: 'VS' },
        { name: 'Deepak Joshi', email: 'deepak.joshi@talent.io', skills: ['Python', 'FastAPI', 'MongoDB', 'AWS'], exp: '4 yrs', rate: '₹15L/yr', avatar: 'DJ' },
        { name: 'Meena Iyer', email: 'meena.iyer@talent.io', skills: ['Java', 'Spring Boot', 'Kafka', 'Kubernetes'], exp: '6 yrs', rate: '₹19L/yr', avatar: 'MI' },
    ],
    'Frontend Developer': [
        { name: 'Riya Kapoor', email: 'riya.kapoor@talent.io', skills: ['React', 'TypeScript', 'Tailwind', 'Figma'], exp: '3 yrs', rate: '₹12L/yr', avatar: 'RK' },
        { name: 'Arjun Das', email: 'arjun.das@talent.io', skills: ['Vue.js', 'Nuxt', 'SCSS', 'Vite'], exp: '4 yrs', rate: '₹14L/yr', avatar: 'AD' },
        { name: 'Pooja Krishnan', email: 'pooja.krishnan@talent.io', skills: ['React', 'Next.js', 'Redux', 'GraphQL'], exp: '5 yrs', rate: '₹16L/yr', avatar: 'PK' },
    ],
    'Full Stack Developer': [
        { name: 'Rahul Gupta', email: 'rahul.gupta@talent.io', skills: ['React', 'Node.js', 'MongoDB', 'Docker'], exp: '5 yrs', rate: '₹18L/yr', avatar: 'RG' },
        { name: 'Divya Bhat', email: 'divya.bhat@talent.io', skills: ['Next.js', 'Express', 'PostgreSQL', 'AWS'], exp: '4 yrs', rate: '₹16L/yr', avatar: 'DB' },
        { name: 'Sanjay Kumar', email: 'sanjay.kumar@talent.io', skills: ['Angular', 'NestJS', 'MySQL', 'CI/CD'], exp: '6 yrs', rate: '₹20L/yr', avatar: 'SK' },
    ],
    'Mid-level Backend Developer': [
        { name: 'Nikhil Rao', email: 'nikhil.rao@talent.io', skills: ['Node.js', 'Express', 'MySQL', 'Git'], exp: '2 yrs', rate: '₹8L/yr', avatar: 'NR' },
        { name: 'Fatima Sheikh', email: 'fatima.sheikh@talent.io', skills: ['Python', 'Django', 'SQLite', 'REST'], exp: '2.5 yrs', rate: '₹9L/yr', avatar: 'FS' },
        { name: 'Amit Tiwari', email: 'amit.tiwari@talent.io', skills: ['PHP', 'Laravel', 'MySQL', 'Redis'], exp: '3 yrs', rate: '₹10L/yr', avatar: 'AT' },
    ],
    'Senior Developer / Tech Lead': [
        { name: 'Harish Pillai', email: 'harish.pillai@talent.io', skills: ['System Design', 'Go', 'Kubernetes', 'Microservices'], exp: '9 yrs', rate: '₹28L/yr', avatar: 'HP' },
        { name: 'Sreeja Unni', email: 'sreeja.unni@talent.io', skills: ['Java', 'Spring Cloud', 'AWS', 'Leadership'], exp: '8 yrs', rate: '₹25L/yr', avatar: 'SU' },
        { name: 'Manoj Naik', email: 'manoj.naik@talent.io', skills: ['Node.js', 'React', 'System Design', 'Mentoring'], exp: '10 yrs', rate: '₹30L/yr', avatar: 'MN' },
    ],
    'DevOps / Integration Engineer': [
        { name: 'Suresh Babu', email: 'suresh.babu@talent.io', skills: ['Kubernetes', 'Terraform', 'Jenkins', 'AWS'], exp: '5 yrs', rate: '₹18L/yr', avatar: 'SB' },
        { name: 'Kavitha Rao', email: 'kavitha.rao@talent.io', skills: ['Docker', 'GitHub Actions', 'Azure', 'Helm'], exp: '4 yrs', rate: '₹15L/yr', avatar: 'KR' },
        { name: 'Tanvir Ahmed', email: 'tanvir.ahmed@talent.io', skills: ['Ansible', 'Prometheus', 'GCP', 'Bash'], exp: '6 yrs', rate: '₹20L/yr', avatar: 'TA' },
    ],
    'Project Delivery Manager': [
        { name: 'Lakshmi Prasad', email: 'lakshmi.prasad@talent.io', skills: ['PMP', 'Agile', 'Stakeholder Mgmt', 'JIRA'], exp: '10 yrs', rate: '₹32L/yr', avatar: 'LP' },
        { name: 'Girish Nanda', email: 'girish.nanda@talent.io', skills: ['Scrum', 'Risk Mgmt', 'MS Project', 'OKRs'], exp: '8 yrs', rate: '₹28L/yr', avatar: 'GN' },
    ],
};

// GET /api/team/hire-pool?role=Backend+Developer
export const getAvailableDeveloperPool = async (req, res) => {
    const { role } = req.query;
    const pool_candidates = DEVELOPER_POOL[role] || Object.values(DEVELOPER_POOL).flat().slice(0, 3);
    res.json({ success: true, candidates: pool_candidates, role: role || 'All Roles' });
};

// POST /api/team/hire-and-assign
// Creates a developer user account + assigns a task on the project
export const hireAndAssignDeveloper = async (req, res, next) => {
    try {
        const { name, email, projectId, taskTitle, taskDescription, role: devRole, skills, department } = req.body;

        if (!name || !email || !projectId) {
            return res.status(400).json({ success: false, message: 'name, email, and projectId are required' });
        }

        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        let userId;

        if (existing.rows.length > 0) {
            userId = existing.rows[0].id;
            logger.info(`Developer ${email} already exists, using existing account id=${userId}`);
        } else {
            // Create the developer account with a default password
            const defaultPw = `Welcome@${Math.floor(Math.random() * 9000) + 1000}`;
            const hashed = await SecurityDomain.hashPassword(defaultPw);
            const userResult = await pool.query(
                `INSERT INTO users (name, email, password, role, department, is_active)
                 VALUES ($1, $2, $3, 'developer', $4, true)
                 RETURNING id, name, email, role`,
                [name, email, hashed, department || 'Engineering']
            );
            userId = userResult.rows[0].id;
            logger.info(`Hired new developer: ${email} (id=${userId}) for project ${projectId}`);
        }

        // Create a task for them on this project
        if (taskTitle) {
            await pool.query(
                `INSERT INTO tasks (project_id, title, description, assigned_to, status, priority, story_points, updated_at)
                 VALUES ($1, $2, $3, $4, 'todo', 'medium', 3, NOW())`,
                [projectId, taskTitle, taskDescription || `Assigned to ${name} (${devRole || 'Developer'})`, userId]
            );
        }

        res.status(201).json({
            success: true,
            message: `${name} has been hired and assigned to the project.`,
            userId,
        });
    } catch (error) {
        logger.error('hireAndAssignDeveloper failed:', error);
        next(error);
    }
};

// GET /api/team/my-team
// Role-aware: team_leader sees their developers, manager sees their team leaders, hr sees managers
export const getMyTeam = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        let members = [];

        if (role === 'team_leader') {
            // Team leader sees:
            // 1. Developers assigned to tasks under their scopes
            // 2. ALL developers (who may not have assignments yet)
            // We use UNION to combine both sets
            const result = await pool.query(`
                SELECT u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url,
                    COALESCE(stats.total_tasks, 0) as total_tasks,
                    COALESCE(stats.completed_tasks, 0) as completed_tasks,
                    COALESCE(stats.active_tasks, 0) as active_tasks,
                    COALESCE(stats.blocked_tasks, 0) as blocked_tasks
                FROM users u
                LEFT JOIN (
                    SELECT t.assigned_to,
                        COUNT(DISTINCT t.id) as total_tasks,
                        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
                        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as active_tasks,
                        COUNT(DISTINCT CASE WHEN t.status = 'blocked' THEN t.id END) as blocked_tasks
                    FROM tasks t
                    INNER JOIN scopes s ON t.scope_id = s.id AND s.team_leader_id = $1
                    GROUP BY t.assigned_to
                ) stats ON stats.assigned_to = u.id
                WHERE u.role = 'developer' AND u.is_active = true
                ORDER BY u.name ASC
            `, [id]);
            members = result.rows;
        } else if (role === 'manager') {
            // Manager sees:
            // 1. Team leaders assigned to scopes under their projects
            // 2. ALL team leaders (who may not have scope assignments yet)
            const result = await pool.query(`
                SELECT u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url,
                    COALESCE(stats.total_scopes, 0) as total_scopes,
                    COALESCE(stats.completed_scopes, 0) as completed_scopes,
                    COALESCE(stats.team_size, 0) as team_size,
                    COALESCE(stats.total_tasks, 0) as total_tasks,
                    COALESCE(stats.completed_tasks, 0) as completed_tasks
                FROM users u
                LEFT JOIN (
                    SELECT s.team_leader_id,
                        COUNT(DISTINCT s.id) as total_scopes,
                        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_scopes,
                        (SELECT COUNT(DISTINCT t2.assigned_to) 
                         FROM tasks t2 
                         INNER JOIN scopes s2 ON t2.scope_id = s2.id 
                         WHERE s2.team_leader_id = s.team_leader_id AND t2.assigned_to IS NOT NULL) as team_size,
                        COUNT(DISTINCT t.id) as total_tasks,
                        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
                    FROM scopes s
                    INNER JOIN project_managers pm ON pm.project_id = s.project_id AND pm.manager_id = $1 AND pm.status = 'accepted'
                    LEFT JOIN tasks t ON t.scope_id = s.id
                    GROUP BY s.team_leader_id
                ) stats ON stats.team_leader_id = u.id
                WHERE u.role = 'team_leader' AND u.is_active = true
                ORDER BY u.name ASC
            `, [id]);
            members = result.rows;
        } else if (role === 'hr' || role === 'admin') {
            // HR sees all managers
            const result = await pool.query(`
                SELECT u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url,
                    COUNT(DISTINCT pm.project_id) as managed_projects,
                    (SELECT COUNT(DISTINCT s2.team_leader_id) 
                     FROM scopes s2 
                     INNER JOIN project_managers pm2 ON pm2.project_id = s2.project_id 
                     WHERE pm2.manager_id = u.id AND pm2.status = 'accepted') as team_leaders_count
                FROM users u
                LEFT JOIN project_managers pm ON pm.manager_id = u.id AND pm.status = 'accepted'
                WHERE u.role = 'manager' AND u.is_active = true
                GROUP BY u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url
                ORDER BY u.name ASC
            `, []);
            members = result.rows;
        }

        res.json({ success: true, members });
    } catch (error) {
        logger.error('getMyTeam failed:', error);
        next(error);
    }
};

// POST /api/team/add-member
// Team leader adds developer, Manager adds team_leader, HR adds manager
export const addTeamMember = async (req, res, next) => {
    try {
        const { role: callerRole } = req.user;
        const { name, email, password, department } = req.body;

        // Determine what role the new member should have based on who's creating them
        let newRole;
        if (callerRole === 'team_leader') {
            newRole = 'developer';
        } else if (callerRole === 'manager') {
            newRole = 'team_leader';
        } else if (callerRole === 'hr' || callerRole === 'admin') {
            newRole = req.body.role || 'manager';
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized to add members' });
        }

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'A user with this email already exists' });
        }

        // Hash password and create user
        const hashedPassword = await SecurityDomain.hashPassword(password);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, department)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, role, department, is_active, created_at`,
            [name, email, hashedPassword, newRole, department || null]
        );

        logger.info(`User ${req.user.email} (${callerRole}) created new ${newRole}: ${email}`);

        res.status(201).json({
            success: true,
            message: `${newRole.replace('_', ' ')} created successfully`,
            user: result.rows[0]
        });
    } catch (error) {
        logger.error('addTeamMember failed:', error);
        next(error);
    }
};

// GET /api/team/team-stats/:teamLeaderId
// Manager clicks on a team leader to see their team stats
export const getTeamStats = async (req, res, next) => {
    try {
        const { teamLeaderId } = req.params;

        // Get team leader info
        const leaderResult = await pool.query(
            'SELECT id, name, email, role, department, created_at FROM users WHERE id = $1 AND role = $2',
            [teamLeaderId, 'team_leader']
        );

        if (leaderResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Team leader not found' });
        }

        const leader = leaderResult.rows[0];

        // Get team members (developers) under this team leader
        const membersResult = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as active_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'blocked' THEN t.id END) as blocked_tasks
            FROM users u
            INNER JOIN tasks t ON t.assigned_to = u.id
            INNER JOIN scopes s ON t.scope_id = s.id AND s.team_leader_id = $1
            WHERE u.role = 'developer' AND u.is_active = true
            GROUP BY u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at
            ORDER BY u.name ASC
        `, [teamLeaderId]);

        // Get scopes managed by this team leader
        const scopesResult = await pool.query(`
            SELECT s.id, s.title, s.status, s.deadline, p.name as project_name,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
            FROM scopes s
            INNER JOIN projects p ON s.project_id = p.id
            LEFT JOIN tasks t ON t.scope_id = s.id
            WHERE s.team_leader_id = $1
            GROUP BY s.id, s.title, s.status, s.deadline, p.name
            ORDER BY s.created_at DESC
        `, [teamLeaderId]);

        // Overall stats
        const statsResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'blocked' THEN t.id END) as blocked_tasks,
                COUNT(DISTINCT t.assigned_to) as team_size,
                COUNT(DISTINCT s.id) as total_scopes,
                COUNT(DISTINCT s.project_id) as total_projects
            FROM scopes s
            LEFT JOIN tasks t ON t.scope_id = s.id
            WHERE s.team_leader_id = $1
        `, [teamLeaderId]);

        res.json({
            success: true,
            leader,
            members: membersResult.rows,
            scopes: scopesResult.rows,
            stats: statsResult.rows[0] || {}
        });
    } catch (error) {
        logger.error('getTeamStats failed:', error);
        next(error);
    }
};

// GET /api/team/my-team-leaders
// Manager sees their team leaders
export const getManagerTeamLeaders = async (req, res, next) => {
    try {
        const { id } = req.user;

        const result = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url,
                COUNT(DISTINCT s.id) as total_scopes,
                COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_scopes,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
                (SELECT COUNT(DISTINCT t2.assigned_to) 
                 FROM tasks t2 
                 INNER JOIN scopes s2 ON t2.scope_id = s2.id 
                 WHERE s2.team_leader_id = u.id AND t2.assigned_to IS NOT NULL) as team_size
            FROM users u
            INNER JOIN scopes s ON s.team_leader_id = u.id
            INNER JOIN project_managers pm ON pm.project_id = s.project_id AND pm.manager_id = $1 AND pm.status = 'accepted'
            LEFT JOIN tasks t ON t.scope_id = s.id
            WHERE u.role = 'team_leader' AND u.is_active = true
            GROUP BY u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url
            ORDER BY u.name ASC
        `, [id]);

        res.json({ success: true, teamLeaders: result.rows });
    } catch (error) {
        logger.error('getManagerTeamLeaders failed:', error);
        next(error);
    }
};

// GET /api/team/managers
// HR sees all managers with their stats
export const getHRManagers = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url,
                COUNT(DISTINCT pm.project_id) as managed_projects,
                (SELECT COUNT(DISTINCT pm2.project_id) FROM project_managers pm2 
                 WHERE pm2.manager_id = u.id AND pm2.status = 'accepted') as active_projects,
                (SELECT COUNT(DISTINCT s2.team_leader_id) 
                 FROM scopes s2 
                 INNER JOIN project_managers pm3 ON pm3.project_id = s2.project_id 
                 WHERE pm3.manager_id = u.id AND pm3.status = 'accepted') as team_leaders_count,
                (SELECT COUNT(DISTINCT t2.id) 
                 FROM tasks t2 
                 INNER JOIN scopes s3 ON t2.scope_id = s3.id 
                 INNER JOIN project_managers pm4 ON pm4.project_id = s3.project_id
                 WHERE pm4.manager_id = u.id AND pm4.status = 'accepted') as total_tasks,
                (SELECT COUNT(DISTINCT t3.id)
                 FROM tasks t3
                 INNER JOIN scopes s4 ON t3.scope_id = s4.id
                 INNER JOIN project_managers pm5 ON pm5.project_id = s4.project_id
                 WHERE pm5.manager_id = u.id AND pm5.status = 'accepted' AND t3.status = 'done') as completed_tasks
            FROM users u
            LEFT JOIN project_managers pm ON pm.manager_id = u.id
            WHERE u.role = 'manager' AND u.is_active = true
            GROUP BY u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at, u.avatar_url
            ORDER BY u.name ASC
        `);

        res.json({ success: true, managers: result.rows });
    } catch (error) {
        logger.error('getHRManagers failed:', error);
        next(error);
    }
};

// GET /api/team/manager-stats/:managerId
// HR views a specific manager's stats
export const getManagerStats = async (req, res, next) => {
    try {
        const { managerId } = req.params;

        // Manager info
        const managerResult = await pool.query(
            'SELECT id, name, email, role, department, created_at FROM users WHERE id = $1 AND role = $2',
            [managerId, 'manager']
        );
        if (managerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        // Projects managed
        const projectsResult = await pool.query(`
            SELECT p.id, p.name, p.status, p.progress, p.deadline, p.project_key,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
            FROM projects p
            INNER JOIN project_managers pm ON pm.project_id = p.id AND pm.manager_id = $1 AND pm.status = 'accepted'
            LEFT JOIN tasks t ON t.project_id = p.id
            GROUP BY p.id, p.name, p.status, p.progress, p.deadline, p.project_key
            ORDER BY p.created_at DESC
        `, [managerId]);

        // Team leaders under this manager
        const teamLeadersResult = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.email, u.department,
                COUNT(DISTINCT s.id) as total_scopes,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
                (SELECT COUNT(DISTINCT t2.assigned_to) 
                 FROM tasks t2 
                 INNER JOIN scopes s2 ON t2.scope_id = s2.id 
                 WHERE s2.team_leader_id = u.id AND t2.assigned_to IS NOT NULL) as team_size
            FROM users u
            INNER JOIN scopes s ON s.team_leader_id = u.id
            INNER JOIN project_managers pm ON pm.project_id = s.project_id AND pm.manager_id = $1 AND pm.status = 'accepted'
            LEFT JOIN tasks t ON t.scope_id = s.id
            WHERE u.role = 'team_leader'
            GROUP BY u.id, u.name, u.email, u.department
            ORDER BY u.name ASC
        `, [managerId]);

        // Overall stats
        const statsResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT pm.project_id) as total_projects,
                COUNT(DISTINCT CASE WHEN p.status IN ('active', 'on_track') THEN p.id END) as active_projects,
                COUNT(DISTINCT s.team_leader_id) as total_team_leaders,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'blocked' THEN t.id END) as blocked_tasks,
                ROUND(CASE WHEN COUNT(DISTINCT t.id) > 0 
                    THEN (COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::numeric / COUNT(DISTINCT t.id)::numeric) * 100 
                    ELSE 0 END, 1) as completion_rate
            FROM project_managers pm
            INNER JOIN projects p ON p.id = pm.project_id
            LEFT JOIN scopes s ON s.project_id = p.id
            LEFT JOIN tasks t ON t.scope_id = s.id
            WHERE pm.manager_id = $1 AND pm.status = 'accepted'
        `, [managerId]);

        res.json({
            success: true,
            manager: managerResult.rows[0],
            projects: projectsResult.rows,
            teamLeaders: teamLeadersResult.rows,
            stats: statsResult.rows[0] || {}
        });
    } catch (error) {
        logger.error('getManagerStats failed:', error);
        next(error);
    }
};
