// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'All fields required' });
    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, password: hashed, role });
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ user, token });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ user: payload, token });
  } catch (err) { next(err); }
};
