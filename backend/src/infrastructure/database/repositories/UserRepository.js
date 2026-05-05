import pool from '../../../config/database.js';

export class UserRepository {
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        return result.rows[0];
    }

    async findById(id) {
        const userResult = await pool.query(
            'SELECT id, name, email, role, department, avatar_url, education, degree, experience_years, salary, skills_summary, reputation_score, created_at, last_login, is_active FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) return null;

        const user = userResult.rows[0];

        // Fetch achievements
        const achievementsResult = await pool.query(
            `SELECT a.code, a.name, a.description, a.xp_reward, ua.earned_at
             FROM achievements a
             JOIN user_achievements ua ON a.id = ua.achievement_id
             WHERE ua.user_id = $1`,
            [id]
        );

        user.badges = achievementsResult.rows;

        // Fetch skills
        const skillsResult = await pool.query(
            'SELECT skill_name, proficiency_level, total_xp FROM user_skills WHERE user_id = $1',
            [id]
        );
        user.skills = skillsResult.rows;

        return user;
    }

    async create(userData) {
        const { name, email, password, role, department } = userData;
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, department, created_at`,
            [name, email, password, role, department || null]
        );
        return result.rows[0];
    }

    async updateLastLogin(userId) {
        return pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );
    }

    async getAll(filters = {}) {
        const { role } = filters;
        let query = `
            SELECT 
                u.id, u.name, u.email, u.role, u.department, u.is_active, u.created_at,
                u.education, u.degree, u.experience_years, u.salary, u.skills_summary, u.reputation_score,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'code', a.code,
                        'name', a.name,
                        'description', a.description,
                        'xp_reward', a.xp_reward,
                        'earned_at', ua.earned_at
                    ))
                    FROM achievements a
                    JOIN user_achievements ua ON a.id = ua.achievement_id
                    WHERE ua.user_id = u.id),
                    '[]'
                ) as badges
            FROM users u
        `;
        const params = [];

        if (role) {
            query += ' WHERE u.role = $1';
            params.push(role);
        }

        query += ' ORDER BY name ASC';
        const result = await pool.query(query, params);
        return result.rows;
    }
    async updateRole(userId, role) {
        return pool.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
            [role, userId]
        );
    }

    async update(userId, userData) {
        const { name, email, department, is_active, education, degree, experience_years, salary, skills_summary } = userData;
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(name);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            params.push(email);
        }
        if (department !== undefined) {
            updates.push(`department = $${paramIndex++}`);
            params.push(department);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            params.push(is_active);
        }
        if (education !== undefined) {
            updates.push(`education = $${paramIndex++}`);
            params.push(education);
        }
        if (degree !== undefined) {
            updates.push(`degree = $${paramIndex++}`);
            params.push(degree);
        }
        if (experience_years !== undefined) {
            updates.push(`experience_years = $${paramIndex++}`);
            const years = parseInt(experience_years);
            params.push(isNaN(years) ? 0 : years);
        }
        if (salary !== undefined) {
            updates.push(`salary = $${paramIndex++}`);
            const sal = parseFloat(salary);
            params.push(isNaN(sal) ? 0 : sal);
        }
        if (skills_summary !== undefined) {
            updates.push(`skills_summary = $${paramIndex++}`);
            params.push(skills_summary);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, department, is_active, education, degree, experience_years, salary, skills_summary, created_at`;
        return pool.query(query, params);
    }

    async delete(userId) {
        return pool.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
    }
}

export const userRepository = new UserRepository();
