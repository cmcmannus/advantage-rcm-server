import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { createTestApp } from '../helpers/testApp.js';

jest.setTimeout(30000);

describe('Providers E2E Tests', () => {
    let app: express.Express;
    let db: MySql2Database;
    let pool: mysql.Pool;
    let accessToken: string;
    let userId: number;

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
        await db.execute('DELETE FROM provider_practice_locations');
        await db.execute('DELETE FROM practice_locations');
        await db.execute('DELETE FROM locations');
        await db.execute('DELETE FROM notes');
        await db.execute('DELETE FROM providers');
        await db.execute('DELETE FROM practices');
        await db.execute('DELETE FROM users');
        await db.execute('DELETE FROM statuses');
        await db.execute('DELETE FROM actions');

        // Create test status and action
        await pool.execute('INSERT INTO statuses (status) VALUES (?)', ['Active']);
        await pool.execute('INSERT INTO actions (action) VALUES (?)', ['Follow Up']);

        // Create test user and login
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);
        const [userResult] = await pool.execute(
            'INSERT INTO users (email, password, firstName, lastName, salesRep, accessLevel, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['test@example.com', hashedPassword, 'Test', 'User', 0, 1, 1]
        );
        userId = (userResult as any).insertId;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'TestPass123!' });

        accessToken = loginResponse.body.accessToken;
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('POST /api/providers/', () => {
        it('should create a provider', async () => {
            const providerData = {
                firstName: 'John',
                lastName: 'Doe',
                npi: '1234567890',
                specialization: 'Cardiology',
                email: 'john.doe@example.com'
            };

            const response = await request(app)
                .post('/api/providers/')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(providerData);

            expect(response.status).toBe(201);
            expect(response.body.firstName).toBe('John');
            expect(response.body.lastName).toBe('Doe');
            expect(response.body.npi).toBe('1234567890');
        });

        it('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/providers/')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(500);
        });
    });

    describe('GET /api/providers/', () => {
        beforeEach(async () => {
            await pool.execute(
                'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
                ['John', 'Doe', '1234567890', 'Cardiology', userId]
            );
            await pool.execute(
                'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
                ['Jane', 'Smith', '0987654321', 'Dermatology', userId]
            );
        });

        it('should get all providers', async () => {
            const response = await request(app)
                .get('/api/providers/')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
        });

        it('should filter providers by name', async () => {
            const response = await request(app)
                .get('/api/providers/?firstName=John')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.every((p: any) => p.firstName.includes('John'))).toBe(true);
        });

        it('should filter providers by NPI', async () => {
            const response = await request(app)
                .get('/api/providers/?npi=1234567890')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.every((p: any) => p.npi === '1234567890')).toBe(true);
        });
    });

    describe('GET /api/providers/:id', () => {
        let providerId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
                ['John', 'Doe', '1234567890', 'Cardiology', userId]
            );
            providerId = (result as any).insertId;
        });

        it('should get provider by id', async () => {
            const response = await request(app)
                .get(`/api/providers/${providerId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(providerId);
            expect(response.body.firstName).toBe('John');
        });

        it('should return 404 for non-existent provider', async () => {
            const response = await request(app)
                .get('/api/providers/99999')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/providers/:id', () => {
        let providerId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
                ['John', 'Doe', '1234567890', 'Cardiology', userId]
            );
            providerId = (result as any).insertId;
        });

        it('should update provider', async () => {
            const response = await request(app)
                .put(`/api/providers/${providerId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    id: providerId,
                    firstName: 'John',
                    lastName: 'Doe Jr.',
                    npi: '1234567890',
                    specialization: 'Cardiology',
                    salesRepId: userId
                });

            expect(response.status).toBe(200);
            expect(response.body.lastName).toBe('Doe Jr.');
        });
    });

    describe('DELETE /api/providers/:id', () => {
        let providerId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
                ['John', 'Doe', '1234567890', 'Cardiology', userId]
            );
            providerId = (result as any).insertId;
        });

        it('should delete provider', async () => {
            const response = await request(app)
                .delete(`/api/providers/${providerId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Provider deleted successfully.');
        });
    });

    describe('Favorites', () => {
        let providerId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
                ['John', 'Doe', '1234567890', 'Cardiology', userId]
            );
            providerId = (result as any).insertId;
        });

        it('should add provider to favorites', async () => {
            const response = await request(app)
                .post(`/api/providers/${providerId}/favorite`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Provider marked as favorite.');
        });

        it('should remove provider from favorites', async () => {
            await request(app)
                .post(`/api/providers/${providerId}/favorite`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(app)
                .delete(`/api/providers/${providerId}/favorite`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Provider removed from favorites.');
        });
    });
});
