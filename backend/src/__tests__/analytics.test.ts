import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const app = createApp();
const prisma = new PrismaClient();

let testToken: string;
let testSessionId: string;

describe('Session Analytics Routes', () => {
  beforeAll(async () => {
    // Setup: Create test user and session with data
    const regResponse = await request(app).post('/api/auth/register').send({
      username: 'analyticsuser',
      email: 'analytics@test.com',
      password: 'TestPass123!',
    });

    testToken = regResponse.body.token;

    // Create test session
    const sessionResponse = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Analytics Test Session',
        track: 'Silverstone',
        simulator: 'iRacing',
      });

    testSessionId = sessionResponse.body.id;

    // Add telemetry data
    const telemetryData = Array.from({ length: 50 }, (_, i) => ({
      speed: 200 + Math.random() * 100,
      rpm: 6000 + Math.random() * 3000,
      throttle: Math.random() * 100,
      brake: Math.random() * 50,
      clutch: 0,
      engineTemp: 85 + Math.random() * 20,
      fuelLevel: 100 - (i * 2),
      weather: Math.random() > 0.5 ? 'clear' : 'rain',
      trackTemp: 25 + Math.random() * 10,
      time: new Date(Date.now() - (50 - i) * 60000),
    }));

    await request(app)
      .post('/api/telemetry')
      .set('Authorization', `Bearer ${testToken}`)
      .send(telemetryData);

    // Add laps
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/laps')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSessionId,
          lapNumber: i,
          lapTime: 95 + (Math.random() - 0.5) * 3,
          sector1: 30 + Math.random() * 2,
          sector2: 32 + Math.random() * 2,
          sector3: 33 + Math.random() * 2,
          maxSpeed: 280 + Math.random() * 20,
          avgSpeed: 220,
          fuelConsumed: 2.5,
          weather: 'clear',
          trackTemp: 28,
        });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Session Analytics', () => {
    it('GET /api/sessions/:id/analytics - Get detailed analytics', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/analytics`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('laps');
      expect(response.body.laps).toHaveProperty('totalLaps');
      expect(response.body.laps).toHaveProperty('bestLap');
      expect(response.body.laps).toHaveProperty('averageLap');
      expect(response.body).toHaveProperty('speed');
      expect(response.body).toHaveProperty('temperature');
      expect(response.body).toHaveProperty('sectors');
      expect(response.body).toHaveProperty('fuel');
    });

    it('GET /api/sessions/:id/analytics - Returns consistency metric', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/analytics`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.laps).toHaveProperty('consistency');
      expect(typeof response.body.laps.consistency).toBe('number');
    });

    it('GET /api/sessions/:id/analytics - Returns sector analysis', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/analytics`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sectors).toHaveProperty('sector1');
      expect(response.body.sectors).toHaveProperty('sector2');
      expect(response.body.sectors).toHaveProperty('sector3');
      expect(response.body.sectors.sector1).toHaveProperty('best');
      expect(response.body.sectors.sector1).toHaveProperty('avg');
      expect(response.body.sectors.sector1).toHaveProperty('worst');
    });

    it('GET /api/sessions/:id/analytics - Requires authentication', async () => {
      const response = await request(app).get(`/api/sessions/${testSessionId}/analytics`);

      expect(response.status).toBe(401);
    });
  });

  describe('Lap Comparison', () => {
    it('GET /api/sessions/:id/lap-comparison - Compare two laps', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/lap-comparison?lap1=1&lap2=2`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comparison');
      expect(response.body.comparison).toHaveProperty('lap1');
      expect(response.body.comparison).toHaveProperty('lap2');
      expect(response.body.comparison).toHaveProperty('differences');
      expect(response.body.comparison).toHaveProperty('winner');
    });

    it('GET /api/sessions/:id/lap-comparison - Returns differences', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/lap-comparison?lap1=1&lap2=3`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.comparison.differences).toHaveProperty('timeDiff');
      expect(response.body.comparison.differences).toHaveProperty('sector1Diff');
      expect(response.body.comparison.differences).toHaveProperty('speedDiff');
    });

    it('GET /api/sessions/:id/lap-comparison - Missing parameters', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/lap-comparison?lap1=1`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Telemetry Export', () => {
    it('GET /api/sessions/:id/telemetry-export - Export as CSV', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/telemetry-export`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Time');
      expect(response.text).toContain('Speed');
      expect(response.text).toContain('RPM');
    });

    it('GET /api/sessions/:id/telemetry-export - Contains telemetry data', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/telemetry-export`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      const lines = response.text.split('\n');
      expect(lines.length).toBeGreaterThan(2); // Header + data
    });
  });

  describe('Weather History', () => {
    it('GET /api/sessions/:id/weather-history - Get weather conditions', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/weather-history`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('weatherHistory');
      expect(Array.isArray(response.body.weatherHistory)).toBe(true);
    });

    it('GET /api/sessions/:id/weather-history - Contains weather stats', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/weather-history`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      if (response.body.weatherHistory.length > 0) {
        const weather = response.body.weatherHistory[0];
        expect(weather).toHaveProperty('weather');
        expect(weather).toHaveProperty('duration');
        expect(weather).toHaveProperty('averageTrackTemp');
        expect(weather).toHaveProperty('averageSpeed');
      }
    });
  });

  describe('Driver Performance Trends', () => {
    it('GET /api/sessions/trends/driver-performance - Get performance over time', async () => {
      const response = await request(app)
        .get('/api/sessions/trends/driver-performance')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId');
      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    it('GET /api/sessions/trends/driver-performance - Contains trend data', async () => {
      const response = await request(app)
        .get('/api/sessions/trends/driver-performance')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      if (response.body.trends.length > 0) {
        const trend = response.body.trends[0];
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('track');
        expect(trend).toHaveProperty('simulator');
        expect(trend).toHaveProperty('bestLap');
        expect(trend).toHaveProperty('avgLap');
        expect(trend).toHaveProperty('improvement');
      }
    });

    it('GET /api/sessions/trends/driver-performance - Requires authentication', async () => {
      const response = await request(app).get('/api/sessions/trends/driver-performance');

      expect(response.status).toBe(401);
    });
  });
});
