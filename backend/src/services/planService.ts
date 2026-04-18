import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export interface CreatePlanData {
  title: string;
  description?: string;
  date: string;
}

export interface UpdatePlanData {
  title?: string;
  description?: string;
  date?: string;
}

export interface CreateDefaultTaskData {
  title: string;
  description?: string;
}

export interface UpdateDefaultTaskData {
  title?: string;
  description?: string;
}

export interface UserStats {
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
  daily: { date: string; total: number; completed: number }[];
  monthly: { month: string; total: number; completed: number }[];
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
}

/**
 * 获取用户的计划列表
 */
export async function getPlans(
  userId: number,
  startDate?: string,
  endDate?: string
) {
  const where: {
    userId: number;
    date?: {
      gte?: Date;
      lte?: Date;
    };
    isDefault?: boolean;
  } = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  // 只获取非默认任务（普通计划）
  where.isDefault = false;

  const plans = await prisma.plan.findMany({
    where,
    orderBy: {
      date: 'asc',
    },
  });

  return plans.map(plan => ({
    id: plan.id,
    title: plan.title,
    description: plan.description,
    date: plan.date.toISOString().split('T')[0],
    isCompleted: plan.isCompleted,
    isDefault: plan.isDefault,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  }));
}

/**
 * 根据 ID 获取单个计划
 */
export async function getPlanById(userId: number, planId: number) {
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      userId,
    },
  });

  if (!plan) {
    throw ApiError.notFound('计划不存在');
  }

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    date: plan.date.toISOString().split('T')[0],
    isCompleted: plan.isCompleted,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(userId: number): Promise<UserStats> {
  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });

  const totalPlans = plans.length;
  const completedPlans = plans.filter(p => p.isCompleted).length;
  const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // 按日期分组（最近 30 天）
  const dailyMap = new Map<string, { total: number; completed: number }>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, { total: 0, completed: 0 });
  }

  plans.forEach(plan => {
    const dateStr = plan.date.toISOString().split('T')[0];
    if (dailyMap.has(dateStr)) {
      const entry = dailyMap.get(dateStr)!;
      entry.total++;
      if (plan.isCompleted) entry.completed++;
    }
  });

  const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    total: data.total,
    completed: data.completed,
  }));

  // 按月份分组（最近 12 个月）
  const monthlyMap = new Map<string, { total: number; completed: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthStr, { total: 0, completed: 0 });
  }

  plans.forEach(plan => {
    const dateStr = plan.date.toISOString().split('T')[0];
    const monthStr = dateStr.slice(0, 7);
    if (monthlyMap.has(monthStr)) {
      const entry = monthlyMap.get(monthStr)!;
      entry.total++;
      if (plan.isCompleted) entry.completed++;
    }
  });

  const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    total: data.total,
    completed: data.completed,
  }));

  return {
    totalPlans,
    completedPlans,
    completionRate,
    daily,
    monthly,
  };
}

/**
 * 获取排行榜
 */
export async function getLeaderboard(period: 'daily' | 'monthly' | 'yearly'): Promise<LeaderboardEntry[]> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear() + 1, 0, 1);
  }

  const plans = await prisma.plan.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  const userMap = new Map<number, { username: string; total: number; completed: number }>();

  plans.forEach(plan => {
    const userId = plan.userId;
    if (!userMap.has(userId)) {
      userMap.set(userId, { username: plan.user.username, total: 0, completed: 0 });
    }
    const entry = userMap.get(userId)!;
    entry.total++;
    if (plan.isCompleted) entry.completed++;
  });

  const leaderboard = Array.from(userMap.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    totalPlans: data.total,
    completedPlans: data.completed,
    completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  // 按完成率降序，完成率相同则按已完成数量排序
  leaderboard.sort((a, b) => {
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    return b.completedPlans - a.completedPlans;
  });

  return leaderboard;
}

/**
 * 创建计划
 */
export async function createPlan(userId: number, data: CreatePlanData) {
  // 验证标题
  if (!data.title || data.title.trim().length === 0) {
    throw new ApiError('VALIDATION_ERROR', '计划标题不能为空');
  }

  if (data.title.length > 200) {
    throw new ApiError('VALIDATION_ERROR', '计划标题不能超过200个字符');
  }

  // 验证日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式不正确，请使用 YYYY-MM-DD 格式');
  }

  const plan = await prisma.plan.create({
    data: {
      userId,
      title: data.title.trim(),
      description: data.description?.trim(),
      date: new Date(data.date),
    },
  });

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    date: plan.date.toISOString().split('T')[0],
    isCompleted: plan.isCompleted,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * 更新计划
 */
