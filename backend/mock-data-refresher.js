/**
 * 🔄 Mock Data Refresher — ProjectPulse AI
 *
 * Every 3 minutes, applies small realistic mutations to the database
 * so that ALL 7 AI factor inputs change on each refresh:
 *
 *  Factor 1 — Project Gap       → moves tasks done vs in_progress
 *  Factor 2 — Deadline Pressure → adjusts due_date on tasks
 *  Factor 3 — Bug Density       → rotates [BUG] task titles in/out
 *  Factor 4 — Workload Ratio    → changes assigned_to spread
 *  Factor 5 — Velocity Drop     → inserts/removes recent commits
 *  Factor 6 — Stagnation Days   → nudges updated_at timestamps
 *  Factor 7 — Dependency Blocked→ flips tasks between blocked/in_progress
 *
 * Usage: node mock-data-refresher.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'projectpulse',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// ── Tiny helpers ───────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const coin = (p = 0.5) => Math.random() < p;
const pick = arr => arr[randInt(0, arr.length - 1)];
const round2 = v => Math.round(v * 100) / 100;

const COMMIT_MESSAGES = [
    'fix: resolve auth token expiry edge case',
    'feat: implement dashboard live-refresh logic',
    'refactor: optimise query performance on analytics',
    'fix: bug in task status transition validator',
    'chore: update dependency versions',
    'feat: add retry logic to github sync service',
    'fix: null pointer on empty project list',
    'test: add unit tests for risk engine',
    'fix: workload ratio calculation for large teams',
    'feat: enhance AI summary with trend data',
    'perf: cache project features for 60s',
    'fix: stagnation days miscounting completed tasks',
    'feat: velocity drop threshold alerting',
    'fix: dependency blocked tasks not syncing from Jira',
];

let tick = 0;

// ── Main refresh loop ──────────────────────────────────────────────────
async function refresh() {
    tick++;
    const ts = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`\n${'─'.repeat(56)}`);
    console.log(`🔄  Refresh #${tick}  |  ${ts}`);
    console.log(`${'─'.repeat(56)}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get all active projects
        const { rows: projects } = await client.query(`
            SELECT id, name, progress FROM projects
            WHERE status NOT IN ('completed', 'cancelled')
        `);

        if (!projects.length) {
            console.log('  ℹ️  No active projects — skipping.');
            await client.query('ROLLBACK');
            return;
        }

        for (const proj of projects) {
            console.log(`\n  📁 "${proj.name}" (id=${proj.id})`);
            await refreshProject(client, proj, tick);
        }

        await client.query('COMMIT');
        console.log(`\n✅  Done. Next refresh in 3 minutes.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌  Refresh failed:', err.message);
    } finally {
        client.release();
    }
}

// ── Per-project mutations ──────────────────────────────────────────────
async function refreshProject(client, proj, tick) {
    const pid = proj.id;
    const seed = pid + tick; // changes every tick so values drift

    const { rows: tasks } = await client.query(
        `SELECT id, title, status, story_points, estimated_hours, actual_hours,
                assigned_to, due_date, updated_at
         FROM tasks WHERE project_id = $1`, [pid]
    );

    // If no tasks yet, seed them
    if (!tasks.length) {
        await seedTasks(client, pid);
        const { rows } = await client.query(
            `SELECT id, title, status, story_points, estimated_hours, actual_hours,
                    assigned_to, due_date, updated_at
             FROM tasks WHERE project_id = $1`, [pid]
        );
        tasks.push(...rows);
    }

    // ── FACTOR 1: Project Gap ─────────────────────────────────────────
    // Move ≥1 task forward in status pipeline
    {
        const pipeline = { todo: 'in_progress', in_progress: 'in_review', in_review: 'done' };
        const movable = tasks.filter(t => pipeline[t.status]);
        const moved = movable.slice(0, randInt(1, 2));
        for (const t of moved) {
            const ns = pipeline[t.status];
            await client.query(
                `UPDATE tasks SET status=$1, updated_at=NOW()${ns === 'done' ? ', completed_at=NOW()' : ''} WHERE id=$2`,
                [ns, t.id]
            );
            console.log(`    ✅ Factor1 (ProjectGap): task#${t.id} ${t.status}→${ns}`);
        }
    }

    // ── FACTOR 2: Deadline Pressure ───────────────────────────────────
    // Shift due_date on 1-2 tasks by ±1–4 days
    {
        const sample = tasks.slice(0, randInt(1, 2));
        for (const t of sample) {
            const daysShift = pick([-3, -2, -1, 1, 2, 3]);
            await client.query(
                `UPDATE tasks
                 SET due_date = COALESCE(due_date, CURRENT_DATE) + INTERVAL '${daysShift} days'
                 WHERE id = $1`, [t.id]
            );
        }
        console.log(`    📅 Factor2 (Deadline): shifted due dates ±${sample.length} tasks`);
    }

    // ── FACTOR 3: Bug Density ─────────────────────────────────────────
    // Toggle a random task as [BUG] (add or remove prefix)
    {
        const normalTasks = tasks.filter(t => !t.title.startsWith('[BUG]'));
        const bugTasks = tasks.filter(t => t.title.startsWith('[BUG]'));

        // Add a bug ~40% chance
        if (coin(0.4) && normalTasks.length > 0) {
            const t = pick(normalTasks);
            await client.query(
                `UPDATE tasks SET title=$1 WHERE id=$2`,
                [`[BUG] ${t.title}`, t.id]
            );
            console.log(`    🐛 Factor3 (BugDensity): marked task#${t.id} as BUG`);
        }

        // Fix a bug ~30% chance
        if (coin(0.3) && bugTasks.length > 1) {
            const t = pick(bugTasks);
            const cleaned = t.title.replace(/^\[BUG\]\s*/, '');
            await client.query(
                `UPDATE tasks SET title=$1 WHERE id=$2`,
                [cleaned, t.id]
            );
            console.log(`    ✔️  Factor3 (BugDensity): resolved bug task#${t.id}`);
        }
    }

    // ── FACTOR 4: Workload Ratio ──────────────────────────────────────
    // Reassign 1-2 tasks to vary tasks-per-developer spread
    {
        const { rows: users } = await client.query(
            `SELECT DISTINCT assigned_to FROM tasks WHERE project_id=$1 AND assigned_to IS NOT NULL`, [pid]
        );
        if (users.length > 1 && coin(0.5)) {
            const t = pick(tasks.filter(t => t.status !== 'done'));
            const uid = pick(users).assigned_to;
            if (t && uid !== t.assigned_to) {
                await client.query(`UPDATE tasks SET assigned_to=$1 WHERE id=$2`, [uid, t.id]);
                console.log(`    👤 Factor4 (Workload): reassigned task#${t.id} → user#${uid}`);
            }
        }
    }

    // ── FACTOR 5: Velocity Drop ───────────────────────────────────────
    // Insert 1-3 mock commits to github_commits (or remove old ones)
    {
        const { rows: mappings } = await client.query(
            `SELECT id FROM github_mapping WHERE project_id=$1 LIMIT 1`, [pid]
        );

        let mappingId;
        if (mappings.length === 0) {
            mappingId = await seedGitHubMapping(client, pid);
        } else {
            mappingId = mappings[0].id;
        }

        if (mappingId) {
            const numNew = randInt(1, 3);
            for (let i = 0; i < numNew; i++) {
                const sha = genSha();
                const minsAgo = randInt(1, 180); // within last 3h
                const committedAt = new Date(Date.now() - minsAgo * 60_000);
                try {
                    await client.query(`
                        INSERT INTO github_commits
                          (github_mapping_id, commit_sha, author_name, author_email,
                           message, additions, deletions, files_changed, committed_at)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                        ON CONFLICT DO NOTHING`,
                        [
                            mappingId, sha,
                            pick(['Arjun S.', 'Priya P.', 'Dev K.', 'Sneha R.', 'Ravi M.']),
                            `dev${randInt(1, 5)}@team.io`,
                            pick(COMMIT_MESSAGES),
                            randInt(10, 220), randInt(1, 60), randInt(1, 12),
                            committedAt,
                        ]
                    );
                } catch (_) { /* sha conflict — skip */ }
            }
            console.log(`    📦 Factor5 (Velocity): +${numNew} commit(s)`);

            // Occasionally purge very old mock commits so frequency can drop
            if (coin(0.25)) {
                const deleted = await client.query(`
                    DELETE FROM github_commits
                    WHERE github_mapping_id=$1
                      AND committed_at < NOW() - INTERVAL '7 days'
                    RETURNING id`, [mappingId]
                );
                if (deleted.rowCount > 0)
                    console.log(`    🗑️  Factor5 (Velocity): removed ${deleted.rowCount} old commit(s) to lower frequency`);
            }
        }
    }

    // ── FACTOR 6: Stagnation Days ─────────────────────────────────────
    // Either "touch" a WIP task (updated_at=NOW) or artificially age it
    {
        const wip = tasks.filter(t => t.status === 'in_progress');
        if (wip.length > 0) {
            if (coin(0.5)) {
                // Age 1 task — push updated_at back 1-4 days (stagnation ↑)
                const t = pick(wip);
                const daysAgo = randInt(1, 4);
                await client.query(
                    `UPDATE tasks SET updated_at = NOW() - INTERVAL '${daysAgo} days' WHERE id=$1`, [t.id]
                );
                console.log(`    ⏳ Factor6 (Stagnation): aged task#${t.id} by ${daysAgo}d`);
            } else {
                // Touch 1 task — reset updated_at to now (stagnation ↓)
                const t = pick(wip);
                await client.query(`UPDATE tasks SET updated_at=NOW() WHERE id=$1`, [t.id]);
                console.log(`    🔔 Factor6 (Stagnation): touched task#${t.id}`);
            }
        }
    }

    // ── FACTOR 7: Dependency Blocked ─────────────────────────────────
    {
        const todo = tasks.filter(t => t.status === 'todo');
        const blocked = tasks.filter(t => t.status === 'blocked');

        // Block a task 35% chance
        if (coin(0.35) && todo.length > 0) {
            const t = pick(todo);
            await client.query(`UPDATE tasks SET status='blocked', updated_at=NOW() WHERE id=$1`, [t.id]);
            console.log(`    🚫 Factor7 (Blocked): task#${t.id} → blocked`);
        }

        // Unblock a task 40% chance (but keep at least 1 blocked for demo)
        if (coin(0.4) && blocked.length > 1) {
            const t = pick(blocked);
            await client.query(`UPDATE tasks SET status='in_progress', updated_at=NOW() WHERE id=$1`, [t.id]);
            console.log(`    🔓 Factor7 (Blocked): task#${t.id} → unblocked`);
        }
    }

    // ── Bump project progress ─────────────────────────────────────────
    const newProgress = Math.min(95, (proj.progress || 0) + randInt(1, 3));
    await client.query(`UPDATE projects SET progress=$1, updated_at=NOW() WHERE id=$2`, [newProgress, pid]);
    console.log(`    📈 Progress: ${proj.progress}% → ${newProgress}%`);
}

