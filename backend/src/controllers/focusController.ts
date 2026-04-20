import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

const prisma = new PrismaClient();

// 创建专注会话
export const createFocusSessionValidation = [
  body('title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('标题不能超过100个字符'),
  body('mode')
    .notEmpty()
    .isIn(['COUNTDOWN', 'STOPWATCH'])
    .withMessage('计时模式必须是 COUNTDOWN 或 STOPWATCH'),
  body('expectedDuration')
    .optional()
    .isInt({ min: 60, max: 14400 })
    .withMessage('预期时长必须在60秒到4小时之间'),
];

export const createFocusSession = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.userId!;
    const { title, mode, expectedDuration } = req.body;

    const session = await prisma.focusSession.create({
      data: {
        userId,
        title: title || '未命名专注',
        startTime: new Date(),
        mode,
        expectedDuration: expectedDuration || null,
        duration: 0,
        isCompleted: false,
        isAbandoned: false,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: session.id,
        title: session.title,
        startTime: session.startTime,
        mode: session.mode,
        expectedDuration: session.expectedDuration,
      },
    });
  } catch (error) {
    console.error('创建专注会话失败:', error);
    res.status(500).json({ success: false, message: '创建专注会话失败' });
  }
};

// 更新专注会话（结束专注）
export const updateFocusSessionValidation = [
  param('id').isInt().withMessage('会话ID必须是整数'),
  body('endTime').notEmpty().isISO8601().withMessage('结束时间格式不正确'),
  body('duration')
    .notEmpty()
    .isInt({ min: 0, max: 14400 })
    .withMessage('专注时长必须在0到4小时之间'),
  body('isCompleted').isBoolean().withMessage('isCompleted必须是布尔值'),
  body('isAbandoned').optional().isBoolean().withMessage('isAbandoned必须是布尔值'),
  body('interruptReason')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('打断原因不能超过200个字符'),
];

export const updateFocusSession = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.userId!;
    const sessionId = parseInt(req.params.id);
    const { endTime, duration, isCompleted, isAbandoned, interruptReason } = req.body;

    // 验证会话属于当前用户
    const existingSession = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!existingSession) {
      return res.status(404).json({ success: false, message: '专注会话不存在' });
    }

    const session = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(endTime),
        duration,
        isCompleted,
        isAbandoned: isAbandoned || false,
        interruptReason: interruptReason || null,
      },
    });

    res.json({
      success: true,
      data: {
        id: session.id,
        title: session.title,
        duration: session.duration,
        isCompleted: session.isCompleted,
        endTime: session.endTime,
      },
    });
  } catch (error) {
    console.error('更新专注会话失败:', error);
    res.status(500).json({ success: false, message: '更新专注会话失败' });
  }
};

// 获取专注历史列表
export const getFocusSessionsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('mode').optional().isIn(['COUNTDOWN', 'STOPWATCH']).withMessage('无效的计时模式'),
];

export const getFocusSessions = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const mode = req.query.mode as string | undefined;

    const where: any = { userId };
    if (mode) {
      where.mode = mode;
    }

    const [sessions, total] = await Promise.all([
      prisma.focusSession.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.focusSession.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取专注历史失败:', error);
    res.status(500).json({ success: false, message: '获取专注历史失败' });
  }
};

// 获取专注统计数据
export const getFocusStatsValidation = [
  query('period')
    .optional()
    .isIn(['WEEK', 'MONTH', 'YEAR', 'ALL'])
    .withMessage('统计周期必须是 WEEK、MONTH、YEAR 或 ALL'),
];

