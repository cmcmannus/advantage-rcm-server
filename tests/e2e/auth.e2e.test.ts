import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from '../../src/db/schema.js';
import { createTestApp } from '../helpers/testApp.js';

jest.setTimeout(30000);

describe('Authentication E2E Tests', () => {
    let app: express.Express;
    let db: MySql2Database;
    let pool: mysql.Pool;
    let testUser: any;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
        process.env.MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
        process.env.MYSQL_USER = process.env.MYSQL_USER || 'root';
        process.env.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
        process.env.MYSQL_DATABASE = 'arcm_test';

        pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
        });
        db = drizzle(pool);

        app = createTestApp();
    });

    beforeEach(async () => {
        await db.execute('DELETE FROM user_favorites');
        await db.execute('DELETE FROM providers');
        await db.execute('DELETE FROM practices');
        await db.execute('DELETE FROM users');

        const hashedPassword = await bcrypt.hash('TestPass123!', 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, firstName, lastName, salesRep, accessLevel, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['test@example.com', hashedPassword, 'Test', 'User', 0, 1, 1]
        );
        testUser = { id: (result as any).insertId, email: 'test@example.com' };
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'TestPass123!' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should fail with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'WrongPass' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'TestPass123!' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should fail with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email and password are required');
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        it('should refresh tokens with valid refresh token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'TestPass123!' });

            const refreshToken = loginResponse.body.refreshToken;

            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });

        it('should fail with invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken: 'invalid-token' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid refresh token');
        });

        it('should fail with missing refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({});

            expect(response.status).toBe(401);
        });
    });

    describe('Protected routes', () => {
        it('should reject requests without access token', async () => {
            const response = await request(app)
                .get('/api/providers/');

            expect(response.status).toBe(401);
        });

        it('should reject requests with invalid access token', async () => {
            const response = await request(app)
                .get('/api/providers/')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(403);
        });

        it('should accept valid access token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'TestPass123!' });

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get('/api/providers/')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout');

            expect(response.status).toBe(200);
        });
    });
});
