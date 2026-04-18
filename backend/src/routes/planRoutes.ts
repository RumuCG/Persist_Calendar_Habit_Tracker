import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  toggleComplete,
  getPlansValidation,
  createPlanValidation,
  updatePlanValidation,
  planIdValidation,
  toggleCompleteValidation,
  getUserStats,
  getLeaderboard,
  leaderboardValidation,
  getDefaultTasks,
  createDefaultTask,
  updateDefaultTask,
  deleteDefaultTask,
  createDefaultTaskValidation,
  updateDefaultTaskValidation,
  defaultTaskIdValidation,
} from '../controllers/planController';

const router = Router();

// 所有计划路由都需要认证
router.use(authenticate);

// 计划列表和创建
router.get('/', getPlansValidation, getPlans);
router.post('/', createPlanValidation, createPlan);

// 用户统计
router.get('/stats/me', getUserStats);

// 排行榜（必须放在 /:id 路由之前）
router.get('/leaderboard', leaderboardValidation, getLeaderboard);

// 默认任务路由 - 必须放在 /:id 路由之前，否则会被当作 id 参数处理
router.get('/default', getDefaultTasks);
router.post('/default', createDefaultTaskValidation, createDefaultTask);
router.put('/default/:id', updateDefaultTaskValidation, updateDefaultTask);
router.delete('/default/:id', defaultTaskIdValidation, deleteDefaultTask);

// 单个计划操作
router.get('/:id', planIdValidation, getPlanById);
router.put('/:id', updatePlanValidation, updatePlan);
router.delete('/:id', planIdValidation, deletePlan);

// 切换完成状态
router.patch('/:id/complete', toggleCompleteValidation, toggleComplete);

export default router;
