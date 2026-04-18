import * as planService from './planService';
import * as authService from './authService';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

describe('PlanService', () => {
  let userId: number;

  beforeEach(async () => {
    // 创建测试用户
    const result = await authService.register({
      username: `plantest_${Date.now()}`,
      email: `plantest_${Date.now()}@example.com`,
      password: 'TestPass123!',
    });
    userId = result.user.id;
  });

  describe('createPlan', () => {
    it('应该成功创建计划', async () => {
      const data = {
        title: '测试计划',
        description: '这是一个测试计划',
        date: '2024-01-15',
      };

      const plan = await planService.createPlan(userId, data);

      expect(plan.title).toBe(data.title);
      expect(plan.description).toBe(data.description);
      expect(plan.date).toBe(data.date);
      expect(plan.isCompleted).toBe(false);
    });

    it('应该拒绝空标题', async () => {
      await expect(
        planService.createPlan(userId, {
          title: '',
          date: '2024-01-15',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝超过200字符的标题', async () => {
      await expect(
        planService.createPlan(userId, {
          title: 'a'.repeat(201),
          date: '2024-01-15',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝无效的日期格式', async () => {
      await expect(
        planService.createPlan(userId, {
          title: '测试计划',
          date: 'invalid-date',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getPlans', () => {
    it('应该返回用户的所有计划', async () => {
      // 创建多个计划
      await planService.createPlan(userId, {
        title: '计划1',
        date: '2024-01-15',
      });
      await planService.createPlan(userId, {
        title: '计划2',
        date: '2024-01-16',
      });

      const plans = await planService.getPlans(userId);

      expect(plans).toHaveLength(2);
    });

    it('应该按日期范围过滤计划', async () => {
      // 创建不同日期的计划
      await planService.createPlan(userId, {
        title: '计划1',
        date: '2024-01-10',
      });
      await planService.createPlan(userId, {
        title: '计划2',
        date: '2024-01-20',
      });
      await planService.createPlan(userId, {
        title: '计划3',
        date: '2024-01-25',
      });

      const plans = await planService.getPlans(userId, '2024-01-15', '2024-01-22');

      expect(plans).toHaveLength(1);
      expect(plans[0].title).toBe('计划2');
    });

    it('不应该返回其他用户的计划', async () => {
      // 创建另一个用户
      const otherUser = await authService.register({
        username: `other_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      // 为其他用户创建计划
      await planService.createPlan(otherUser.user.id, {
        title: '其他用户的计划',
        date: '2024-01-15',
      });

      // 获取当前用户的计划
      const plans = await planService.getPlans(userId);

      expect(plans).toHaveLength(0);
    });
  });

  describe('getPlanById', () => {
    it('应该返回指定的计划', async () => {
      const created = await planService.createPlan(userId, {
        title: '测试计划',
        date: '2024-01-15',
      });

      const plan = await planService.getPlanById(userId, created.id);

      expect(plan.id).toBe(created.id);
      expect(plan.title).toBe('测试计划');
    });

    it('应该拒绝访问不存在的计划', async () => {
      await expect(
        planService.getPlanById(userId, 999999)
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝访问其他用户的计划', async () => {
      // 创建另一个用户和计划
      const otherUser = await authService.register({
        username: `other_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      const otherPlan = await planService.createPlan(otherUser.user.id, {
        title: '其他用户的计划',
        date: '2024-01-15',
      });

      await expect(
        planService.getPlanById(userId, otherPlan.id)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updatePlan', () => {
    it('应该成功更新计划', async () => {
      const created = await planService.createPlan(userId, {
        title: '原始标题',
        description: '原始描述',
        date: '2024-01-15',
      });

      const updated = await planService.updatePlan(userId, created.id, {
        title: '更新后的标题',
        description: '更新后的描述',
        date: '2024-01-20',
      });

      expect(updated.title).toBe('更新后的标题');
      expect(updated.description).toBe('更新后的描述');
      expect(updated.date).toBe('2024-01-20');
    });

    it('应该部分更新计划', async () => {
      const created = await planService.createPlan(userId, {
        title: '原始标题',
        description: '原始描述',
        date: '2024-01-15',
      });

      const updated = await planService.updatePlan(userId, created.id, {
        title: '只更新标题',
      });

      expect(updated.title).toBe('只更新标题');
      expect(updated.description).toBe('原始描述');
      expect(updated.date).toBe('2024-01-15');
    });

    it('应该拒绝更新其他用户的计划', async () => {
      // 创建另一个用户和计划
      const otherUser = await authService.register({
        username: `other_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      const otherPlan = await planService.createPlan(otherUser.user.id, {
        title: '其他用户的计划',
        date: '2024-01-15',
      });

      await expect(
        planService.updatePlan(userId, otherPlan.id, {
          title: '尝试更新',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deletePlan', () => {
    it('应该成功删除计划', async () => {
      const created = await planService.createPlan(userId, {
        title: '要删除的计划',
        date: '2024-01-15',
      });

      await planService.deletePlan(userId, created.id);

      // 验证计划已被删除
      const plan = await prisma.plan.findUnique({
        where: { id: created.id },
      });
      expect(plan).toBeNull();
    });

    it('应该拒绝删除其他用户的计划', async () => {
      // 创建另一个用户和计划
      const otherUser = await authService.register({
        username: `other_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      const otherPlan = await planService.createPlan(otherUser.user.id, {
        title: '其他用户的计划',
        date: '2024-01-15',
      });

      await expect(
        planService.deletePlan(userId, otherPlan.id)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('toggleComplete', () => {
    it('应该标记计划为完成', async () => {
      const created = await planService.createPlan(userId, {
        title: '测试计划',
        date: '2024-01-15',
      });

      const completed = await planService.toggleComplete(userId, created.id, true);

      expect(completed.isCompleted).toBe(true);
    });

    it('应该取消计划的完成状态', async () => {
      const created = await planService.createPlan(userId, {
        title: '测试计划',
        date: '2024-01-15',
      });

      // 先标记为完成
      await planService.toggleComplete(userId, created.id, true);

      // 再取消完成
      const uncompleted = await planService.toggleComplete(userId, created.id, false);

      expect(uncompleted.isCompleted).toBe(false);
    });

    it('应该拒绝操作其他用户的计划', async () => {
      // 创建另一个用户和计划
      const otherUser = await authService.register({
        username: `other_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      const otherPlan = await planService.createPlan(otherUser.user.id, {
        title: '其他用户的计划',
        date: '2024-01-15',
      });

      await expect(
        planService.toggleComplete(userId, otherPlan.id, true)
      ).rejects.toThrow(ApiError);
    });
  });

  // ============= 默认任务测试 =============

  describe('getDefaultTasks', () => {
    it('应该返回用户的默认任务列表', async () => {
      // 创建一些默认任务
      await planService.createDefaultTask(userId, {
        title: '默认任务1',
        description: '描述1',
      });
      await planService.createDefaultTask(userId, {
        title: '默认任务2',
        description: '描述2',
      });

      const tasks = await planService.getDefaultTasks(userId);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('默认任务1');
      expect(tasks[1].title).toBe('默认任务2');
    });

    it('应该只返回当前用户的默认任务', async () => {
      // 创建另一个用户和默认任务
      const otherUser = await authService.register({
        username: `other_default_${Date.now()}`,
        email: `other_default_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      await planService.createDefaultTask(otherUser.user.id, {
        title: '其他用户的默认任务',
      });

      // 当前用户的默认任务列表应该为空
      const tasks = await planService.getDefaultTasks(userId);
      expect(tasks).toHaveLength(0);
    });

    it('应该返回空数组当没有默认任务', async () => {
      const tasks = await planService.getDefaultTasks(userId);
      expect(tasks).toEqual([]);
    });
  });

  describe('createDefaultTask', () => {
    it('应该成功创建默认任务', async () => {
      const data = {
        title: '每日晨读',
        description: '每天早上阅读30分钟',
      };

      const task = await planService.createDefaultTask(userId, data);

      expect(task.title).toBe(data.title);
      expect(task.description).toBe(data.description);
      expect(task.isCompleted).toBe(false);
    });

    it('应该创建没有描述的默认任务', async () => {
      const task = await planService.createDefaultTask(userId, {
        title: '简单任务',
      });

      expect(task.title).toBe('简单任务');
      expect(task.description).toBeNull();
    });

    it('应该拒绝空标题', async () => {
      await expect(
        planService.createDefaultTask(userId, {
          title: '',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝超过200字符的标题', async () => {
      await expect(
        planService.createDefaultTask(userId, {
          title: 'a'.repeat(201),
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updateDefaultTask', () => {
    it('应该成功更新默认任务', async () => {
      const created = await planService.createDefaultTask(userId, {
        title: '原始标题',
        description: '原始描述',
      });

      const updated = await planService.updateDefaultTask(userId, created.id, {
        title: '更新后的标题',
        description: '更新后的描述',
      });

      expect(updated.title).toBe('更新后的标题');
      expect(updated.description).toBe('更新后的描述');
    });

    it('应该部分更新默认任务', async () => {
      const created = await planService.createDefaultTask(userId, {
        title: '原始标题',
        description: '原始描述',
      });

      const updated = await planService.updateDefaultTask(userId, created.id, {
        title: '只更新标题',
      });

      expect(updated.title).toBe('只更新标题');
      expect(updated.description).toBe('原始描述');
    });

    it('应该拒绝更新不存在的默认任务', async () => {
      await expect(
        planService.updateDefaultTask(userId, 999999, {
          title: '尝试更新',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝更新其他用户的默认任务', async () => {
      const otherUser = await authService.register({
        username: `other_update_${Date.now()}`,
        email: `other_update_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      const otherTask = await planService.createDefaultTask(otherUser.user.id, {
        title: '其他用户的默认任务',
      });

      await expect(
        planService.updateDefaultTask(userId, otherTask.id, {
          title: '尝试更新',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝更新普通计划（非默认任务）', async () => {
      const regularPlan = await planService.createPlan(userId, {
        title: '普通计划',
        date: '2024-01-15',
      });

      await expect(
        planService.updateDefaultTask(userId, regularPlan.id, {
          title: '尝试更新',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝空标题', async () => {
      const created = await planService.createDefaultTask(userId, {
        title: '原始标题',
      });

      await expect(
        planService.updateDefaultTask(userId, created.id, {
          title: '',
        })
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝超过200字符的标题', async () => {
      const created = await planService.createDefaultTask(userId, {
        title: '原始标题',
      });

      await expect(
        planService.updateDefaultTask(userId, created.id, {
          title: 'a'.repeat(201),
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteDefaultTask', () => {
    it('应该成功删除默认任务', async () => {
      const created = await planService.createDefaultTask(userId, {
        title: '要删除的默认任务',
      });

      await planService.deleteDefaultTask(userId, created.id);

      // 验证任务已被删除
      const task = await prisma.plan.findUnique({
        where: { id: created.id },
      });
      expect(task).toBeNull();
    });

    it('应该拒绝删除不存在的默认任务', async () => {
      await expect(
        planService.deleteDefaultTask(userId, 999999)
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝删除其他用户的默认任务', async () => {
      const otherUser = await authService.register({
        username: `other_delete_${Date.now()}`,
        email: `other_delete_${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

      const otherTask = await planService.createDefaultTask(otherUser.user.id, {
        title: '其他用户的默认任务',
      });

      await expect(
        planService.deleteDefaultTask(userId, otherTask.id)
      ).rejects.toThrow(ApiError);
    });

    it('应该拒绝删除普通计划（非默认任务）', async () => {
      const regularPlan = await planService.createPlan(userId, {
        title: '普通计划',
        date: '2024-01-15',
      });

      await expect(
        planService.deleteDefaultTask(userId, regularPlan.id)
      ).rejects.toThrow(ApiError);
    });
  });
});
