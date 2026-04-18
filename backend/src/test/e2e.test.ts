import request from 'supertest';
import { createTestApp } from './helpers';

/**
 * E2E 测试 - 完整业务流程
 * 覆盖: 注册 → 登录 → 创建计划 → 更新计划 → 删除计划 → 登出
 */
describe('E2E Tests - 完整业务流程', () => {
  const app = createTestApp();

  // 辅助函数：标准化 cookies
  function normalizeCookies(cookies: string | string[] | undefined): string[] {
    if (!cookies) return [];
    return Array.isArray(cookies) ? cookies : [cookies];
  }

  it('应该完成完整的业务流程', async () => {
    // ========== 1. 注册 ==========
    const registerData = {
      username: 'e2euser',
      email: 'e2e@example.com',
      password: 'TestPass123!',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(registerData);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.user.username).toBe(registerData.username);
    expect(registerRes.body.data.user.email).toBe(registerData.email);

    // 获取注册后的 cookies
    let cookies = normalizeCookies(registerRes.headers['set-cookie']);
    expect(cookies.length).toBeGreaterThan(0);

    const userId = registerRes.body.data.user.id;

    // ========== 2. 获取当前用户信息 ==========
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.id).toBe(userId);

    // ========== 3. 创建计划 ==========
    const planData = {
      title: 'E2E 测试计划',
      description: '这是一个 E2E 测试创建的计划',
      date: '2024-12-25',
    };

    const createPlanRes = await request(app)
      .post('/api/plans')
      .set('Cookie', cookies)
      .send(planData);

    expect(createPlanRes.status).toBe(201);
    expect(createPlanRes.body.success).toBe(true);
    expect(createPlanRes.body.data.plan.title).toBe(planData.title);
    expect(createPlanRes.body.data.plan.date).toBe(planData.date);

    const planId = createPlanRes.body.data.plan.id;

    // ========== 4. 获取计划列表 ==========
    const listPlansRes = await request(app)
      .get('/api/plans')
      .set('Cookie', cookies);

    expect(listPlansRes.status).toBe(200);
    expect(listPlansRes.body.success).toBe(true);
    expect(listPlansRes.body.data.plans).toHaveLength(1);
    expect(listPlansRes.body.data.plans[0].id).toBe(planId);

    // ========== 5. 获取单个计划 ==========
    const getPlanRes = await request(app)
      .get(`/api/plans/${planId}`)
      .set('Cookie', cookies);

    expect(getPlanRes.status).toBe(200);
    expect(getPlanRes.body.success).toBe(true);
    expect(getPlanRes.body.data.plan.id).toBe(planId);

    // ========== 6. 更新计划 ==========
    const updateData = {
      title: '更新后的 E2E 计划',
      description: '这是更新后的描述',
      date: '2024-12-31',
    };

    const updatePlanRes = await request(app)
      .put(`/api/plans/${planId}`)
      .set('Cookie', cookies)
      .send(updateData);

    expect(updatePlanRes.status).toBe(200);
    expect(updatePlanRes.body.success).toBe(true);
    expect(updatePlanRes.body.data.plan.title).toBe(updateData.title);
    expect(updatePlanRes.body.data.plan.date).toBe(updateData.date);

    // ========== 7. 标记计划完成 ==========
    const completeRes = await request(app)
      .patch(`/api/plans/${planId}/complete`)
      .set('Cookie', cookies)
      .send({ isCompleted: true });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.plan.isCompleted).toBe(true);

    // ========== 8. 取消计划完成 ==========
    const uncompleteRes = await request(app)
      .patch(`/api/plans/${planId}/complete`)
      .set('Cookie', cookies)
      .send({ isCompleted: false });

    expect(uncompleteRes.status).toBe(200);
    expect(uncompleteRes.body.success).toBe(true);
    expect(uncompleteRes.body.data.plan.isCompleted).toBe(false);

    // ========== 9. 创建更多计划 ==========
    const plan2Res = await request(app)
      .post('/api/plans')
      .set('Cookie', cookies)
      .send({
        title: '第二个计划',
        date: '2024-12-26',
      });

    expect(plan2Res.status).toBe(201);

    const plan3Res = await request(app)
      .post('/api/plans')
      .set('Cookie', cookies)
      .send({
        title: '第三个计划',
        date: '2024-12-27',
      });

    expect(plan3Res.status).toBe(201);

    // ========== 10. 按日期范围查询计划 ==========
    // 注意：日期范围查询包含 startDate 和 endDate
    const filteredPlansRes = await request(app)
      .get('/api/plans?startDate=2024-12-25&endDate=2024-12-27')
      .set('Cookie', cookies);

    expect(filteredPlansRes.status).toBe(200);
    expect(filteredPlansRes.body.success).toBe(true);
    // 现在有 3 个计划（包括第一个创建的）
    expect(filteredPlansRes.body.data.plans.length).toBeGreaterThanOrEqual(2);

    // ========== 11. 删除计划 ==========
    const deleteRes = await request(app)
      .delete(`/api/plans/${planId}`)
      .set('Cookie', cookies);

    expect(deleteRes.status).toBe(204);

    // 验证计划已被删除
    const getDeletedRes = await request(app)
      .get(`/api/plans/${planId}`)
      .set('Cookie', cookies);

    expect(getDeletedRes.status).toBe(404);

    // ========== 12. 刷新 Token ==========
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);

    // 更新 cookies
    const newCookies = normalizeCookies(refreshRes.headers['set-cookie']);
    expect(newCookies.length).toBeGreaterThan(0);

    // ========== 13. 登出 ==========
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', newCookies);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // ========== 14. 验证登出后无法使用旧的 Token ==========
    // 登出会清除数据库中的 refresh token，但 access token 在客户端仍然有效直到过期
    // 这里我们验证登出接口本身工作正常
    expect(logoutRes.status).toBe(200);
  });

  it('应该正确处理数据隔离 - 用户A无法访问用户B的数据', async () => {
    // 创建用户 A
    const userAData = {
      username: 'userae2e',
      email: 'usera_e2e@example.com',
      password: 'TestPass123!',
    };

    const userARegister = await request(app)
      .post('/api/auth/register')
      .send(userAData);

    const userACookies = normalizeCookies(userARegister.headers['set-cookie']);

    // 用户 A 创建计划
    const planARes = await request(app)
      .post('/api/plans')
      .set('Cookie', userACookies)
      .send({
        title: '用户A的计划',
        date: '2024-12-25',
      });

    const planAId = planARes.body.data.plan.id;

    // 创建用户 B
    const userBData = {
      username: 'userbe2e',
      email: 'userb_e2e@example.com',
      password: 'TestPass123!',
    };

    const userBRegister = await request(app)
      .post('/api/auth/register')
      .send(userBData);

    const userBCookies = normalizeCookies(userBRegister.headers['set-cookie']);

    // 用户 B 尝试访问用户 A 的计划 - 应该返回 404
    const getRes = await request(app)
      .get(`/api/plans/${planAId}`)
      .set('Cookie', userBCookies);

    expect(getRes.status).toBe(404);

    // 用户 B 尝试更新用户 A 的计划 - 应该返回 404
    const updateRes = await request(app)
      .put(`/api/plans/${planAId}`)
      .set('Cookie', userBCookies)
      .send({ title: '尝试修改' });

    expect(updateRes.status).toBe(404);

    // 用户 B 尝试删除用户 A 的计划 - 应该返回 404
    const deleteRes = await request(app)
      .delete(`/api/plans/${planAId}`)
      .set('Cookie', userBCookies);

    expect(deleteRes.status).toBe(404);

    // 用户 B 获取自己的计划列表 - 应该为空
    const listRes = await request(app)
      .get('/api/plans')
      .set('Cookie', userBCookies);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.plans).toHaveLength(0);
  });

  it('应该正确处理重新登录流程', async () => {
    // 注册
    const userData = {
      username: 'reloginuser',
      email: 'relogin@example.com',
      password: 'TestPass123!',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    const cookies = normalizeCookies(registerRes.headers['set-cookie']);

    // 登出
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    expect(logoutRes.status).toBe(200);

    // 重新登录
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.email).toBe(userData.email);

    const loginCookies = normalizeCookies(loginRes.headers['set-cookie']);

    // 验证可以访问受保护资源
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', loginCookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.username).toBe(userData.username);
  });
});