// ── Seeders ────────────────────────────────────────────────────────────
async function seedTasks(client, pid) {
    const { rows: users } = await client.query(
        `SELECT u.id FROM users u
         LEFT JOIN project_managers pm ON pm.manager_id = u.id AND pm.project_id = $1
         WHERE pm.project_id = $1
         UNION SELECT created_by FROM projects WHERE id = $1
         LIMIT 5`, [pid]
    );
    if (!users.length) return;

    const titles = [
        'Set up authentication service',
        'Design database schema for analytics',
        'Implement REST API endpoints',
        'Create dashboard UI components',
        'Integrate Jira webhooks',
        '[BUG] Fix login session expiry under load',
        'Write unit tests for analytics engine',
        'Deploy to staging environment',
        'Optimise slow SQL queries',
        'Code review and documentation pass',
    ];

    const statuses = ['todo', 'todo', 'in_progress', 'in_progress', 'in_review', 'blocked', 'done', 'done', 'in_progress', 'todo'];
    for (let i = 0; i < 10; i++) {
        const status = statuses[i];
        const est = round2(rand(2, 16));
        const act = status === 'done' ? round2(est * rand(0.8, 1.3)) : round2(est * rand(0.1, 0.6));
        const dueOff = randInt(5, 28);
        const ageD = randInt(0, 6);

        await client.query(`
            INSERT INTO tasks (project_id, title, status, priority, assigned_to,
                               story_points, estimated_hours, actual_hours,
                               due_date, completed_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
                    CURRENT_DATE + $9::int,
                    ${status === 'done' ? 'NOW()' : 'NULL'},
                    NOW() - ($10::int * INTERVAL '1 day'))
        `, [
            pid, titles[i], status,
            pick(['low', 'medium', 'high', 'critical']),
            pick(users).id,
            pick([1, 2, 3, 5, 8]),
            est, act, dueOff, ageD
        ]);
    }
    console.log(`    🌱 Seeded 10 tasks for project#${pid}`);
}

