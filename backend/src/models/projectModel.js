import pool from '../config/database.js';
import logger from '../utils/logger.js';

export class ProjectModel {
  // Create a new project
  static async create(projectData) {
    const {
      name,
      description,
      status = 'Planning',
      progress = 0,
      risk = 0,
      deadline,
      repo_url,
      repo_name,
      project_key,
      team_leader,
      created_by
    } = projectData;

    try {
      const query = `
        INSERT INTO projects (name, description, status, progress, risk, deadline, repo_url, repo_name, project_key, team_leader, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [name, description, status, progress, risk, deadline, repo_url, repo_name, project_key, team_leader, created_by];
      const result = await pool.query(query, values);
      
      logger.info(`Project created: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  // Get all projects
  static async getAll() {
    try {
      const query = `
        SELECT p.*, u.name as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        ORDER BY p.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Get project by ID
  static async getById(id) {
    try {
      const query = `
        SELECT p.*, u.name as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching project:', error);
      throw error;
    }
  }

  // Update project
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
        UPDATE projects 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      logger.info(`Project updated: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating project:', error);
      throw error;
    }
  }

  // Delete project
  static async delete(id) {
    try {
      const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length > 0) {
        logger.info(`Project deleted: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Error deleting project:', error);
      throw error;
    }
  }

  // Get projects by user
  static async getByUser(userId) {
    try {
      const query = `
        SELECT p.*, u.name as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.created_by = $1 OR p.team_leader = $1
        ORDER BY p.created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user projects:', error);
      throw error;
    }
  }

  // Get project statistics
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'At Risk' THEN 1 END) as at_risk_projects,
          COUNT(CASE WHEN status = 'Delayed' THEN 1 END) as delayed_projects,
          AVG(progress) as average_progress,
          AVG(risk) as average_risk
        FROM projects
      `;
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching project statistics:', error);
      throw error;
    }
  }
}
