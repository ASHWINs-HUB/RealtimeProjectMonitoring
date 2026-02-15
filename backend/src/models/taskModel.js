import pool from '../config/database.js';
import logger from '../utils/logger.js';

export class TaskModel {
  // Create a new task
  static async create(taskData) {
    const {
      project_id,
      title,
      description,
      status = 'todo',
      assignee
    } = taskData;

    try {
      const query = `
        INSERT INTO tasks (project_id, title, description, status, assignee)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [project_id, title, description, status, assignee];
      const result = await pool.query(query, values);
      
      logger.info(`Task created: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  // Get all tasks for a project
  static async getByProject(projectId) {
    try {
      const query = `
        SELECT * FROM tasks 
        WHERE project_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [projectId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Get task by ID
  static async getById(id) {
    try {
      const query = 'SELECT * FROM tasks WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching task:', error);
      throw error;
    }
  }

  // Update task
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
        UPDATE tasks 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      logger.info(`Task updated: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  }

  // Delete task
  static async delete(id) {
    try {
      const query = 'DELETE FROM tasks WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length > 0) {
        logger.info(`Task deleted: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  }

  // Get task statistics for a project
  static async getProjectStats(projectId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks
        FROM tasks
        WHERE project_id = $1
      `;
      const result = await pool.query(query, [projectId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching task statistics:', error);
      throw error;
    }
  }

  // Get tasks by assignee
  static async getByAssignee(assignee) {
    try {
      const query = `
        SELECT t.*, p.name as project_name 
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.assignee = $1
        ORDER BY t.created_at DESC
      `;
      const result = await pool.query(query, [assignee]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching assignee tasks:', error);
      throw error;
    }
  }
}
