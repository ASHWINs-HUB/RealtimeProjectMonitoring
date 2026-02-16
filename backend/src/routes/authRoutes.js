import { Router } from 'express';
import { register, login, getMe, getUsers } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, getUsers);

export default router;
