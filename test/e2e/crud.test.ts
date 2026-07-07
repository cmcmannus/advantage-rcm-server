import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import type { Express } from 'express';
import { mockAllServices } from './setup.js';

const mockGetAll = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockDelete = jest.fn<any>();
const mockCreateLocation = jest.fn<any>();
const mockUpdateLocation = jest.fn<any>();
const mockDeleteLocation = jest.fn<any>();
const mockGetLocations = jest.fn<any>();

function makeCrudServiceMock() {
  return { getAll: mockGetAll, create: mockCreate, update: mockUpdate, delete: mockDelete };
}

mockAllServices({
  '../../src/services/actions': { actionService: makeCrudServiceMock() },
  '../../src/services/statuses': { statusService: makeCrudServiceMock() },
  '../../src/services/clearing_houses': { clearingHouseService: makeCrudServiceMock() },
  '../../src/services/ehr_systems': { ehrSystemService: makeCrudServiceMock() },
  '../../src/services/pm_systems': { pmSystemService: makeCrudServiceMock() },
  '../../src/services/follow_up_reasons': { followUpReasonService: makeCrudServiceMock() },
  '../../src/services/locations': {
    createLocation: mockCreateLocation, updateLocation: mockUpdateLocation,
    deleteLocation: mockDeleteLocation, getLocations: mockGetLocations,
  },
});

let supertest: any;
let app: Express;
let jwt: any;
let auth: (accessLevel?: number) => Record<string, string>;

beforeAll(async () => {
  supertest = (await import('supertest')).default;
  const { default: jwtModule } = await import('jsonwebtoken');
  jwt = jwtModule;
  const mod = await import('../../src/server');
  app = mod.createApp();
  auth = (accessLevel = 2) => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', accessLevel, firstName: 'Test', lastName: 'User' },
      'test-jwt-secret-for-e2e-tests',
      { expiresIn: '15m' }
    );
    return { Authorization: `Bearer ${token}` };
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue([]);
  mockGetLocations.mockResolvedValue([]);
});

describe('Authentication & Authorization', () => {
  it('returns 401 for unauthenticated requests', async () => {
    expect((await supertest(app).get('/api/actions/')).status).toBe(401);
  });

  it('returns 403 for invalid token', async () => {
    expect((await supertest(app).get('/api/actions/').set('Authorization', 'Bearer invalid')).status).toBe(403);
  });

  it('returns 401 for null token', async () => {
    expect((await supertest(app).get('/api/actions/').set('Authorization', 'Bearer null')).status).toBe(401);
  });

  it('returns 401 for empty token', async () => {
    expect((await supertest(app).get('/api/actions/').set('Authorization', 'Bearer ')).status).toBe(401);
  });
});

describe('Generic CRUD endpoints', () => {
  const endpoints = [
    '/api/actions/', '/api/statuses/', '/api/ehr-systems/',
    '/api/pm-systems/', '/api/clearing-houses/', '/api/follow-up-reasons/',
  ];

  endpoints.forEach((path) => {
    it(`GET ${path} - lists all`, async () => {
      mockGetAll.mockResolvedValueOnce([{ id: 1 }]);
      const res = await supertest(app).get(path).set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  it('POST /api/actions/ - creates (admin)', async () => {
    mockCreate.mockResolvedValueOnce({ id: 3, action: 'New' });
    const res = await supertest(app).post('/api/actions/').set(auth(1)).send({ name: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.action).toBe('New');
  });

  it('POST /api/actions/ - rejects non-admin', async () => {
    const res = await supertest(app).post('/api/actions/').set(auth(2)).send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/actions/:id - updates (admin)', async () => {
    mockUpdate.mockResolvedValueOnce({ id: 1, action: 'Updated' });
    const res = await supertest(app).put('/api/actions/1').set(auth(1)).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.action).toBe('Updated');
  });

  it('DELETE /api/actions/:id - deletes (admin)', async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    const res = await supertest(app).delete('/api/actions/1').set(auth(1));
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });
});

describe('Locations CRUD', () => {
  it('GET /api/locations/ - lists all', async () => {
    mockGetLocations.mockResolvedValueOnce([{ id: 1, address1: '123 Main' }]);
    const res = await supertest(app).get('/api/locations/').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.locations).toHaveLength(1);
  });

  it('POST /api/locations/ - creates', async () => {
    mockCreateLocation.mockResolvedValueOnce({ id: 1 });
    const res = await supertest(app).post('/api/locations/').set(auth())
      .send({ address1: '456 Oak', city: 'Seattle', state: 'WA', zip: '98101' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('PUT /api/locations/:id - updates', async () => {
    mockUpdateLocation.mockResolvedValueOnce({ id: 1 });
    const res = await supertest(app).put('/api/locations/1').set(auth())
      .send({ address1: '789 Pine', city: 'Seattle', state: 'WA', zip: '98102' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/locations/:id - deletes', async () => {
    mockDeleteLocation.mockResolvedValueOnce(undefined);
    const res = await supertest(app).delete('/api/locations/1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });
});
