import pool from '../config/database.js';
import logger from '../utils/logger.js';

export class UserModel {
  // Create a new user
  static async create(userData) {
    const {
      name,
      email,
      role = 'developer',
      password
    } = userData;

    try {
      const query = `
        INSERT INTO users (name, email, role, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
      `;
      
      const values = [name, email, role, password];
      const result = await pool.query(query, values);
      
      logger.info(`User created: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Get all users
  static async getAll() {
    try {
      const query = `
        SELECT id, name, email, role, created_at 
        FROM users 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getById(id) {
    try {
      const query = `
        SELECT id, name, email, role, created_at 
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get user by email
  static async getByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user by email:', error);
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic query
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    try {
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, role, created_at
      `;
      
      const result = await pool.query(query, values);
      logger.info(`User updated: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING id, name, email, role';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length > 0) {
        logger.info(`User deleted: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get users by role
  static async getByRole(role) {
    try {
      const query = `
        SELECT id, name, email, role, created_at 
        FROM users 
        WHERE role = $1
        ORDER BY name ASC
      `;
      const result = await pool.query(query, [role]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND password = $2';
      const result = await pool.query(query, [email, password]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  // Add user to project
  static async addToProject(userId, projectId, role = 'member') {
    try {
      const query = `
        INSERT INTO project_members (user_id, project_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, project_id) DO UPDATE SET role = $3
        RETURNING *
      `;
      
      const values = [userId, projectId, role];
      const result = await pool.query(query, values);
      
      logger.info(`User ${userId} added to project ${projectId} with role ${role}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding user to project:', error);
      throw error;
    }
  }

  // Get project members
  static async getProjectMembers(projectId) {
    try {
      const query = `
        SELECT u.id, u.name, u.email, u.role as user_role, pm.role as project_role
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = $1
        ORDER BY pm.added_at ASC
      `;
      const result = await pool.query(query, [projectId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching project members:', error);
      throw error;
    }
  }
}
