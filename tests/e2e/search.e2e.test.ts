import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { createTestApp } from '../helpers/testApp.js';

jest.setTimeout(30000);

describe('Search E2E Tests', () => {
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

        await pool.execute('INSERT INTO statuses (status) VALUES (?)', ['Active']);
        await pool.execute('INSERT INTO actions (action) VALUES (?)', ['Follow Up']);

        const hashedPassword = await bcrypt.hash('TestPass123!', 10);
        const [userResult] = await pool.execute(
            'INSERT INTO users (email, password, firstName, lastName, salesRep, accessLevel, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['test@example.com', hashedPassword, 'Test', 'User', 0, 1, 1]
        );
        userId = (userResult as any).insertId;

        // Create test data
        await pool.execute(
            'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
            ['John', 'Doe', '1234567890', 'Cardiology', userId]
        );
        await pool.execute(
            'INSERT INTO providers (firstName, lastName, npi, specialization, salesRepId) VALUES (?, ?, ?, ?, ?)',
            ['Jane', 'Smith', '0987654321', 'Dermatology', userId]
        );

        await pool.execute(
            'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
            ['Sunset Medical Center', 'Multi-specialty', '1122334455']
        );
        await pool.execute(
            'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
            ['Oceanview Health', 'Family Medicine', '5566778899']
        );

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'TestPass123!' });

        accessToken = loginResponse.body.accessToken;
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('GET /api/search/', () => {
        it('should search providers by name', async () => {
            const response = await request(app)
                .get('/api/search/?firstName=John')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should search providers by specialization', async () => {
            const response = await request(app)
                .get('/api/search/?specialization=Cardiology')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should search practices by name', async () => {
            const response = await request(app)
                .get('/api/search/?practiceName=Sunset')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return empty array for no matches', async () => {
            const response = await request(app)
                .get('/api/search/?firstName=NonExistent')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should search with multiple filters', async () => {
            const response = await request(app)
                .get('/api/search/?firstName=John&specialization=Cardiology')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
