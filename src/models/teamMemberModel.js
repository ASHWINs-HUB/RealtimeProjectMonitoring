// src/models/teamMemberModel.js
const pool = require('../config/db');

const TeamMemberModel = {
  async add({ project_id, github_username }) {
    const res = await pool.query(
      'INSERT INTO team_members (project_id, github_username) VALUES ($1, $2) RETURNING *',
      [project_id, github_username]
    );
    return res.rows[0];
  },
  async findByProject(project_id) {
    const res = await pool.query('SELECT * FROM team_members WHERE project_id = $1', [project_id]);
    return res.rows;
  },
};

module.exports = TeamMemberModel;
