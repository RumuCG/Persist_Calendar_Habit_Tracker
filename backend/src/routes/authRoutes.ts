import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  refresh,
  getCurrentUser,
  registerValidation,
  loginValidation,
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 5, // 最多5次
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '登录尝试次数过多，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 公开路由
router.post('/register', registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/refresh', refresh);

// 需要认证的路由
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
