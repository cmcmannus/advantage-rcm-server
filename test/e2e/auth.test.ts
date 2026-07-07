import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import type { Express } from 'express';
import { mockAllServices } from './setup.js';

const mockLoginUser = jest.fn<any>();
const mockGetUsers = jest.fn<any>();
const mockSetResetToken = jest.fn<any>();
const mockValidateResetToken = jest.fn<any>();
const mockResetPassword = jest.fn<any>();

mockAllServices({
  '../../src/services/users': {
    getUsers: mockGetUsers, loginUser: mockLoginUser,
    setResetToken: mockSetResetToken, validateResetToken: mockValidateResetToken,
    resetPassword: mockResetPassword, createUser: jest.fn<any>(),
    deactivateUser: jest.fn<any>(), updateUser: jest.fn<any>(),
    getUserById: jest.fn<any>(), deleteUser: jest.fn<any>(),
    verifyResetToken: jest.fn<any>(),
  },
});

let supertest: any;
let app: Express;

beforeAll(async () => {
  supertest = (await import('supertest')).default;
  const mod = await import('../../src/server');
  app = mod.createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  it('returns 200 with tokens for valid credentials', async () => {
    mockLoginUser.mockResolvedValue({
      id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User',
      salesRep: 0, accessLevel: 2, active: 1,
    });

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 for invalid credentials', async () => {
    mockLoginUser.mockResolvedValue(null);
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 500 on service error', async () => {
    mockLoginUser.mockRejectedValue(new Error('DB error'));
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'any' });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('returns 200 with new tokens for valid refresh token', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    const token = jwt.sign(
      { id: 1, email: 'test@example.com' },
      'test-refresh-secret-for-e2e-tests',
      { expiresIn: '30d' }
    );

    const res = await supertest(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: token });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('returns 401 for missing token', async () => {
    const res = await supertest(app).post('/api/auth/refresh-token').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token', async () => {
    const res = await supertest(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'invalid' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200', async () => {
    const res = await supertest(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});

describe('Password Reset Flow', () => {
  it('sets a reset token and returns it', async () => {
    mockGetUsers.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
    mockSetResetToken.mockResolvedValue(true);

    const res = await supertest(app)
      .post('/api/auth/get-password-reset-token')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('message');
  });

  it('returns 500 when user not found', async () => {
    mockGetUsers.mockResolvedValue([]);
    const res = await supertest(app)
      .post('/api/auth/get-password-reset-token')
      .send({ email: 'unknown@example.com' });
    expect(res.status).toBe(500);
  });

  it('validates a reset token', async () => {
    mockValidateResetToken.mockResolvedValue(true);
    const res = await supertest(app)
      .post('/api/auth/validate-reset-token')
      .send({ token: 'valid-token' });
    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
  });

  it('marks invalid token as false', async () => {
    mockValidateResetToken.mockResolvedValue(false);
    const res = await supertest(app)
      .post('/api/auth/validate-reset-token')
      .send({ token: 'bad-token' });
    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(false);
  });

  it('resets password with valid token', async () => {
    mockValidateResetToken.mockResolvedValue(true);
    mockResetPassword.mockResolvedValue('test@example.com');

    const res = await supertest(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid', password: 'NewPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('success');
  });

  it('returns 400 for missing token or password', async () => {
    const res = await supertest(app).post('/api/auth/reset-password').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when reset token is invalid', async () => {
    mockValidateResetToken.mockResolvedValue(false);
    const res = await supertest(app)
      .post('/api/auth/reset-password')
      .send({ token: 'bad', password: 'NewPass123!' });
    expect(res.status).toBe(401);
  });
});
