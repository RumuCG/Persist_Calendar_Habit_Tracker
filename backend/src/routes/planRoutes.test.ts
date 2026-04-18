import request from 'supertest';
import {
  createTestApp,
  registerTestUser,
  loginTestUser,
  createTestPlan,
} from '../test/helpers';

describe('Plan Routes - Integration Tests', () => {
  const app = createTestApp();

  describe('GET /api/plans', () => {
    it('应该返回计划列表', async () => {
      const { cookies } = await registerTestUser(app);

      // 创建一些计划
      await createTestPlan(app, cookies, { title: '计划1', date: '2024-01-15' });
      await createTestPlan(app, cookies, { title: '计划2', date: '2024-01-16' });

      const response = await request(app)
        .get('/api/plans')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plans).toHaveLength(2);
    });

    it('应该按日期范围过滤', async () => {
      const { cookies } = await registerTestUser(app);

      // 创建不同日期的计划
      await createTestPlan(app, cookies, { title: '计划1', date: '2024-01-10' });
      await createTestPlan(app, cookies, { title: '计划2', date: '2024-01-20' });

      const response = await request(app)
        .get('/api/plans?startDate=2024-01-15&endDate=2024-01-25')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.data.plans).toHaveLength(1);
      expect(response.body.data.plans[0].title).toBe('计划2');
    });

    it('未登录时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/plans');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/plans', () => {
    it('应该成功创建计划', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans')
        .set('Cookie', cookies)
        .send({
          title: '新计划',
          description: '计划描述',
          date: '2024-01-15',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan.title).toBe('新计划');
      expect(response.body.data.plan.description).toBe('计划描述');
      expect(response.body.data.plan.date).toBe('2024-01-15');
    });

    it('应该拒绝空标题', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans')
        .set('Cookie', cookies)
        .send({
          title: '',
          date: '2024-01-15',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝无效的日期格式', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans')
        .set('Cookie', cookies)
        .send({
          title: '新计划',
          date: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/plans/:id', () => {
    it('应该返回指定的计划', async () => {
      const { cookies } = await registerTestUser(app);
      const { planId } = await createTestPlan(app, cookies, { title: '特定计划' });

      const response = await request(app)
        .get(`/api/plans/${planId}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan.title).toBe('特定计划');
    });

    it('应该返回 404 当计划不存在', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .get('/api/plans/999999')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝访问其他用户的计划', async () => {
      // 用户 A 创建计划
      const userA = await registerTestUser(app, { username: 'usera', email: 'usera@example.com' });
      const { planId } = await createTestPlan(app, userA.cookies, { title: 'A的计划' });

      // 用户 B 尝试访问
      const userB = await registerTestUser(app, { username: 'userb', email: 'userb@example.com' });

      const response = await request(app)
        .get(`/api/plans/${planId}`)
        .set('Cookie', userB.cookies);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/plans/:id', () => {
    it('应该成功更新计划', async () => {
      const { cookies } = await registerTestUser(app);
      const { planId } = await createTestPlan(app, cookies);

      const response = await request(app)
        .put(`/api/plans/${planId}`)
        .set('Cookie', cookies)
        .send({
          title: '更新后的标题',
          description: '更新后的描述',
          date: '2024-02-01',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan.title).toBe('更新后的标题');
      expect(response.body.data.plan.date).toBe('2024-02-01');
    });

    it('应该拒绝更新其他用户的计划', async () => {
      const userA = await registerTestUser(app, { username: 'usera2', email: 'usera2@example.com' });
      const { planId } = await createTestPlan(app, userA.cookies);

      const userB = await registerTestUser(app, { username: 'userb2', email: 'userb2@example.com' });

      const response = await request(app)
        .put(`/api/plans/${planId}`)
        .set('Cookie', userB.cookies)
        .send({ title: '尝试更新' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/plans/:id', () => {
    it('应该成功删除计划', async () => {
      const { cookies } = await registerTestUser(app);
      const { planId } = await createTestPlan(app, cookies);

      const response = await request(app)
        .delete(`/api/plans/${planId}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(204);

      // 验证计划已被删除
      const getResponse = await request(app)
        .get(`/api/plans/${planId}`)
        .set('Cookie', cookies);

      expect(getResponse.status).toBe(404);
    });

    it('应该拒绝删除其他用户的计划', async () => {
      const userA = await registerTestUser(app, { username: 'usera3', email: 'usera3@example.com' });
      const { planId } = await createTestPlan(app, userA.cookies);

      const userB = await registerTestUser(app, { username: 'userb3', email: 'userb3@example.com' });

      const response = await request(app)
        .delete(`/api/plans/${planId}`)
        .set('Cookie', userB.cookies);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/plans/:id/complete', () => {
    it('应该标记计划为完成', async () => {
      const { cookies } = await registerTestUser(app);
      const { planId } = await createTestPlan(app, cookies);

      const response = await request(app)
        .patch(`/api/plans/${planId}/complete`)
        .set('Cookie', cookies)
        .send({ isCompleted: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan.isCompleted).toBe(true);
    });

    it('应该取消计划的完成状态', async () => {
      const { cookies } = await registerTestUser(app);
      const { planId } = await createTestPlan(app, cookies);

      // 先标记为完成
      await request(app)
        .patch(`/api/plans/${planId}/complete`)
        .set('Cookie', cookies)
        .send({ isCompleted: true });

      // 再取消完成
      const response = await request(app)
        .patch(`/api/plans/${planId}/complete`)
        .set('Cookie', cookies)
        .send({ isCompleted: false });

      expect(response.status).toBe(200);
      expect(response.body.data.plan.isCompleted).toBe(false);
    });

    it('应该拒绝操作其他用户的计划', async () => {
      const userA = await registerTestUser(app, { username: 'usera4', email: 'usera4@example.com' });
      const { planId } = await createTestPlan(app, userA.cookies);

      const userB = await registerTestUser(app, { username: 'userb4', email: 'userb4@example.com' });

      const response = await request(app)
        .patch(`/api/plans/${planId}/complete`)
        .set('Cookie', userB.cookies)
        .send({ isCompleted: true });

      expect(response.status).toBe(404);
    });
  });

  // ============= 默认任务集成测试 =============

  describe('GET /api/plans/default', () => {
    it('应该返回默认任务列表', async () => {
      const { cookies } = await registerTestUser(app);

      // 创建一些默认任务
      await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({ title: '默认任务1', description: '描述1' });

      await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({ title: '默认任务2', description: '描述2' });

      const response = await request(app)
        .get('/api/plans/default')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.defaultTasks).toHaveLength(2);
      expect(response.body.data.defaultTasks[0].title).toBe('默认任务1');
      expect(response.body.data.defaultTasks[1].title).toBe('默认任务2');
    });

    it('未登录时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/plans/default');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('应该只返回当前用户的默认任务', async () => {
      // 用户A创建默认任务
      const userA = await registerTestUser(app, { username: 'usera_default', email: 'usera_default@example.com' });
      await request(app)
        .post('/api/plans/default')
        .set('Cookie', userA.cookies)
        .send({ title: 'A的默认任务' });

      // 用户B获取默认任务列表
      const userB = await registerTestUser(app, { username: 'userb_default', email: 'userb_default@example.com' });
      const response = await request(app)
        .get('/api/plans/default')
        .set('Cookie', userB.cookies);

      expect(response.status).toBe(200);
      expect(response.body.data.defaultTasks).toHaveLength(0);
    });
  });

  describe('POST /api/plans/default', () => {
    it('应该成功创建默认任务', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({
          title: '每日晨读',
          description: '每天早上阅读30分钟',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe('每日晨读');
      expect(response.body.data.task.description).toBe('每天早上阅读30分钟');
    });

    it('应该成功创建没有描述的默认任务', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({
          title: '简单默认任务',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.title).toBe('简单默认任务');
      expect(response.body.data.task.description).toBeNull();
    });

    it('应该拒绝空标题', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({
          title: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝超过200字符的标题', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({
          title: 'a'.repeat(201),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('未登录时应该返回 401', async () => {
      const response = await request(app)
        .post('/api/plans/default')
        .send({
          title: '默认任务',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/plans/default/:id', () => {
    it('应该成功更新默认任务', async () => {
      const { cookies } = await registerTestUser(app);

      // 先创建默认任务
      const createResponse = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({ title: '原始标题', description: '原始描述' });

      const taskId = createResponse.body.data.task.id;

      // 更新默认任务
      const response = await request(app)
        .put(`/api/plans/default/${taskId}`)
        .set('Cookie', cookies)
        .send({
          title: '更新后的标题',
          description: '更新后的描述',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe('更新后的标题');
      expect(response.body.data.task.description).toBe('更新后的描述');
    });

    it('应该部分更新默认任务', async () => {
      const { cookies } = await registerTestUser(app);

      const createResponse = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({ title: '原始标题', description: '原始描述' });

      const taskId = createResponse.body.data.task.id;

      const response = await request(app)
        .put(`/api/plans/default/${taskId}`)
        .set('Cookie', cookies)
        .send({ title: '只更新标题' });

      expect(response.status).toBe(200);
      expect(response.body.data.task.title).toBe('只更新标题');
      expect(response.body.data.task.description).toBe('原始描述');
    });

    it('应该返回 404 当默认任务不存在', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .put('/api/plans/default/999999')
        .set('Cookie', cookies)
        .send({ title: '尝试更新' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝更新其他用户的默认任务', async () => {
      // 用户A创建默认任务
      const userA = await registerTestUser(app, { username: 'usera_update', email: 'usera_update@example.com' });
      const createResponse = await request(app)
        .post('/api/plans/default')
        .set('Cookie', userA.cookies)
        .send({ title: 'A的默认任务' });
      const taskId = createResponse.body.data.task.id;

      // 用户B尝试更新
      const userB = await registerTestUser(app, { username: 'userb_update', email: 'userb_update@example.com' });
      const response = await request(app)
        .put(`/api/plans/default/${taskId}`)
        .set('Cookie', userB.cookies)
        .send({ title: '尝试更新' });

      expect(response.status).toBe(404);
    });

    it('应该拒绝空标题', async () => {
      const { cookies } = await registerTestUser(app);

      const createResponse = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({ title: '原始标题' });
      const taskId = createResponse.body.data.task.id;

      const response = await request(app)
        .put(`/api/plans/default/${taskId}`)
        .set('Cookie', cookies)
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/plans/default/:id', () => {
    it('应该成功删除默认任务', async () => {
      const { cookies } = await registerTestUser(app);

      // 先创建默认任务
      const createResponse = await request(app)
        .post('/api/plans/default')
        .set('Cookie', cookies)
        .send({ title: '要删除的默认任务' });

      const taskId = createResponse.body.data.task.id;

      // 删除默认任务
      const response = await request(app)
        .delete(`/api/plans/default/${taskId}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 验证任务已被删除
      const getResponse = await request(app)
        .get('/api/plans/default')
        .set('Cookie', cookies);

      expect(getResponse.body.data.defaultTasks).toHaveLength(0);
    });

    it('应该返回 404 当默认任务不存在', async () => {
      const { cookies } = await registerTestUser(app);

      const response = await request(app)
        .delete('/api/plans/default/999999')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝删除其他用户的默认任务', async () => {
      // 用户A创建默认任务
      const userA = await registerTestUser(app, { username: 'usera_delete', email: 'usera_delete@example.com' });
      const createResponse = await request(app)
        .post('/api/plans/default')
        .set('Cookie', userA.cookies)
        .send({ title: 'A的默认任务' });
      const taskId = createResponse.body.data.task.id;

      // 用户B尝试删除
      const userB = await registerTestUser(app, { username: 'userb_delete', email: 'userb_delete@example.com' });
      const response = await request(app)
        .delete(`/api/plans/default/${taskId}`)
        .set('Cookie', userB.cookies);

      expect(response.status).toBe(404);
    });
  });
});
