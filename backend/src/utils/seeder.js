import bcryptjs from 'bcryptjs';
import pool from '../config/database.js';
import logger from './logger.js';
import { mlAnalytics } from '../services/mlAnalytics.js';

export const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    // Check if users already exist
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      logger.info('Database already seeded, skipping...');
      const firstUser = await client.query('SELECT email FROM users LIMIT 1');
      if (firstUser.rows[0].email !== 'hr@projectpulse.io') {
        logger.info('Wiping and re-seeding to ensure clean state...');
      } else {
        return;
      }
    }

    await client.query('BEGIN');

    const salt = await bcryptjs.genSalt(12);
    const password = await bcryptjs.hash('password123', salt);

    // 1. Create Users
    const usersData = [
      { name: 'System Admin', email: 'admin@projectpulse.io', password, role: 'admin', department: 'IT Operations' },
      { name: 'Sarah HR', email: 'hr@projectpulse.io', password, role: 'hr', department: 'Human Resources' },
      { name: 'Alex Manager', email: 'manager@projectpulse.io', password, role: 'manager', department: 'Engineering' },
      { name: 'Taylor Lead', email: 'lead@projectpulse.io', password, role: 'team_leader', department: 'Engineering' },
      { name: 'Casey Dev', email: 'dev@projectpulse.io', password, role: 'developer', department: 'Engineering' }
    ];

    const users = [];
    for (const u of usersData) {
      const res = await client.query(
        `INSERT INTO users (name, email, password, role, department) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO UPDATE SET 
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           department = EXCLUDED.department
         RETURNING *`,
        [u.name, u.email, u.password, u.role, u.department]
      );
      users.push(res.rows[0]);
    }

    const hr = users.find(u => u.role === 'hr');
    const manager = users.find(u => u.role === 'manager');
    const lead = users.find(u => u.role === 'team_leader');
    const dev = users.find(u => u.role === 'developer');

    // 2. Create Projects
    const projectsData = [
      { name: 'Cloud Migration 2026', key: 'CLOUD', status: 'on_track', priority: 'high', progress: 65, deadline: '2026-12-01' },
      { name: 'Mobile App Phoenix', key: 'PHOENIX', status: 'at_risk', priority: 'critical', progress: 42, deadline: '2026-10-15' },
      { name: 'Data Pipeline API', key: 'DATA', status: 'active', priority: 'medium', progress: 15, deadline: '2027-02-20' },
      { name: 'Legacy System Patch', key: 'LEGACY', status: 'delayed', priority: 'high', progress: 88, deadline: '2026-08-30' }
    ];

    const projects = [];
    for (const p of projectsData) {
      const res = await client.query(
        `INSERT INTO projects (name, project_key, description, status, priority, progress, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         ON CONFLICT (project_key) DO UPDATE SET
           name = EXCLUDED.name,
           status = EXCLUDED.status,
           progress = EXCLUDED.progress
         RETURNING *`,
        [p.name, p.key, `Sample project: ${p.name}`, p.status, p.priority, p.progress, p.deadline, hr.id]
      );
      projects.push(res.rows[0]);
    }

    // 3. Assign Manager to Projects
    for (const p of projects) {
      await client.query(
        `INSERT INTO project_managers (project_id, manager_id, status, accepted_at)
         VALUES ($1, $2, 'accepted', CURRENT_TIMESTAMP)
         ON CONFLICT (project_id, manager_id) DO UPDATE SET status = 'accepted'`,
        [p.id, manager.id]
      );
    }

    // 4. Create Scopes for Team Leader
    const cloudProject = projects.find(p => p.project_key === 'CLOUD');
    const phoenixProject = projects.find(p => p.project_key === 'PHOENIX');

    // For simplicity, we'll use a fixed title to check for scope existence or just delete old ones
    await client.query('DELETE FROM scopes WHERE project_id IN ($1, $2)', [cloudProject.id, phoenixProject.id]);

    const scopesRes = await client.query(
      `INSERT INTO scopes (project_id, assigned_by, team_leader_id, title, description, deadline)
       VALUES 
       ($1, $2, $3, 'Infrastructure Setup', 'Set up AWS landing zone', '2026-09-15'),
       ($4, $2, $3, 'Mobile Auth Layer', 'Implement biometrics and JWT', '2026-08-20')
       RETURNING *`,
      [cloudProject.id, manager.id, lead.id, phoenixProject.id]
    );
    const scope1 = scopesRes.rows[0];
    const scope2 = scopesRes.rows[1];

    // 5. Create Tasks for Developer
    await client.query('DELETE FROM tasks WHERE scope_id IN ($1, $2)', [scope1.id, scope2.id]);
    await client.query(
      `INSERT INTO tasks (project_id, scope_id, title, description, status, priority, assigned_to, assigned_by, story_points, due_date)
       VALUES 
       ($1, $2, 'Provision VPC', 'Terraform apply for dev enviroment', 'done', 'high', $3, $4, 5, '2026-09-10'),
       ($1, $2, 'Configure S3 Buckets', 'Set up lifecycle policies', 'in_progress', 'medium', $3, $4, 3, '2026-09-12'),
       ($5, $6, 'Auth UI Screens', 'React Native views for login', 'todo', 'high', $3, $4, 8, '2026-08-15')`,
      [cloudProject.id, scope1.id, dev.id, lead.id, phoenixProject.id, scope2.id]
    );

    // 6. Create Notifications
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Welcome to ProjectPulse', 'Your account has been successfully set up.', 'success')
       ON CONFLICT DO NOTHING`,
      [hr.id]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'New Project Assignment', 'You have 4 projects waiting for oversight.', 'info')
       ON CONFLICT DO NOTHING`,
      [manager.id]
    );

    await client.query('COMMIT');

    logger.info('Database seeded with base data. Computing ML metrics...');

    // 7. Compute ML metrics immediately after seeding
    await mlAnalytics.computeAllMetrics();

    logger.info('Database seeded and ML metrics computed!');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Run directly
if (process.argv[1]?.includes('seeder')) {
  import('dotenv').then(d => d.config());
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
