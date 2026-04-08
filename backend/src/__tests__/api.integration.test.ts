import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const app = createApp();
const prisma = new PrismaClient();

let testUserId: string;
let testToken: string;
let testSessionId: string;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Clean database
    await prisma.lap.deleteMany({});
    await prisma.telemetry.deleteMany({});
    await prisma.sessionStatistics.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.leaderboardEntry.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication Routes', () => {
    it('POST /api/auth/register - Register new user', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');

      testUserId = response.body.user.id;
      testToken = response.body.token;
    });

    it('POST /api/auth/login - Login with credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Password123!',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('POST /api/auth/register - Reject duplicate username', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'another@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(409);
    });

    it('POST /api/auth/register - Reject weak password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('User Routes', () => {
    it('GET /api/users/profile - Get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
    });

    it('PATCH /api/users/profile - Update user profile', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ username: 'updateduser' });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('updateduser');
    });

    it('GET /api/users/stats - Get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('totalLaps');
      expect(response.body).toHaveProperty('bestLapTime');
    });

    it('GET /api/users/leaderboard-position - Get leaderboard positions', async () => {
      const response = await request(app)
        .get('/api/users/leaderboard-position')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Session Routes', () => {
    it('POST /api/sessions - Create new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test Session',
          track: 'Silverstone',
          simulator: 'iRacing',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Session');
      expect(response.body.track).toBe('Silverstone');

      testSessionId = response.body.id;
    });

    it('GET /api/sessions - List user sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /api/sessions/:id - Get session details', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testSessionId);
    });

    it('PATCH /api/sessions/:id - Update session', async () => {
      const response = await request(app)
        .patch(`/api/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Updated Session' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Session');
    });

    it('GET /api/sessions?track=Silverstone - Filter sessions by track', async () => {
      const response = await request(app)
        .get('/api/sessions?track=Silverstone')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Telemetry Routes', () => {
    it('POST /api/telemetry - Insert telemetry data', async () => {
      const telemetryData = [
        {
          sessionId: testSessionId,
          speed: 250,
          rpm: 9000,
          throttle: 100,
          brake: 0,
          clutch: 0,
          engineTemp: 95,
          fuelLevel: 100,
          tireWear: { fl: 0, fr: 0, rl: 0, rr: 0 },
          tirePressure: { fl: 27.5, fr: 27.5, rl: 28.0, rr: 28.0 },
          tireTemp: { fl: 80, fr: 80, rl: 80, rr: 80 },
          weather: 'clear',
          trackTemp: 35,
          time: new Date().toISOString(),
        },
      ];

      const response = await request(app)
        .post('/api/telemetry')
        .set('Authorization', `Bearer ${testToken}`)
        .send(telemetryData);

      expect(response.status).toBe(201);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/telemetry/:sessionId - Retrieve telemetry data', async () => {
      const response = await request(app)
        .get(`/api/telemetry/${testSessionId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('speed');
      expect(response.body[0]).toHaveProperty('rpm');
    });

    it('GET /api/telemetry/:sessionId?limit=10 - Pagination support', async () => {
      const response = await request(app)
        .get(`/api/telemetry/${testSessionId}?limit=10&offset=0`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Lap Routes', () => {
    it('POST /api/laps - Record lap', async () => {
      const response = await request(app)
        .post('/api/laps')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSessionId,
          lapNumber: 1,
          lapTime: 95.234,
          sector1: 30.123,
          sector2: 32.456,
          sector3: 32.655,
          maxSpeed: 285.5,
          avgSpeed: 220.3,
          fuelConsumed: 2.5,
          weather: 'clear',
          trackTemp: 35,
          setup: {},
        });

      expect(response.status).toBe(201);
      expect(response.body.lapTime).toBe(95.234);
      expect(response.body.userId).toBe(testUserId);
    });

    it('GET /api/laps - List user laps', async () => {
      const response = await request(app)
        .get('/api/laps')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /api/laps - Filter laps by session', async () => {
      const response = await request(app)
        .get(`/api/laps?sessionId=${testSessionId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/laps/session/:sessionId - Get session lap statistics', async () => {
      const response = await request(app)
        .get(`/api/laps/session/${testSessionId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalLaps');
      expect(response.body).toHaveProperty('bestLapTime');
      expect(response.body).toHaveProperty('avgLapTime');
    });

    it('POST /api/laps - Record second lap for personal best detection', async () => {
      const response = await request(app)
        .post('/api/laps')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSessionId,
          lapNumber: 2,
          lapTime: 93.567, // Better than first lap
          sector1: 29.456,
          sector2: 31.234,
          sector3: 32.877,
          maxSpeed: 287.2,
          avgSpeed: 222.1,
          fuelConsumed: 2.4,
          weather: 'clear',
          trackTemp: 36,
          setup: {},
        });

      expect(response.status).toBe(201);
      expect(response.body.personalBest).toBe(true);
    });
  });

  describe('Leaderboard Routes', () => {
    it('GET /api/leaderboards/global - Get global leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboards/global?track=Silverstone&simulator=iRacing');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/leaderboards/track/:track - Get track leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboards/track/Silverstone');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('track');
      expect(response.body.track).toBe('Silverstone');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/leaderboards/personal - Get personal best leaderboards', async () => {
      const response = await request(app)
        .get('/api/leaderboards/personal')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/leaderboards/update - Update leaderboards', async () => {
      const response = await request(app)
        .post('/api/leaderboards/update')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication & Authorization', () => {
    it('GET /api/sessions - Reject without token', async () => {
      const response = await request(app).get('/api/sessions');

      expect(response.status).toBe(401);
    });

    it('GET /api/sessions - Reject with invalid token', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('GET /api/users/profile - Reject without token', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('POST /api/sessions - Reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Incomplete Session' });

      expect(response.status).toBe(400);
    });

    it('GET /api/sessions/:id - Return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/invalid-id')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    it('POST /api/laps - Reject invalid lap time', async () => {
      const response = await request(app)
        .post('/api/laps')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSessionId,
          lapNumber: 999,
          lapTime: -100, // Invalid
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Health & Version Endpoints', () => {
    it('GET /health - Health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('GET /version - API version', async () => {
      const response = await request(app).get('/version');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('phase');
    });
  });

  describe('Session Deletion', () => {
    it('DELETE /api/sessions/:id - Delete session', async () => {
      // Create a session to delete
      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Session to Delete',
          track: 'Monza',
          simulator: 'ACC',
        });

      const sessionId = createResponse.body.id;

      // Delete the session
      const deleteResponse = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
