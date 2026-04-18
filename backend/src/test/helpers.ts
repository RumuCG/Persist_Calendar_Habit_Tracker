import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import authRoutes from '../routes/authRoutes';
import planRoutes from '../routes/planRoutes';

/**
 * 创建测试用的 Express 应用
 */
export function createTestApp() {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API 路由
  app.use('/api/auth', authRoutes);
  app.use('/api/plans', planRoutes);

  // 404 和错误处理
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * 注册测试用户并返回用户信息
 */
export async function registerTestUser(
  app: express.Application,
  userData: {
    username?: string;
    email?: string;
    password?: string;
  } = {}
): Promise<{
  username: string;
  email: string;
  password: string;
  userId: number | undefined;
  response: request.Response;
  cookies: string[];
}> {
  const timestamp = Date.now().toString(36); // 使用36进制缩短长度
  const defaultData = {
    username: `tu_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'TestPass123!',
  };

  const data = { ...defaultData, ...userData };

  const response = await request(app)
    .post('/api/auth/register')
    .send(data);

  const rawCookies = response.headers['set-cookie'];

  return {
    ...data,
    userId: response.body.data?.user?.id,
    response,
    cookies: Array.isArray(rawCookies) ? rawCookies : (rawCookies ? [rawCookies] : []),
  };
}

/**
 * 登录测试用户
 */
export async function loginTestUser(
  app: express.Application,
  email: string,
  password: string = 'TestPass123!'
): Promise<{
  response: request.Response;
  cookies: string[];
  user: any;
}> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const rawCookies = response.headers['set-cookie'];

  return {
    response,
    cookies: Array.isArray(rawCookies) ? rawCookies : (rawCookies ? [rawCookies] : []),
    user: response.body.data?.user,
  };
}

/**
 * 创建测试计划
 */
export async function createTestPlan(
  app: express.Application,
  cookies: string[],
  planData: {
    title?: string;
    description?: string;
    date?: string;
  } = {}
): Promise<{
  title: string;
  description: string;
  date: string;
  planId: number | undefined;
  response: request.Response;
}> {
  const defaultData = {
    title: '测试计划',
    description: '这是一个测试计划',
    date: new Date().toISOString().split('T')[0],
  };

  const data = { ...defaultData, ...planData };

  const response = await request(app)
    .post('/api/plans')
    .set('Cookie', cookies)
    .send(data);

  return {
    ...data,
    planId: response.body.data?.plan?.id,
    response,
  };
}
