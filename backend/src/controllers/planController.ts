import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as planService from '../services/planService';
import { ApiError } from '../utils/ApiError';

// 验证规则
export const createPlanValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('计划标题不能为空')
    .isLength({ max: 200 })
    .withMessage('计划标题不能超过200个字符'),
  body('description')
    .optional()
    .trim(),
  body('date')
    .notEmpty()
    .withMessage('日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('日期格式不正确，请使用 YYYY-MM-DD 格式'),
];

export const updatePlanValidation = [
  param('id')
    .isInt()
    .withMessage('计划ID必须是整数'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('计划标题不能为空')
    .isLength({ max: 200 })
    .withMessage('计划标题不能超过200个字符'),
  body('description')
    .optional()
    .trim(),
  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('日期格式不正确，请使用 YYYY-MM-DD 格式'),
];

export const planIdValidation = [
  param('id')
    .isInt()
    .withMessage('计划ID必须是整数'),
];

export const getPlansValidation = [
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('开始日期格式不正确，请使用 YYYY-MM-DD 格式'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('结束日期格式不正确，请使用 YYYY-MM-DD 格式'),
];

export const toggleCompleteValidation = [
  param('id')
    .isInt()
    .withMessage('计划ID必须是整数'),
  body('isCompleted')
    .isBoolean()
    .withMessage('isCompleted 必须是布尔值'),
];

export const leaderboardValidation = [
  query('period')
    .optional()
    .isIn(['daily', 'monthly', 'yearly'])
    .withMessage('period 必须是 daily、monthly 或 yearly'),
];

export const createDefaultTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('默认任务标题不能为空')
    .isLength({ max: 200 })
    .withMessage('默认任务标题不能超过200个字符'),
  body('description')
    .optional()
    .trim(),
];

export const updateDefaultTaskValidation = [
  param('id')
    .isInt()
    .withMessage('任务ID必须是整数'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('默认任务标题不能为空')
    .isLength({ max: 200 })
    .withMessage('默认任务标题不能超过200个字符'),
  body('description')
    .optional()
    .trim(),
];

export const defaultTaskIdValidation = [
  param('id')
    .isInt()
    .withMessage('任务ID必须是整数'),
];

/**
 * 获取计划列表
 */
export async function getPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const plans = await planService.getPlans(userId, startDate, endDate);

    res.json({
      success: true,
      data: {
        plans,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取单个计划
 */
export async function getPlanById(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const planId = parseInt(req.params.id, 10);

    const plan = await planService.getPlanById(userId, planId);

    res.json({
      success: true,
      data: {
        plan,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建计划
 */
export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const { title, description, date } = req.body;

    const plan = await planService.createPlan(userId, {
      title,
      description,
      date,
    });

    res.status(201).json({
      success: true,
      data: {
        plan,
      },
      message: '计划创建成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新计划
 */
export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const planId = parseInt(req.params.id, 10);
    const { title, description, date } = req.body;

    const plan = await planService.updatePlan(userId, planId, {
      title,
      description,
      date,
    });

    res.json({
      success: true,
      data: {
        plan,
      },
      message: '计划更新成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除计划
 */
export async function deletePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const planId = parseInt(req.params.id, 10);

    await planService.deletePlan(userId, planId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * 切换计划完成状态
 */
export async function toggleComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const planId = parseInt(req.params.id, 10);
    const { isCompleted } = req.body;

    const plan = await planService.toggleComplete(userId, planId, isCompleted);

    res.json({
      success: true,
      data: {
        plan,
      },
      message: isCompleted ? '计划已完成' : '计划已取消完成',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const stats = await planService.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取排行榜
 */
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const period = (req.query.period as 'daily' | 'monthly' | 'yearly') || 'daily';
    const leaderboard = await planService.getLeaderboard(period);

    res.json({
      success: true,
      data: {
        leaderboard,
        period,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============= 默认任务控制器 =============

/**
 * 获取默认任务列表
 */
export async function getDefaultTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const defaultTasks = await planService.getDefaultTasks(userId);

    res.json({
      success: true,
      data: {
        defaultTasks,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建默认任务
 */
export async function createDefaultTask(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const { title, description } = req.body;

    const task = await planService.createDefaultTask(userId, {
      title,
      description,
    });

    res.status(201).json({
      success: true,
      data: {
        task,
      },
      message: '默认任务创建成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新默认任务
 */
export async function updateDefaultTask(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const taskId = parseInt(req.params.id, 10);
    const { title, description } = req.body;

    const task = await planService.updateDefaultTask(userId, taskId, {
      title,
      description,
    });

    res.json({
      success: true,
      data: {
        task,
      },
      message: '默认任务更新成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除默认任务
 */
export async function deleteDefaultTask(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const userId = req.userId!;
    const taskId = parseInt(req.params.id, 10);

    await planService.deleteDefaultTask(userId, taskId);

    res.json({
      success: true,
      message: '默认任务删除成功',
    });
  } catch (error) {
    next(error);
  }
}
