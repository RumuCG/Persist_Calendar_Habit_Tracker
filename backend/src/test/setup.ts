import { prisma } from '../lib/prisma';

// 全局测试设置
beforeAll(async () => {
  // 确保测试环境
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-characters-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-characters';
});

// 每个测试后清理数据
afterEach(async () => {
  // 清理测试数据
  await prisma.refreshToken.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
});

// 所有测试完成后断开连接
afterAll(async () => {
  await prisma.$disconnect();
});
