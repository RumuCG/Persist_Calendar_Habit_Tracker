import request from 'supertest'
import app from '../app'
import { prisma } from '../lib/prisma'

// Mock the auth middleware to inject a test user
jest.mock('../middleware/authMiddleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 1
    next()
  }
}))

describe('Focus Controller', () => {
  beforeEach(async () => {
    await prisma.focusSession.deleteMany({})
    await prisma.user.deleteMany({ where: { id: 1 } }).catch(() => {})
    await prisma.user.create({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      },
    })
  })

  afterEach(async () => {
    await prisma.focusSession.deleteMany({})
    await prisma.user.deleteMany({ where: { id: 1 } })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/focus', () => {
    it('should create a focus session', async () => {
      const response = await request(app)
        .post('/api/focus')
        .send({
          title: 'Test Focus',
          mode: 'COUNTDOWN',
          expectedDuration: 1500,
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('Test Focus')
      expect(response.body.data.mode).toBe('COUNTDOWN')
    })

    it('should validate mode field', async () => {
      const response = await request(app)
        .post('/api/focus')
        .send({
          title: 'Test',
          mode: 'INVALID',
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/focus/:id', () => {
    it('should update a focus session', async () => {
      const session = await prisma.focusSession.create({
        data: {
          userId: 1,
          title: 'Test',
          startTime: new Date(),
          mode: 'COUNTDOWN',
          duration: 0,
          isCompleted: false,
          isAbandoned: false,
        },
      })

      const response = await request(app)
        .put(`/api/focus/${session.id}`)
        .send({
          endTime: new Date().toISOString(),
          duration: 1200,
          isCompleted: true,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.duration).toBe(1200)
    })
  })

  describe('GET /api/focus', () => {
    it('should get focus sessions', async () => {
      await prisma.focusSession.create({
        data: {
          userId: 1,
          title: 'Test',
          startTime: new Date(),
          mode: 'COUNTDOWN',
          duration: 1200,
          isCompleted: true,
          isAbandoned: false,
        },
      })

      const response = await request(app)
        .get('/api/focus')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.items.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/focus/stats', () => {
    it('should get focus stats', async () => {
      await prisma.focusSession.create({
        data: {
          userId: 1,
          title: 'Test',
          startTime: new Date(),
          endTime: new Date(),
          mode: 'COUNTDOWN',
          duration: 1200,
          isCompleted: true,
          isAbandoned: false,
        },
      })

      const response = await request(app)
        .get('/api/focus/stats')
        .query({ period: 'WEEK' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.totalDuration).toBe(1200)
    })
  })

  describe('GET /api/focus/leaderboard', () => {
    it('should get focus leaderboard', async () => {
      const response = await request(app)
        .get('/api/focus/leaderboard')
        .query({ period: 'WEEK' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('rankings')
    })
  })
})
