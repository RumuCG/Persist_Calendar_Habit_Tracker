import * as authService from './authService';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

describe('AuthService', () => {
  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const data = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      };

      const result = await authService.register(data);

      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(data.username);
      expect(result.user.email).toBe(data.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // 验证数据库中创建了用户
      const dbUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      expect(dbUser).toBeDefined();
    });

    it('应该拒绝重复的邮箱', async () => {
      const data = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'TestPass123!',
      };

      await authService.register(data);

      await expect(
        authService.register({
          ...data,
          username: 'testuser2',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝重复的用户名', async () => {
      const data = {
        username: 'duplicateuser',
        email: 'test1@example.com',
        password: 'TestPass123!',
      };

      await authService.register(data);

      await expect(
        authService.register({
          ...data,
          email: 'test2@example.com',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('login', () => {
    it('应该成功登录', async () => {
      // 先注册
      const registerData = {
        username: 'logintest',
        email: 'login@example.com',
        password: 'TestPass123!',
      };
      await authService.register(registerData);

      // 再登录
      const result = await authService.login({
        email: registerData.email,
        password: registerData.password,
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('应该拒绝错误的邮箱', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝错误的密码', async () => {
      // 先注册
      const registerData = {
        username: 'wrongpasstest',
        email: 'wrongpass@example.com',
        password: 'TestPass123!',
      };
      await authService.register(registerData);

      // 使用错误密码登录
      await expect(
        authService.login({
          email: registerData.email,
          password: 'WrongPass123!',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('logout', () => {
    it('应该成功登出并删除 refresh token', async () => {
      // 注册并登录
      const registerData = {
        username: 'logouttest',
        email: 'logout@example.com',
        password: 'TestPass123!',
      };
      const { user, refreshToken } = await authService.register(registerData);

      // 登出
      await authService.logout(user.id, refreshToken);

      // 验证 refresh token 被删除
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(storedToken).toBeNull();
    });

    it('应该删除用户的所有 refresh tokens', async () => {
      // 注册
      const registerData = {
        username: 'logoutalltest',
        email: 'logoutall@example.com',
        password: 'TestPass123!',
      };
      const { user } = await authService.register(registerData);

      // 登出所有
      await authService.logout(user.id);

      // 验证所有 token 被删除
      const tokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(tokens).toHaveLength(0);
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新 token', async () => {
      // 注册
      const registerData = {
        username: 'refreshtest',
        email: 'refresh@example.com',
        password: 'TestPass123!',
      };
      const { refreshToken } = await authService.register(registerData);

      // 刷新 token
      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken);
    });

    it('应该拒绝无效的 token', async () => {
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝过期的 token', async () => {
      // 创建一个过期的 token 记录
      const user = await prisma.user.create({
        data: {
          username: 'expiredtoken',
          email: 'expired@example.com',
          passwordHash: 'hashedpassword',
        },
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: 'expired-refresh-token',
          expiresAt: new Date(Date.now() - 1000), // 已过期
        },
      });

      await expect(
        authService.refreshToken('expired-refresh-token')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getCurrentUser', () => {
    it('应该返回当前用户信息', async () => {
      // 注册
      const registerData = {
        username: 'getcurrenttest',
        email: 'getcurrent@example.com',
        password: 'TestPass123!',
      };
      const { user } = await authService.register(registerData);

      // 获取当前用户
      const currentUser = await authService.getCurrentUser(user.id);

      expect(currentUser.id).toBe(user.id);
      expect(currentUser.username).toBe(registerData.username);
      expect(currentUser.email).toBe(registerData.email);
    });

    it('应该拒绝不存在的用户', async () => {
      await expect(
        authService.getCurrentUser(999999)
      ).rejects.toThrow(ApiError);
    });
  });
});