export async function updatePlan(
  userId: number,
  planId: number,
  data: UpdatePlanData
) {
  // 检查计划是否存在且属于当前用户
  const existingPlan = await prisma.plan.findFirst({
    where: {
      id: planId,
      userId,
    },
  });

  if (!existingPlan) {
    throw ApiError.notFound('计划不存在');
  }

  // 验证标题
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      throw new ApiError('VALIDATION_ERROR', '计划标题不能为空');
    }
    if (data.title.length > 200) {
      throw new ApiError('VALIDATION_ERROR', '计划标题不能超过200个字符');
    }
  }

  // 验证日期格式
  let date: Date | undefined;
  if (data.date !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      throw new ApiError('VALIDATION_ERROR', '日期格式不正确，请使用 YYYY-MM-DD 格式');
    }
    date = new Date(data.date);
  }

  const plan = await prisma.plan.update({
    where: {
      id: planId,
    },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
      ...(date !== undefined && { date }),
    },
  });

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    date: plan.date.toISOString().split('T')[0],
    isCompleted: plan.isCompleted,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * 删除计划
 */
export async function deletePlan(userId: number, planId: number) {
  // 检查计划是否存在且属于当前用户
  const existingPlan = await prisma.plan.findFirst({
    where: {
      id: planId,
      userId,
    },
  });

  if (!existingPlan) {
    throw ApiError.notFound('计划不存在');
  }

  await prisma.plan.delete({
    where: {
      id: planId,
    },
  });
}

/**
 * 切换计划完成状态
 */
export async function toggleComplete(
  userId: number,
  planId: number,
  isCompleted: boolean
) {
  // 检查计划是否存在且属于当前用户
  const existingPlan = await prisma.plan.findFirst({
    where: {
      id: planId,
      userId,
    },
  });

  if (!existingPlan) {
    throw ApiError.notFound('计划不存在');
  }

  const plan = await prisma.plan.update({
    where: {
      id: planId,
    },
    data: {
      isCompleted,
    },
  });

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    date: plan.date.toISOString().split('T')[0],
    isCompleted: plan.isCompleted,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

// ============= 默认任务相关函数 =============

/**
 * 获取用户的默认任务列表
 */
export async function getDefaultTasks(userId: number) {
  const defaultTasks = await prisma.plan.findMany({
    where: {
      userId,
      isDefault: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return defaultTasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    isCompleted: task.isCompleted,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));
}

/**
 * 创建默认任务
 */
export async function createDefaultTask(userId: number, data: CreateDefaultTaskData) {
  // 验证标题
  if (!data.title || data.title.trim().length === 0) {
    throw new ApiError('VALIDATION_ERROR', '默认任务标题不能为空');
  }

  if (data.title.length > 200) {
    throw new ApiError('VALIDATION_ERROR', '默认任务标题不能超过200个字符');
  }

  // 默认任务使用一个固定的未来日期，因为Prisma需要日期
  const defaultDate = new Date('2099-12-31');

  const task = await prisma.plan.create({
    data: {
      userId,
      title: data.title.trim(),
      description: data.description?.trim(),
      date: defaultDate,
      isDefault: true,
    },
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    isCompleted: task.isCompleted,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * 更新默认任务
 */
export async function updateDefaultTask(
  userId: number,
  taskId: number,
  data: UpdateDefaultTaskData
) {
  // 检查任务是否存在且属于当前用户且是默认任务
  const existingTask = await prisma.plan.findFirst({
    where: {
      id: taskId,
      userId,
      isDefault: true,
    },
  });

  if (!existingTask) {
    throw ApiError.notFound('默认任务不存在');
  }

  // 验证标题
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      throw new ApiError('VALIDATION_ERROR', '默认任务标题不能为空');
    }
    if (data.title.length > 200) {
      throw new ApiError('VALIDATION_ERROR', '默认任务标题不能超过200个字符');
    }
  }

  const task = await prisma.plan.update({
    where: {
      id: taskId,
    },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
    },
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    isCompleted: task.isCompleted,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * 删除默认任务
 */
export async function deleteDefaultTask(userId: number, taskId: number) {
  // 检查任务是否存在且属于当前用户且是默认任务
  const existingTask = await prisma.plan.findFirst({
    where: {
      id: taskId,
      userId,
      isDefault: true,
    },
  });

  if (!existingTask) {
    throw ApiError.notFound('默认任务不存在');
  }

  await prisma.plan.delete({
    where: {
      id: taskId,
    },
  });
}
