import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/password', changePassword);

export default router;