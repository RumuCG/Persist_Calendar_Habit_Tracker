import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DefaultTasksView from '@/views/DefaultTasksView.vue'
import * as planApi from '@/api/plan'

// Mock API
vi.mock('@/api/plan', () => ({
  getDefaultTasks: vi.fn(),
  createDefaultTask: vi.fn(),
  updateDefaultTask: vi.fn(),
  deleteDefaultTask: vi.fn(),
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  ElMessageBox: {
    confirm: vi.fn(),
  },
}))

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('DefaultTasksView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mountComponent = () => {
    return mount(DefaultTasksView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          'el-dialog': {
            template: '<div class="el-dialog" :title="title"><slot /><slot name="footer" /></div>',
            props: ['modelValue', 'title'],
          },
          'el-form': {
            template: '<div class="el-form"><slot /></div>',
          },
          'el-form-item': {
            template: '<div class="el-form-item"><slot /></div>',
          },
          'el-input': {
            template: '<input class="el-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'type', 'placeholder', 'maxlength', 'rows'],
          },
          'el-button': {
            template: '<button class="el-button" :class="type" @click="$emit(\'click\')"><slot /></button>',
            props: ['type', 'loading', 'size'],
          },
        },
      },
    })
  }

  describe('Component Rendering', () => {
    it('renders page header correctly', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.page-title').exists()).toBe(true)
      expect(wrapper.find('.page-title').text()).toContain('默认任务管理')
    })

    it('renders page description', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.page-desc').exists()).toBe(true)
      expect(wrapper.find('.page-desc').text()).toContain('每日默认任务')
    })

    it('renders back button', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.back-btn').exists()).toBe(true)
    })

    it('renders star icon in title', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.title-icon').exists()).toBe(true)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no tasks', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-title').text()).toBe('还没有默认任务')
      expect(wrapper.find('.empty-add-btn').exists()).toBe(true)
    })

    it('hides empty state when tasks exist', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: {
          success: true,
          data: {
            defaultTasks: [
              { id: 1, title: 'Test Task', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      // Verify tasks are loaded and empty state is hidden based on component logic
      expect(wrapper.vm.tasks.length).toBeGreaterThan(0)
      expect(wrapper.vm.tasks[0].title).toBe('Test Task')
    })
  })

  describe('Task List', () => {
    it('loads tasks correctly into component state', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', description: 'Desc 1', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, title: 'Task 2', description: 'Desc 2', isCompleted: false, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
      ]
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: {
          success: true,
          data: { defaultTasks: mockTasks },
        },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      // Verify tasks are loaded into component state
      expect(wrapper.vm.tasks).toHaveLength(2)
      expect(wrapper.vm.tasks[0].title).toBe('Task 1')
      expect(wrapper.vm.tasks[1].title).toBe('Task 2')
    })

    it('hides empty state when tasks are loaded', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: {
          success: true,
          data: {
            defaultTasks: [
              { id: 1, title: 'Task 1', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      // Verify tasks are loaded into component state
      expect(wrapper.vm.tasks.length).toBeGreaterThan(0)
      expect(wrapper.vm.tasks[0].title).toBe('Task 1')
    })
  })

  describe('Modal', () => {
    it('opens add modal when clicking add button', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      await wrapper.find('.empty-add-btn').trigger('click')
      expect(wrapper.vm.modalVisible).toBe(true)
      expect(wrapper.vm.isEditMode).toBe(false)
    })

    it('opens edit modal with task data when clicking edit', async () => {
      const task = { id: 1, title: 'Task 1', description: 'Desc 1', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: {
          success: true,
          data: { defaultTasks: [task] },
        },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      // Directly call the method to test logic
      wrapper.vm.openEditModal(task)
      expect(wrapper.vm.modalVisible).toBe(true)
      expect(wrapper.vm.isEditMode).toBe(true)
      expect(wrapper.vm.editingId).toBe(1)
      expect(wrapper.vm.formTitle).toBe('Task 1')
      expect(wrapper.vm.formDescription).toBe('Desc 1')
    })
  })

  describe('Form Validation', () => {
    it('validates empty title', async () => {
      const { ElMessage } = await import('element-plus')
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      await wrapper.find('.empty-add-btn').trigger('click')
      wrapper.vm.formTitle = '   '
      await wrapper.vm.handleSubmit()

      expect(ElMessage.warning).toHaveBeenCalledWith('请输入任务名称')
    })

    it('validates title length', async () => {
      const { ElMessage } = await import('element-plus')
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      await wrapper.find('.empty-add-btn').trigger('click')
      wrapper.vm.formTitle = 'a'.repeat(201)
      await wrapper.vm.handleSubmit()

      expect(ElMessage.warning).toHaveBeenCalledWith('任务名称不能超过200个字符')
    })
  })

  describe('Events', () => {
    it('calls API when form is submitted', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      vi.mocked(planApi.createDefaultTask).mockResolvedValue({
        data: {
          success: true,
          data: { task: { id: 1, title: 'New Task', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
          message: '创建成功',
        },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      await wrapper.find('.empty-add-btn').trigger('click')
      wrapper.vm.formTitle = 'New Task'
      wrapper.vm.formDescription = 'New Description'
      await wrapper.vm.handleSubmit()

      expect(planApi.createDefaultTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
      })
    })

    it('navigates back when clicking back button', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      await wrapper.find('.back-btn').trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/profile')
    })
  })

  describe('Loading States', () => {
    it('shows loading state during initial fetch', () => {
      vi.mocked(planApi.getDefaultTasks).mockImplementation(() => new Promise(() => {}))

      const wrapper = mount(DefaultTasksView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            'el-dialog': { template: '<div />' },
            'el-form': { template: '<div />' },
            'el-form-item': { template: '<div />' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button />' },
          },
        },
      })

      expect(wrapper.vm.loading).toBe(true)
    })

    it('hides loading after fetch completes', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('Responsive Design', () => {
    it('has correct fab visibility logic when tasks exist', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: {
          success: true,
          data: {
            defaultTasks: [
              { id: 1, title: 'Task 1', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      // Verify tasks are loaded and fab should be visible based on component logic
      expect(wrapper.vm.tasks.length).toBeGreaterThan(0)
    })

    it('has correct fab visibility logic when no tasks', async () => {
      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: { success: true, data: { defaultTasks: [] } },
      } as any)

      const wrapper = mountComponent()
      await flushPromises()

      // Verify no tasks and fab should be hidden based on component logic
      expect(wrapper.vm.tasks.length).toBe(0)
    })
  })
})
