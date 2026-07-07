import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import type { Express } from 'express';
import { mockAllServices } from './setup.js';

const mockCreatePractice = jest.fn<any>();
const mockUpdatePractice = jest.fn<any>();
const mockDeletePractice = jest.fn<any>();
const mockGetPractice = jest.fn<any>();
const mockSearch = jest.fn<any>();
const mockGetPracticeFilterOptions = jest.fn<any>();
const mockGetPracticesForDdl = jest.fn<any>();
const mockGetPracticeProviders = jest.fn<any>();
const mockGetProvidersAvailableForPractice = jest.fn<any>();
const mockGetPracticeLocations = jest.fn<any>();
const mockCreatePracticeLocation = jest.fn<any>();
const mockGetPracticeLocation = jest.fn<any>();
const mockUpdatePracticeLocation = jest.fn<any>();
const mockDeletePracticeLocation = jest.fn<any>();
const mockUpdateProviderPracticeLocations = jest.fn<any>();
const mockExportFunc = jest.fn<any>();
const mockAddToFavorites = jest.fn<any>();
const mockRemoveFromFavorites = jest.fn<any>();

mockAllServices({
  '../../src/services/practices': {
    createPractice: mockCreatePractice, updatePractice: mockUpdatePractice,
    deletePractice: mockDeletePractice, getPractice: mockGetPractice,
    search: mockSearch, getPracticeFilterOptions: mockGetPracticeFilterOptions,
    getPracticesForDdl: mockGetPracticesForDdl, getPracticeProviders: mockGetPracticeProviders,
    getProvidersAvailableForPractice: mockGetProvidersAvailableForPractice,
    exportData: jest.fn<any>(), practiceColumnMap: {},
  },
  '../../src/services/practiceLocations': {
    getPracticeLocations: mockGetPracticeLocations,
    createPracticeLocation: mockCreatePracticeLocation,
    getPracticeLocation: mockGetPracticeLocation,
    updatePracticeLocation: mockUpdatePracticeLocation,
    deletePracticeLocation: mockDeletePracticeLocation,
    updateProviderPracticeLocations: mockUpdateProviderPracticeLocations,
    setProviderPrimaryLocation: jest.fn<any>(),
  },
  '../../src/services/export': { exportFunc: mockExportFunc },
  '../../src/services/favorites': {
    addToUserFavorites: mockAddToFavorites, removeFromUserFavorites: mockRemoveFromFavorites,
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

beforeEach(() => jest.clearAllMocks());

describe('GET /api/practices/', () => {
  it('returns paginated list', async () => {
    mockSearch.mockResolvedValue({ data: [{ id: 1, name: 'Test Clinic' }], paging: { pageNumber: 1, pageSize: 50, totalPages: 1 } });
    const res = await supertest(app).get('/api/practices/').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body).toHaveProperty('paging');
  });
});

describe('POST /api/practices/', () => {
  it('creates and returns 201', async () => {
    mockCreatePractice.mockResolvedValue({ id: 1, name: 'New Clinic' });
    const res = await supertest(app).post('/api/practices/').set(auth()).send({ name: 'New Clinic' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});

describe('GET /api/practices/:id', () => {
  it('returns practice by id', async () => {
    mockGetPractice.mockResolvedValue({ id: 1, name: 'Test' });
    const res = await supertest(app).get('/api/practices/1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 when not found', async () => {
    mockGetPractice.mockResolvedValue(null);
    const res = await supertest(app).get('/api/practices/99999').set(auth());
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/practices/:id', () => {
  it('updates practice', async () => {
    mockUpdatePractice.mockResolvedValue({ id: 1, name: 'Updated' });
    const res = await supertest(app).put('/api/practices/1').set(auth()).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });
});

describe('DELETE /api/practices/:id', () => {
  it('deletes practice', async () => {
    mockDeletePractice.mockResolvedValue(undefined);
    const res = await supertest(app).delete('/api/practices/1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });
});

describe('GET /api/practices/ddl', () => {
  it('returns dropdown list', async () => {
    mockGetPracticesForDdl.mockResolvedValue([{ value: 1, label: 'A' }]);
    const res = await supertest(app).get('/api/practices/ddl').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/practices/filter-options', () => {
  it('returns filter options', async () => {
    mockGetPracticeFilterOptions.mockResolvedValue({ statuses: [], actions: [], ehrSystems: [], pmSystems: [] });
    const res = await supertest(app).get('/api/practices/filter-options').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('statuses');
  });
});

describe('Practice Locations', () => {
  it('GET /api/practices/:id/locations - returns locations', async () => {
    mockGetPracticeLocations.mockResolvedValue({ data: [{ id: 1 }], paging: { pageNumber: 1, pageSize: 25, totalPages: 1 } });
    const res = await supertest(app).get('/api/practices/1/locations').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /api/practices/:id/locations - message when none', async () => {
    mockGetPracticeLocations.mockResolvedValue({ data: [], paging: { pageNumber: 1, pageSize: 25, totalPages: 0 } });
    const res = await supertest(app).get('/api/practices/1/locations').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/practices/:id/locations - creates', async () => {
    mockCreatePracticeLocation.mockResolvedValue({ id: 1 });
    const res = await supertest(app).post('/api/practices/1/locations').set(auth()).send({ address1: '123 Main', city: 'Portland', state: 'OR', zip: '97201' });
    expect(res.status).toBe(200);
  });

  it('PUT /api/practices/locations/:id - updates', async () => {
    mockUpdatePracticeLocation.mockResolvedValue({ id: 1 });
    const res = await supertest(app).put('/api/practices/locations/1').set(auth()).send({ address1: '456 Oak', city: 'Seattle', state: 'WA', zip: '98101' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/practices/locations/:id - deletes', async () => {
    mockDeletePracticeLocation.mockResolvedValue(undefined);
    const res = await supertest(app).delete('/api/practices/locations/1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });
});

describe('Practice Providers', () => {
  it('GET /api/practices/:id/providers - returns', async () => {
    mockGetPracticeProviders.mockResolvedValue({ data: [{ id: 1 }], paging: { pageNumber: 1, pageSize: 25, totalPages: 1 } });
    const res = await supertest(app).get('/api/practices/1/providers').set(auth());
    expect(res.status).toBe(200);
  });

  it('GET /api/practices/:id/available-providers', async () => {
    mockGetProvidersAvailableForPractice.mockResolvedValue([{ value: 1, label: 'John' }]);
    const res = await supertest(app).get('/api/practices/1/available-providers').set(auth());
    expect(res.status).toBe(200);
  });

  it('POST /api/practices/:practiceId/providers/:providerId', async () => {
    mockUpdateProviderPracticeLocations.mockResolvedValue(undefined);
    const res = await supertest(app).post('/api/practices/1/providers/2').set(auth()).send({ locationIds: [3] });
    expect(res.status).toBe(201);
  });
});

describe('Favorites & Export', () => {
  it('POST /api/practices/:id/favorite', async () => {
    await supertest(app).post('/api/practices/1/favorite').set(auth());
    expect(mockAddToFavorites).toHaveBeenCalledWith(1, 1);
  });

  it('DELETE /api/practices/:id/favorite', async () => {
    await supertest(app).delete('/api/practices/1/favorite').set(auth());
    expect(mockRemoveFromFavorites).toHaveBeenCalledWith(1, 1);
  });

  it('GET /api/practices/export returns CSV', async () => {
    mockExportFunc.mockResolvedValue('NPI,Name\n"123","Clinic"\n');
    const res = await supertest(app).get('/api/practices/export?entity=practices').set(auth());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});
