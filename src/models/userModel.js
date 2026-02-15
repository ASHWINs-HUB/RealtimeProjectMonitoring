// src/models/userModel.js
const pool = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  },
  async create({ name, email, password, role }) {
    const res = await pool.query(
      'INSERT INTO users (name, email, password, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email, role',
      [name, email, password, role]
    );
    return res.rows[0];
  },
  async findById(id) {
    const res = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
    return res.rows[0];
  },
};

module.exports = UserModel;
