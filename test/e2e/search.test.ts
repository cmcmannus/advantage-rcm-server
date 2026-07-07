import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import type { Express } from 'express';
import { mockAllServices } from './setup.js';

const mockSearchPracticeProvider = jest.fn<any>();

mockAllServices({
  '../../src/services/search': {
    searchPracticeProvider: mockSearchPracticeProvider,
  },
});

let supertest: any;
let app: Express;
let jwt: any;
let auth: () => Record<string, string>;

beforeAll(async () => {
  supertest = (await import('supertest')).default;
  const { default: jwtModule } = await import('jsonwebtoken');
  jwt = jwtModule;
  const mod = await import('../../src/server');
  app = mod.createApp();
  auth = () => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', accessLevel: 2, firstName: 'Test', lastName: 'User' },
      'test-jwt-secret-for-e2e-tests',
      { expiresIn: '15m' }
    );
    return { Authorization: `Bearer ${token}` };
  };
});

beforeEach(() => jest.clearAllMocks());

describe('GET /api/search/', () => {
  it('returns results', async () => {
    mockSearchPracticeProvider.mockResolvedValue([
      { record_id: 1, record_type: 'practice', primary_name: 'Clinic' },
      { record_id: 2, record_type: 'provider', primary_name: 'John Doe' },
    ]);
    const res = await supertest(app).get('/api/search/?searchText=Test').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('record_type');
  });

  it('returns empty for no matches', async () => {
    mockSearchPracticeProvider.mockResolvedValue([]);
    const res = await supertest(app).get('/api/search/?searchText=XYZZZ').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/search/typeahead', () => {
  it('returns results for 3+ chars', async () => {
    mockSearchPracticeProvider.mockResolvedValue([{ record_id: 1, record_type: 'provider', primary_name: 'John' }]);
    const res = await supertest(app).get('/api/search/typeahead?query=Joh').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 400 for < 3 chars', async () => {
    const res = await supertest(app).get('/api/search/typeahead?query=ab').set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('at least 3 characters');
  });
});
