import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarDay from '@/components/CalendarDay.vue'
import type { Plan } from '@/api/plan'

describe('CalendarDay', () => {
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

  it('renders correctly with basic props', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: false,
        plans: [],
      },
    })

    expect(wrapper.find('.day-number').text()).toBe('15')
    expect(wrapper.find('.calendar-day').classes()).toContain('is-current-month')
  })

  it('applies today class when isToday is true', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: true,
        plans: [],
      },
    })

    expect(wrapper.find('.calendar-day').classes()).toContain('is-today')
  })

  it('applies other-month class when isCurrentMonth is false', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: false,
        isToday: false,
        plans: [],
      },
    })

    expect(wrapper.find('.calendar-day').classes()).toContain('is-other-month')
  })

  it('renders plans correctly', () => {
    const plans = [
      createPlan({ id: 1, title: 'Plan 1' }),
      createPlan({ id: 2, title: 'Plan 2' }),
    ]

    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: false,
        plans,
      },
    })

    const planItems = wrapper.findAll('.plan-item')
    expect(planItems).toHaveLength(2)
    expect(planItems[0].text()).toBe('Plan 1')
    expect(planItems[1].text()).toBe('Plan 2')
  })

  it('shows completed style for completed plans', () => {
    const plans = [createPlan({ id: 1, title: 'Completed Plan', isCompleted: true })]

    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: false,
        plans,
      },
    })

    expect(wrapper.find('.plan-item').classes()).toContain('is-completed')
  })

  it('shows +n when plans exceed 3', () => {
    const plans = [
      createPlan({ id: 1, title: 'Plan 1' }),
      createPlan({ id: 2, title: 'Plan 2' }),
      createPlan({ id: 3, title: 'Plan 3' }),
      createPlan({ id: 4, title: 'Plan 4' }),
    ]

    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: false,
        plans,
      },
    })

    expect(wrapper.find('.more-plans').text()).toBe('+1')
    expect(wrapper.findAll('.plan-item')).toHaveLength(3)
  })

  it('emits click event with date when clicked', async () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: false,
        plans: [],
      },
    })

    await wrapper.find('.calendar-day').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual(['2024-01-15'])
  })

  it('truncates long plan titles', () => {
    const plans = [createPlan({ id: 1, title: 'A'.repeat(20) })]

    const wrapper = mount(CalendarDay, {
      props: {
        date: '2024-01-15',
        dayOfMonth: 15,
        isCurrentMonth: true,
        isToday: false,
        plans,
      },
    })

    const planItem = wrapper.find('.plan-item')
    expect(planItem.text()).toContain('...')
    expect(planItem.text().length).toBeLessThan(20)
  })
})
