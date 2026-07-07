import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import type { Express } from 'express';
import { mockAllServices } from './setup.js';

const mockCreateNote = jest.fn<any>();
const mockUpdateNote = jest.fn<any>();
const mockDeleteNote = jest.fn<any>();
const mockGetNotes = jest.fn<any>();

mockAllServices({
  '../../src/services/notes': {
    createNote: mockCreateNote, updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote, getNotes: mockGetNotes,
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

describe('POST /api/notes/', () => {
  it('creates and returns 201', async () => {
    mockCreateNote.mockResolvedValue({ id: 1, note: 'Test', userId: 1 });
    const res = await supertest(app).post('/api/notes/').set(auth()).send({ userId: 1, practiceId: 1, timestamp: new Date().toISOString(), note: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('returns 400 for missing fields', async () => {
    const res = await supertest(app).post('/api/notes/').set(auth()).send({ note: 'Missing' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/notes/:id', () => {
  it('updates note', async () => {
    mockUpdateNote.mockResolvedValue({ id: 1, note: 'Updated' });
    const res = await supertest(app).put('/api/notes/1').set(auth()).send({ note: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.note).toBe('Updated');
  });

  it('returns 400 when note missing', async () => {
    const res = await supertest(app).put('/api/notes/1').set(auth()).send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('deletes note', async () => {
    mockDeleteNote.mockResolvedValue(undefined);
    const res = await supertest(app).delete('/api/notes/1').set(auth());
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid id', async () => {
    const res = await supertest(app).delete('/api/notes/invalid').set(auth());
    expect(res.status).toBe(400);
  });
});

describe('GET /api/notes/', () => {
  it('returns notes for practiceId', async () => {
    mockGetNotes.mockResolvedValue([{ id: 1, note: 'Test', userId: 1 }]);
    const res = await supertest(app).get('/api/notes/?practiceId=1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns notes for providerId', async () => {
    mockGetNotes.mockResolvedValue([{ id: 2, note: 'Provider note', userId: 1 }]);
    const res = await supertest(app).get('/api/notes/?providerId=1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 400 without practiceId or providerId', async () => {
    const res = await supertest(app).get('/api/notes/').set(auth());
    expect(res.status).toBe(400);
  });
});
