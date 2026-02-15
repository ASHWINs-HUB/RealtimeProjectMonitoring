// src/models/projectModel.js
const pool = require('../config/db');

const ProjectModel = {
  async create({ jira_project_key, jira_project_name, github_repo_name, github_repo_url, status, created_by }) {
    const res = await pool.query(
      `INSERT INTO projects (jira_project_key, jira_project_name, github_repo_name, github_repo_url, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [jira_project_key, jira_project_name, github_repo_name, github_repo_url, status, created_by]
    );
    return res.rows[0];
  },
  async findById(id) {
    const res = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return res.rows[0];
  },
  async updateStatus(id, status) {
    const res = await pool.query('UPDATE projects SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return res.rows[0];
  },
  async all() {
    const res = await pool.query('SELECT * FROM projects');
    return res.rows;
  },
};

module.exports = ProjectModel;
