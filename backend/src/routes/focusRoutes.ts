import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createFocusSession,
  createFocusSessionValidation,
  updateFocusSession,
  updateFocusSessionValidation,
  getFocusSessions,
  getFocusSessionsValidation,
  getFocusStats,
  getFocusStatsValidation,
  getFocusLeaderboard,
  getFocusLeaderboardValidation,
} from '../controllers/focusController';

const router = Router();

// 所有专注模式路由都需要认证
router.use(authenticate);

// 专注会话管理
router.post('/', createFocusSessionValidation, createFocusSession);
router.get('/', getFocusSessionsValidation, getFocusSessions);
router.put('/:id', updateFocusSessionValidation, updateFocusSession);

// 统计数据
router.get('/stats', getFocusStatsValidation, getFocusStats);

// 排行榜
router.get('/leaderboard', getFocusLeaderboardValidation, getFocusLeaderboard);

export default router;
