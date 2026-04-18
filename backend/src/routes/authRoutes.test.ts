import request from 'supertest';
import { createTestApp, registerTestUser, loginTestUser } from '../test/helpers';

describe('Auth Routes - Integration Tests', () => {
  const app = createTestApp();

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('newuser');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.password).toBeUndefined();

      // 验证设置了 Cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝短密码', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝重复邮箱', async () => {
      // 先注册一个用户
      await registerTestUser(app, {
        email: 'duplicate@example.com',
        username: 'user1',
      });

      // 尝试使用相同邮箱注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录', async () => {
      const { email, password } = await registerTestUser(app, {
        email: 'login@example.com',
        username: 'logintest',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();

      // 验证设置了 Cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('应该拒绝错误的密码', async () => {
      const { email } = await registerTestUser(app, {
        email: 'wrongpass@example.com',
        username: 'wrongpasstest',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝不存在的邮箱', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('应该限制登录尝试频率', async () => {
      const email = `ratelimit_${Date.now()}@example.com`;
      await registerTestUser(app, { email, username: 'ratelimit' });

      // 快速发送多次登录请求
      const promises = [];
      for (let i = 0; i < 7; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({ email, password: 'wrongpass' })
        );
      }

      const responses = await Promise.all(promises);

      // 至少有一个请求应该被限制
      const hasRateLimit = responses.some(r => r.status === 429);
      expect(hasRateLimit).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('应该成功登出', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('未登录时应该返回成功', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('应该成功刷新 token', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 验证设置了新的 Cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('没有 refresh token 时应该失败', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('应该返回当前用户信息', async () => {
      const { cookies, username, email } = await registerTestUser(app);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(username);
      expect(response.body.data.user.email).toBe(email);
    });

    it('未登录时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('无效 token 时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['access_token=invalid_token']);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