export const getFocusStats = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || 'ALL';

    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'WEEK':
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'MONTH':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'YEAR':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      default:
        startDate = new Date(0);
        break;
    }

    // 获取该时间段内的所有专注记录
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        isCompleted: true,
        isAbandoned: false,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 计算统计数据
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;
    const dailyAverage =
      period === 'ALL'
        ? totalDuration / Math.max(1, Math.ceil((Date.now() - sessions[0]?.startTime.getTime() || 0) / (1000 * 60 * 60 * 24)))
        : totalDuration / Math.max(1, Math.min(sessions.length, period === 'WEEK' ? 7 : period === 'MONTH' ? 30 : 365));

    // 按标题分类统计
    const titleMap = new Map<string, number>();
    sessions.forEach((s) => {
      const current = titleMap.get(s.title) || 0;
      titleMap.set(s.title, current + s.duration);
    });

    const distribution = Array.from(titleMap.entries())
      .map(([title, duration]) => ({
        title,
        duration,
        percentage: totalDuration > 0 ? Math.round((duration / totalDuration) * 100) : 0,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    // 计算连续专注天数
    const uniqueDays = new Set(
      sessions.map((s) => s.startTime.toISOString().split('T')[0])
    );
    const sortedDays = Array.from(uniqueDays).sort();
    let streakDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDays[i - 1]);
        const currDate = new Date(sortedDays[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);

    // 检查今天是否专注过
    const today = new Date().toISOString().split('T')[0];
    streakDays = sortedDays.includes(today) ? currentStreak : 0;

    // 获取最近7天的趋势
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = date.toISOString().split('T')[0];
      const dayDuration = sessions
        .filter((s) => s.startTime.toISOString().split('T')[0] === dateStr)
        .reduce((sum, s) => sum + s.duration, 0);
      dailyTrend.push({
        date: dateStr,
        duration: dayDuration,
      });
    }

    res.json({
      success: true,
      data: {
        totalDuration,
        totalSessions,
        dailyAverage: Math.round(dailyAverage),
        streakDays,
        maxStreak,
        distribution,
        dailyTrend,
      },
    });
  } catch (error) {
    console.error('获取专注统计失败:', error);
    res.status(500).json({ success: false, message: '获取专注统计失败' });
  }
};

// 获取专注时长排行榜
export const getFocusLeaderboardValidation = [
  query('period')
    .optional()
    .isIn(['DAY', 'WEEK', 'MONTH', 'YEAR'])
    .withMessage('统计周期必须是 DAY、WEEK、MONTH 或 YEAR'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
];

export const getFocusLeaderboard = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || 'WEEK';
    const limit = parseInt(req.query.limit as string) || 50;

    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'DAY':
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
        break;
      case 'WEEK':
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'MONTH':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'YEAR':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      default:
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    }

    // 使用原始查询获取排行榜数据
    const rankings = await prisma.$queryRaw<
      {
        userId: number;
        username: string;
        totalDuration: number;
        sessionCount: number;
      }[]
    >`
      SELECT
        u.id as userId,
        u.username,
        COALESCE(SUM(fs.duration), 0) as totalDuration,
        COUNT(fs.id) as sessionCount
      FROM users u
      LEFT JOIN focus_sessions fs ON u.id = fs.user_id
        AND fs.is_completed = 1
        AND fs.is_abandoned = 0
        AND fs.start_time >= ${startDate}
        AND fs.start_time <= ${endDate}
      GROUP BY u.id, u.username
      HAVING totalDuration > 0
      ORDER BY totalDuration DESC
      LIMIT ${limit}
    `;

    // 获取当前用户的排名
    const currentUserRank = await prisma.$queryRaw<
      { rank: number; totalDuration: number; sessionCount: number }[]
    >`
      SELECT
        (
          SELECT COUNT(*) + 1
          FROM (
            SELECT user_id, SUM(duration) as total
            FROM focus_sessions
            WHERE is_completed = 1 AND is_abandoned = 0
              AND start_time >= ${startDate} AND start_time <= ${endDate}
            GROUP BY user_id
            HAVING total > (
              SELECT COALESCE(SUM(duration), 0)
              FROM focus_sessions
              WHERE user_id = ${userId} AND is_completed = 1 AND is_abandoned = 0
                AND start_time >= ${startDate} AND start_time <= ${endDate}
            )
          ) t
        ) as rank,
        COALESCE(SUM(duration), 0) as totalDuration,
        COUNT(id) as sessionCount
      FROM focus_sessions
      WHERE user_id = ${userId} AND is_completed = 1 AND is_abandoned = 0
        AND start_time >= ${startDate} AND start_time <= ${endDate}
    `;

    // 格式化排行榜数据
    const formattedRankings = rankings.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      username: r.username,
      totalDuration: Number(r.totalDuration),
      sessionCount: Number(r.sessionCount),
      isCurrentUser: r.userId === userId,
    }));

    res.json({
      success: true,
      data: {
        period,
        rankings: formattedRankings,
        currentUser: currentUserRank[0]?.totalDuration
          ? {
              rank: Number(currentUserRank[0].rank),
              totalDuration: Number(currentUserRank[0].totalDuration),
              sessionCount: Number(currentUserRank[0].sessionCount),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('获取专注排行榜失败:', error);
    res.status(500).json({ success: false, message: '获取专注排行榜失败' });
  }
};