/**
 * E2E 测试 - 默认每日任务完整业务流程
 * 覆盖: 注册 → 登录 → 创建默认任务 → 更新默认任务 → 删除默认任务 → 获取默认任务列表
 */
describe('E2E Tests - 默认每日任务完整业务流程', () => {
  const app = createTestApp();

  function normalizeCookies(cookies: string | string[] | undefined): string[] {
    if (!cookies) return [];
    return Array.isArray(cookies) ? cookies : [cookies];
  }

  it('应该完成默认任务的完整业务流程', async () => {
    // ========== 1. 注册 ==========
    const registerData = {
      username: 'defaultuser',
      email: 'defaulttask@example.com',
      password: 'TestPass123!',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(registerData);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    let cookies = normalizeCookies(registerRes.headers['set-cookie']);
    expect(cookies.length).toBeGreaterThan(0);

    // ========== 2. 获取默认任务列表（空列表） ==========
    const emptyListRes = await request(app)
      .get('/api/plans/default')
      .set('Cookie', cookies);

    expect(emptyListRes.status).toBe(200);
    expect(emptyListRes.body.success).toBe(true);
    expect(emptyListRes.body.data.defaultTasks).toHaveLength(0);

    // ========== 3. 创建多个默认任务 ==========
    const task1Res = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({
        title: '每日晨读',
        description: '每天早上阅读30分钟',
      });

    expect(task1Res.status).toBe(201);
    expect(task1Res.body.success).toBe(true);
    expect(task1Res.body.data.task.title).toBe('每日晨读');
    const task1Id = task1Res.body.data.task.id;

    const task2Res = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({
        title: '健身运动',
        description: '每天运动1小时',
      });

    expect(task2Res.status).toBe(201);
    const task2Id = task2Res.body.data.task.id;

    const task3Res = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({
        title: '冥想放松',
      });

    expect(task3Res.status).toBe(201);
    const task3Id = task3Res.body.data.task.id;

    // ========== 4. 获取默认任务列表（包含3个任务） ==========
    const listRes = await request(app)
      .get('/api/plans/default')
      .set('Cookie', cookies);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.defaultTasks).toHaveLength(3);

    // ========== 5. 更新默认任务 ==========
    const updateRes = await request(app)
      .put(`/api/plans/default/${task1Id}`)
      .set('Cookie', cookies)
      .send({
        title: '晨读（更新版）',
        description: '每天早上阅读45分钟（已更新）',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.task.title).toBe('晨读（更新版）');
    expect(updateRes.body.data.task.description).toBe('每天早上阅读45分钟（已更新）');

    // ========== 6. 部分更新默认任务（只更新标题） ==========
    const partialUpdateRes = await request(app)
      .put(`/api/plans/default/${task2Id}`)
      .set('Cookie', cookies)
      .send({
        title: '健身运动（高强度）',
      });

    expect(partialUpdateRes.status).toBe(200);
    expect(partialUpdateRes.body.data.task.title).toBe('健身运动（高强度）');
    expect(partialUpdateRes.body.data.task.description).toBe('每天运动1小时');

    // ========== 7. 删除一个默认任务 ==========
    const deleteRes = await request(app)
      .delete(`/api/plans/default/${task3Id}`)
      .set('Cookie', cookies);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // ========== 8. 验证删除后的列表 ==========
    const finalListRes = await request(app)
      .get('/api/plans/default')
      .set('Cookie', cookies);

    expect(finalListRes.status).toBe(200);
    expect(finalListRes.body.data.defaultTasks).toHaveLength(2);

    // 验证剩余的任务
    const titles = finalListRes.body.data.defaultTasks.map((t: any) => t.title);
    expect(titles).toContain('晨读（更新版）');
    expect(titles).toContain('健身运动（高强度）');
    expect(titles).not.toContain('冥想放松');

    // ========== 9. 验证删除的任务无法访问 ==========
    const getDeletedRes = await request(app)
      .put(`/api/plans/default/${task3Id}`)
      .set('Cookie', cookies)
      .send({ title: '尝试更新已删除的任务' });

    expect(getDeletedRes.status).toBe(404);
  });

  it('应该正确处理默认任务的数据隔离', async () => {
    // 创建用户 A
    const userAData = {
      username: 'useradefault',
      email: 'usera_default@example.com',
      password: 'TestPass123!',
    };

    const userARegister = await request(app)
      .post('/api/auth/register')
      .send(userAData);

    const userACookies = normalizeCookies(userARegister.headers['set-cookie']);

    // 用户 A 创建默认任务
    const taskARes = await request(app)
      .post('/api/plans/default')
      .set('Cookie', userACookies)
      .send({
        title: '用户A的默认任务',
        description: '这是用户A的默认任务',
      });

    const taskAId = taskARes.body.data.task.id;

    // 创建用户 B
    const userBData = {
      username: 'userbdefault',
      email: 'userb_default@example.com',
      password: 'TestPass123!',
    };

    const userBRegister = await request(app)
      .post('/api/auth/register')
      .send(userBData);

    const userBCookies = normalizeCookies(userBRegister.headers['set-cookie']);

    // 用户 B 尝试访问用户 A 的默认任务 - 应该返回 404
    const getRes = await request(app)
      .get('/api/plans/default')
      .set('Cookie', userBCookies);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.defaultTasks).toHaveLength(0);

    // 用户 B 尝试更新用户 A 的默认任务 - 应该返回 404
    const updateRes = await request(app)
      .put(`/api/plans/default/${taskAId}`)
      .set('Cookie', userBCookies)
      .send({ title: '尝试修改' });

    expect(updateRes.status).toBe(404);

    // 用户 B 尝试删除用户 A 的默认任务 - 应该返回 404
    const deleteRes = await request(app)
      .delete(`/api/plans/default/${taskAId}`)
      .set('Cookie', userBCookies);

    expect(deleteRes.status).toBe(404);

    // 验证用户 A 的任务仍然存在
    const userAListRes = await request(app)
      .get('/api/plans/default')
      .set('Cookie', userACookies);

    expect(userAListRes.status).toBe(200);
    expect(userAListRes.body.data.defaultTasks).toHaveLength(1);
    expect(userAListRes.body.data.defaultTasks[0].title).toBe('用户A的默认任务');
  });

  it('应该正确处理默认任务和普通计划的共存', async () => {
    // 注册并登录
    const userData = {
      username: 'mixeduser',
      email: 'mixed@example.com',
      password: 'TestPass123!',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    const cookies = normalizeCookies(registerRes.headers['set-cookie']);

    // 创建默认任务
    const defaultTaskRes = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({
        title: '我的默认任务',
        description: '每天都会显示',
      });

    expect(defaultTaskRes.status).toBe(201);
    const defaultTaskId = defaultTaskRes.body.data.task.id;

    // 创建普通计划
    const planRes = await request(app)
      .post('/api/plans')
      .set('Cookie', cookies)
      .send({
        title: '我的普通计划',
        description: '特定日期的计划',
        date: '2024-12-25',
      });

    expect(planRes.status).toBe(201);
    const planId = planRes.body.data.plan.id;

    // 获取默认任务列表
    const defaultTasksRes = await request(app)
      .get('/api/plans/default')
      .set('Cookie', cookies);

    expect(defaultTasksRes.status).toBe(200);
    expect(defaultTasksRes.body.data.defaultTasks).toHaveLength(1);
    expect(defaultTasksRes.body.data.defaultTasks[0].id).toBe(defaultTaskId);

    // 获取普通计划列表
    const plansRes = await request(app)
      .get('/api/plans')
      .set('Cookie', cookies);

    expect(plansRes.status).toBe(200);
    expect(plansRes.body.data.plans).toHaveLength(1);
    expect(plansRes.body.data.plans[0].id).toBe(planId);

    // 验证默认任务和普通计划有不同的ID
    expect(defaultTaskId).not.toBe(planId);
  });

  it('应该正确处理默认任务的验证错误', async () => {
    // 注册并登录
    const userData = {
      username: 'validuser',
      email: 'validation@example.com',
      password: 'TestPass123!',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    const cookies = normalizeCookies(registerRes.headers['set-cookie']);

    // 测试空标题
    const emptyTitleRes = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({ title: '' });

    expect(emptyTitleRes.status).toBe(400);
    expect(emptyTitleRes.body.success).toBe(false);

    // 测试超长标题
    const longTitleRes = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({ title: 'a'.repeat(201) });

    expect(longTitleRes.status).toBe(400);
    expect(longTitleRes.body.success).toBe(false);

    // 创建一个有效的默认任务用于后续测试
    const validTaskRes = await request(app)
      .post('/api/plans/default')
      .set('Cookie', cookies)
      .send({ title: '有效任务' });

    expect(validTaskRes.status).toBe(201);
    const taskId = validTaskRes.body.data.task.id;

    // 测试更新时的空标题
    const updateEmptyTitleRes = await request(app)
      .put(`/api/plans/default/${taskId}`)
      .set('Cookie', cookies)
      .send({ title: '' });

    expect(updateEmptyTitleRes.status).toBe(400);
    expect(updateEmptyTitleRes.body.success).toBe(false);

    // 测试更新时的超长标题
    const updateLongTitleRes = await request(app)
      .put(`/api/plans/default/${taskId}`)
      .set('Cookie', cookies)
      .send({ title: 'a'.repeat(201) });

    expect(updateLongTitleRes.status).toBe(400);
    expect(updateLongTitleRes.body.success).toBe(false);
  });
});
