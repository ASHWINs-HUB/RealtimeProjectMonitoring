import { Router } from 'express';
import { register, login, getMe, getUsers, updateRole, verifyAdmin, adminCreateUser, updateUser, deleteUser } from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-admin', verifyAdmin);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, getUsers);
router.post('/users', authenticateToken, authorizeRoles('admin'), validateRegister, adminCreateUser);
router.put('/update-role', authenticateToken, authorizeRoles('admin'), updateRole);
router.put('/users/:id', authenticateToken, authorizeRoles('hr', 'manager'), updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('hr'), deleteUser);

export default router;
