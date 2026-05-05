import pool from './src/config/database.js';
import logger from './src/utils/logger.js';

const verifyParams = async () => {
    try {
        console.log('--- Verifying AI Analytics Parameters Fetching ---');

        // 1. Get a project to test (first active one)
        const projectResult = await pool.query("SELECT id, name FROM projects WHERE status NOT IN ('completed', 'cancelled') LIMIT 1");
        if (projectResult.rows.length === 0) {
            console.log('No active projects found to test.');
            process.exit(0);
        }
        const projectId = projectResult.rows[0].id;
        console.log(`Testing Project: ${projectResult.rows[0].name} (ID: ${projectId})`);

        // 2. Fetch Param: Stagnation Days
        console.log('\n[1] Stagnation Days (Source: Jira/Tasks)');
        const stagnation = await pool.query(`
            SELECT id, title, updated_at, EXTRACT(DAY FROM NOW() - updated_at) as days_stagnant 
            FROM tasks WHERE project_id = $1 AND status = 'in_progress' ORDER BY updated_at ASC LIMIT 1
        `, [projectId]);
        console.log(`   Query: "MAX(NOW() - updated_at) from tasks WHERE status='in_progress'"`);
        if (stagnation.rows.length > 0) {
            console.log(`   Found Stagnant Task: "${stagnation.rows[0].title}" (${stagnation.rows[0].days_stagnant} days)`);
        } else {
            console.log(`   No tasks currently in_progress (Value: 0)`);
        }

        // 3. Fetch Param: Velocity Drop
        console.log('\n[2] Velocity Drop (Source: Jira/Tasks + GitHub/Commits)');
        const velocity = await pool.query(`
             SELECT 
                (SELECT COALESCE(SUM(story_points), 0) FROM tasks WHERE project_id = $1 AND status = 'done' AND completed_at > NOW() - INTERVAL '14 days') as cur_sp,
                (SELECT COALESCE(SUM(story_points), 0) FROM tasks WHERE project_id = $1 AND status = 'done' AND completed_at BETWEEN NOW() - INTERVAL '28 days' AND NOW() - INTERVAL '14 days') as prev_sp
        `, [projectId]);

        const commitVelocity = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM github_commits gc JOIN github_mapping gm ON gc.github_mapping_id = gm.id WHERE gm.project_id = $1 AND gc.committed_at > NOW() - INTERVAL '14 days') as cur_commits,
                (SELECT COUNT(*) FROM github_commits gc JOIN github_mapping gm ON gc.github_mapping_id = gm.id WHERE gm.project_id = $1 AND gc.committed_at BETWEEN NOW() - INTERVAL '28 days' AND NOW() - INTERVAL '14 days') as prev_commits
        `, [projectId]);

        console.log(`   Current 14d Points: ${velocity.rows[0].cur_sp} | Previous 14d Points: ${velocity.rows[0].prev_sp}`);
        console.log(`   Current 14d Commits: ${commitVelocity.rows[0].cur_commits} | Previous 14d Commits: ${commitVelocity.rows[0].prev_commits}`);

        // 4. Fetch Param: Bug Density
        console.log('\n[3] Bug Density (Source: Jira/Tasks + GitHub/Fixes)');
        const bugs = await pool.query(`
            SELECT COUNT(*) as count FROM tasks 
            WHERE project_id = $1 
            AND (LOWER(title) LIKE '%bug%' OR LOWER(description) LIKE '%bug%' OR LOWER(title) LIKE '%fix%')
        `, [projectId]);
        const fixes = await pool.query(`
            SELECT COUNT(*) as count FROM github_commits gc
            JOIN github_mapping gm ON gc.github_mapping_id = gm.id
            WHERE gm.project_id = $1 AND (LOWER(message) LIKE '%fix%' OR LOWER(message) LIKE '%bug%' OR LOWER(message) LIKE '%resolve%')
        `, [projectId]);
        console.log(`   Jira Bugs Found: ${bugs.rows[0].count}`);
        console.log(`   GitHub Fix Commits Found: ${fixes.rows[0].count}`);

        // 5. Fetch Param: Workload Ratio
        console.log('\n[4] Workload Ratio (Source: Jira/Tasks)');
        const workload = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status IN ('in_progress', 'in_review')) as active_work,
                (SELECT COUNT(DISTINCT assigned_to) FROM tasks WHERE project_id = $1) as team_size
        `, [projectId]);
        console.log(`   Active Tasks: ${workload.rows[0].active_work}`);
        console.log(`   Team Size (active in Jira): ${workload.rows[0].team_size}`);

        // 6. Fetch Param: Dependency Blocked
        console.log('\n[5] Dependency Blocked (Source: Jira/Tasks)');
        const blocked = await pool.query(`SELECT COUNT(*) as count FROM tasks WHERE project_id = $1 AND status = 'blocked'`, [projectId]);
        console.log(`   Blocked Tasks: ${blocked.rows[0].count}`);

        console.log('\n--- Verification Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

verifyParams();
