// src/models/projectModel.js
const pool = require('../config/db');

const ProjectModel = {
  async create({ jira_project_key, jira_project_name, github_repo_name, github_repo_url, status, created_by }) {
    const res = await pool.query(
      `INSERT INTO projects (name, description, repo_url, status, progress, risk, deadline, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [jira_project_name, 'New project', github_repo_name || null, status || 'PENDING', 0, 0, null]
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

  async updateGitHubRepo(id, repoUrl, repoName) {
    const res = await pool.query(
      'UPDATE projects SET repo_url = $1, repo_name = $2 WHERE id = $3 RETURNING *',
      [repoUrl, repoName, id]
    );
    return res.rows[0];
  },

  async all() {
    const res = await pool.query('SELECT * FROM projects');
    return res.rows;
  },

  // Offer management methods
  async createOffer(projectId, offerData) {
    const res = await pool.query(
      `INSERT INTO project_offers (project_id, offer_type, offer_details, status, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [projectId, offerData.type, offerData.details, 'PENDING']
    );
    return res.rows[0];
  },

  async getOffersByProject(projectId) {
    const res = await pool.query(
      'SELECT * FROM project_offers WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    return res.rows;
  },

  async updateOfferStatus(offerId, status) {
    const res = await pool.query(
      'UPDATE project_offers SET status = $1 WHERE id = $2 RETURNING *',
      [status, offerId]
    );
    return res.rows[0];
  },
};

module.exports = ProjectModel;