async function seedGitHubMapping(client, pid) {
    const { rows } = await client.query('SELECT project_key FROM projects WHERE id=$1', [pid]);
    const key = (rows[0]?.project_key || `proj${pid}`).toLowerCase().replace(/\s+/g, '-');
    const res = await client.query(`
        INSERT INTO github_mapping (project_id, repo_name, repo_url, repo_full_name, default_branch)
        VALUES ($1,$2,$3,$4,'main')
        ON CONFLICT DO NOTHING RETURNING id`, [pid, `${key}-repo`, `https://github.com/org/${key}-repo`, `org/${key}-repo`]
    );
    if (res.rows[0]) {
        console.log(`    🔗 Seeded GitHub mapping for project#${pid}`);
        return res.rows[0].id;
    }
    // may have existed — fetch it
    const existing = await client.query('SELECT id FROM github_mapping WHERE project_id=$1 LIMIT 1', [pid]);
    return existing.rows[0]?.id || null;
}

function genSha() {
    return [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// ── Boot ───────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   🔄  Mock Data Refresher — ProjectPulse AI         ║');
console.log('║   Mutates all 7 AI factor inputs every 3 minutes    ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`\n  Start: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
console.log('  Press Ctrl+C to stop.\n');

refresh(); // immediate first run
const handle = setInterval(refresh, 3 * 60 * 1000);

process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping...');
    clearInterval(handle);
    await pool.end();
    process.exit(0);
});
