import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import type { Express } from 'express';
import { mockAllServices } from './setup.js';

const mockCreateProvider = jest.fn<any>();
const mockUpdateProvider = jest.fn<any>();
const mockDeleteProvider = jest.fn<any>();
const mockGetProvider = jest.fn<any>();
const mockSearch = jest.fn<any>();
const mockGetProviderFilterOptions = jest.fn<any>();
const mockGetProviderPractices = jest.fn<any>();
const mockExportFunc = jest.fn<any>();
const mockAddToFavorites = jest.fn<any>();
const mockRemoveFromFavorites = jest.fn<any>();
const mockSetProviderPrimaryLocation = jest.fn<any>();

mockAllServices({
  '../../src/services/providers': {
    createProvider: mockCreateProvider, updateProvider: mockUpdateProvider,
    deleteProvider: mockDeleteProvider, getProvider: mockGetProvider,
    search: mockSearch, getProviderFilterOptions: mockGetProviderFilterOptions,
    getProviderPractices: mockGetProviderPractices,
    exportData: jest.fn<any>(), providerColumnMap: {},
  },
  '../../src/services/export': { exportFunc: mockExportFunc },
  '../../src/services/favorites': {
    addToUserFavorites: mockAddToFavorites, removeFromUserFavorites: mockRemoveFromFavorites,
  },
  '../../src/services/practiceLocations': {
    setProviderPrimaryLocation: mockSetProviderPrimaryLocation,
    getPracticeLocation: jest.fn<any>(), getPracticeLocations: jest.fn<any>(),
    createPracticeLocation: jest.fn<any>(), updatePracticeLocation: jest.fn<any>(),
    deletePracticeLocation: jest.fn<any>(), updateProviderPracticeLocations: jest.fn<any>(),
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

describe('GET /api/providers/', () => {
  it('returns paginated list', async () => {
    mockSearch.mockResolvedValue({
      data: [{ id: 1, firstName: 'Alice' }, { id: 2, firstName: 'Bob' }],
      paging: { pageNumber: 1, pageSize: 50, totalPages: 1 },
    });
    const res = await supertest(app).get('/api/providers/').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body).toHaveProperty('paging');
  });

  it('passes query params to search', async () => {
    mockSearch.mockResolvedValue({ data: [], paging: { pageNumber: 1, pageSize: 50, totalPages: 0 } });
    await supertest(app).get('/api/providers/?firstName=Alice&pageSize=10').set(auth());
    expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Alice', pageSize: '10' }));
  });
});

describe('POST /api/providers/', () => {
  it('creates and returns 201', async () => {
    mockCreateProvider.mockResolvedValue({ id: 1, firstName: 'New', lastName: 'Provider' });
    const res = await supertest(app).post('/api/providers/').set(auth()).send({ firstName: 'New', lastName: 'Provider' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});

describe('GET /api/providers/:id', () => {
  it('returns provider by id', async () => {
    mockGetProvider.mockResolvedValue({ id: 1, firstName: 'Specific' });
    const res = await supertest(app).get('/api/providers/1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Specific');
  });

  it('returns 404 when not found', async () => {
    mockGetProvider.mockRejectedValue(new Error('Provider not found!'));
    const res = await supertest(app).get('/api/providers/99999').set(auth());
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/providers/:id', () => {
  it('updates and returns provider', async () => {
    mockUpdateProvider.mockResolvedValue({ id: 1, firstName: 'Updated' });
    const res = await supertest(app).put('/api/providers/1').set(auth()).send({ firstName: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Updated');
  });
});

describe('DELETE /api/providers/:id', () => {
  it('deletes provider', async () => {
    mockDeleteProvider.mockResolvedValue(undefined);
    const res = await supertest(app).delete('/api/providers/1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });
});

describe('GET /api/providers/filter-options', () => {
  it('returns filter options', async () => {
    mockGetProviderFilterOptions.mockResolvedValue({ statuses: [], actions: [], followUpReasons: [], salesReps: [], specializations: [], states: [] });
    const res = await supertest(app).get('/api/providers/filter-options').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('statuses');
    expect(res.body).toHaveProperty('actions');
  });
});

describe('GET /api/providers/:id/practices', () => {
  it('returns practices', async () => {
    mockGetProviderPractices.mockResolvedValue({ data: [{ id: 1 }], paging: { pageNumber: 1, pageSize: 50, totalPages: 1 } });
    const res = await supertest(app).get('/api/providers/1/practices').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns error when no practices', async () => {
    mockGetProviderPractices.mockResolvedValue({ data: [], paging: { pageNumber: 1, pageSize: 50, totalPages: 0 } });
    const res = await supertest(app).get('/api/providers/1/practices').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Favorites', () => {
  it('POST adds to favorites', async () => {
    const res = await supertest(app).post('/api/providers/1/favorite').set(auth());
    expect(res.status).toBe(200);
    expect(mockAddToFavorites).toHaveBeenCalledWith(1, undefined, 1);
  });

  it('DELETE removes from favorites', async () => {
    const res = await supertest(app).delete('/api/providers/1/favorite').set(auth());
    expect(res.status).toBe(200);
    expect(mockRemoveFromFavorites).toHaveBeenCalledWith(1, undefined, 1);
  });
});

describe('Primary Location', () => {
  it('POST sets primary location', async () => {
    mockSetProviderPrimaryLocation.mockResolvedValue(undefined);
    const res = await supertest(app).post('/api/providers/1/primary-location').set(auth()).send({ practice_location_id: 5, set: true });
    expect(res.status).toBe(200);
    expect(mockSetProviderPrimaryLocation).toHaveBeenCalledWith(1, 5, true);
  });

  it('returns 400 when practice_location_id missing', async () => {
    const res = await supertest(app).post('/api/providers/1/primary-location').set(auth()).send({ set: true });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/providers/export', () => {
  it('returns CSV', async () => {
    mockExportFunc.mockResolvedValue('NPI,First Name\n"123","John"\n');
    const res = await supertest(app).get('/api/providers/export').set(auth());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('NPI');
  });
});
