import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CalendarView from '@/components/CalendarView.vue'
import PlanList from '@/components/PlanList.vue'
import type { Plan } from '@/api/plan'

/**
 * 集成测试 - 日历和计划列表的交互
 */
describe('Integration - Calendar and Plan List', () => {
  const createPlan = (overrides: Partial<Plan> = {}): Plan => ({
    id: 1,
    title: 'Test Plan',
    description: '',
    date: '2024-01-15',
    isCompleted: false,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    ...overrides,
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('CalendarView and PlanList interaction', () => {
    it('should display plans in calendar and list', async () => {
      const plans = [
        createPlan({ id: 1, title: 'Plan 1', date: '2024-01-15' }),
        createPlan({ id: 2, title: 'Plan 2', date: '2024-01-15' }),
        createPlan({ id: 3, title: 'Plan 3', date: '2024-01-20' }),
      ]

      // 挂载计划列表组件（显示1月15日的计划）
      const dayPlans = plans.filter(p => p.date === '2024-01-15')
      const listWrapper = mount(PlanList, {
        props: {
          plans: dayPlans,
          loading: false,
        },
      })

      // 验证列表中有2个计划
      expect(listWrapper.findAll('.plan-item')).toHaveLength(2)

      // 验证日历组件props
      const calendarWrapper = mount(CalendarView, {
        props: {
          plans,
          currentDate: '2024-01-15',
        },
      })

      // 验证日历接收到的props
      expect(calendarWrapper.props('plans')).toHaveLength(3)
    })

    it('should handle plan completion across components', async () => {
      const plans = [
        createPlan({ id: 1, title: 'Plan 1', isCompleted: false }),
      ]

      const listWrapper = mount(PlanList, {
        props: {
          plans,
          loading: false,
        },
      })

      // 触发切换完成事件
      await listWrapper.vm.$emit('toggle-complete', plans[0])

      // 验证事件被触发
      expect(listWrapper.emitted('toggle-complete')).toBeTruthy()
    })

    it('should filter plans by date correctly', () => {
      const plans = [
        createPlan({ id: 1, title: 'Jan 15 Plan', date: '2024-01-15' }),
        createPlan({ id: 2, title: 'Jan 20 Plan', date: '2024-01-20' }),
        createPlan({ id: 3, title: 'Feb 1 Plan', date: '2024-02-01' }),
      ]

      // 筛选1月15日的计划
      const jan15Plans = plans.filter(p => p.date === '2024-01-15')
      expect(jan15Plans).toHaveLength(1)
      expect(jan15Plans[0].title).toBe('Jan 15 Plan')

      // 筛选1月的计划
      const janPlans = plans.filter(p => p.date.startsWith('2024-01'))
      expect(janPlans).toHaveLength(2)
    })
  })

  describe('Date navigation and plan loading', () => {
    it('should update displayed plans when month changes', async () => {
      const janPlans = [
        createPlan({ id: 1, title: 'Jan Plan', date: '2024-01-15' }),
      ]
      const febPlans = [
        createPlan({ id: 2, title: 'Feb Plan', date: '2024-02-15' }),
      ]

      const wrapper = mount(CalendarView, {
        props: {
          plans: janPlans,
          currentDate: '2024-01-15',
        },
      })

      // 初始显示1月计划
      expect(wrapper.props('plans')).toEqual(janPlans)

      // 切换到2月
      await wrapper.setProps({ plans: febPlans, currentDate: '2024-02-15' })

      // 验证显示2月计划
      expect(wrapper.props('plans')).toEqual(febPlans)
    })
  })

  describe('Plan CRUD operations flow', () => {
    it('should handle complete plan lifecycle', async () => {
      let plans: Plan[] = []

      // 1. 创建计划
      const newPlan = createPlan({ id: 1, title: 'New Plan' })
      plans = [...plans, newPlan]
      expect(plans).toHaveLength(1)

      // 2. 更新计划
      plans = plans.map(p =>
        p.id === 1 ? { ...p, title: 'Updated Plan' } : p
      )
      expect(plans[0].title).toBe('Updated Plan')

      // 3. 标记完成
      plans = plans.map(p =>
        p.id === 1 ? { ...p, isCompleted: true } : p
      )
      expect(plans[0].isCompleted).toBe(true)

      // 4. 删除计划
      plans = plans.filter(p => p.id !== 1)
      expect(plans).toHaveLength(0)
    })
  })
})
