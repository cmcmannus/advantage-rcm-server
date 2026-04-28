import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { createTestApp } from '../helpers/testApp.js';

jest.setTimeout(30000);

describe('Practices E2E Tests', () => {
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

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'TestPass123!' });

        accessToken = loginResponse.body.accessToken;
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('POST /api/practices/', () => {
        it('should create a practice', async () => {
            const practiceData = {
                name: 'Sunset Medical Center',
                specialization: 'Multi-specialty',
                npi: '1122334455'
            };

            const response = await request(app)
                .post('/api/practices/')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(practiceData);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('Sunset Medical Center');
            expect(response.body.npi).toBe('1122334455');
        });

        it('should fail with missing required fields', async () => {
            const response = await request(app)
                .post('/api/practices/')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(500);
        });
    });

    describe('GET /api/practices/', () => {
        beforeEach(async () => {
            await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Sunset Medical Center', 'Multi-specialty', '1122334455']
            );
            await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Oceanview Health', 'Family Medicine', '5566778899']
            );
        });

        it('should get all practices', async () => {
            const response = await request(app)
                .get('/api/practices/')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
        });

        it('should filter practices by name', async () => {
            const response = await request(app)
                .get('/api/practices/?name=Sunset')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.every((p: any) => p.name.includes('Sunset'))).toBe(true);
        });
    });

    describe('GET /api/practices/:id', () => {
        let practiceId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Sunset Medical Center', 'Multi-specialty', '1122334455']
            );
            practiceId = (result as any).insertId;
        });

        it('should get practice by id', async () => {
            const response = await request(app)
                .get(`/api/practices/${practiceId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(practiceId);
            expect(response.body.name).toBe('Sunset Medical Center');
        });

        it('should return 404 for non-existent practice', async () => {
            const response = await request(app)
                .get('/api/practices/99999')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/practices/:id', () => {
        let practiceId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Sunset Medical Center', 'Multi-specialty', '1122334455']
            );
            practiceId = (result as any).insertId;
        });

        it('should update practice', async () => {
            const response = await request(app)
                .put(`/api/practices/${practiceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    id: practiceId,
                    name: 'Sunset Medical Center Updated',
                    specialization: 'Multi-specialty',
                    npi: '1122334455'
                });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Sunset Medical Center Updated');
        });
    });

    describe('DELETE /api/practices/:id', () => {
        let practiceId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Sunset Medical Center', 'Multi-specialty', '1122334455']
            );
            practiceId = (result as any).insertId;
        });

        it('should delete practice', async () => {
            const response = await request(app)
                .delete(`/api/practices/${practiceId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Practice deleted successfully.');
        });
    });

    describe('Practice Locations', () => {
        let practiceId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Sunset Medical Center', 'Multi-specialty', '1122334455']
            );
            practiceId = (result as any).insertId;
        });

        it('should create a practice location', async () => {
            const locationData = {
                practiceId,
                address1: '123 Main St',
                city: 'Springfield',
                state: 'IL',
                zip: '62701',
                phone: '5551234567',
                name: 'Main Office'
            };

            const response = await request(app)
                .post(`/api/practices/${practiceId}/locations`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(locationData);

            expect(response.status).toBe(200);
            expect(response.body.address1).toBe('123 Main St');
            expect(response.body.city).toBe('Springfield');
        });

        it('should get practice locations', async () => {
            const [locResult] = await pool.execute(
                'INSERT INTO locations (address_1, city, state, zip) VALUES (?, ?, ?, ?)',
                ['123 Main St', 'Springfield', 'IL', '62701']
            );
            const locationId = (locResult as any).insertId;

            await pool.execute(
                'INSERT INTO practice_locations (practice_id, location_id, name) VALUES (?, ?, ?)',
                [practiceId, locationId, 'Main Office']
            );

            const response = await request(app)
                .get(`/api/practices/${practiceId}/locations`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('Favorites', () => {
        let practiceId: number;

        beforeEach(async () => {
            const [result] = await pool.execute(
                'INSERT INTO practices (name, specialization, npi) VALUES (?, ?, ?)',
                ['Sunset Medical Center', 'Multi-specialty', '1122334455']
            );
            practiceId = (result as any).insertId;
        });

        it('should add practice to favorites', async () => {
            const response = await request(app)
                .post(`/api/practices/${practiceId}/favorite`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Provider marked as favorite.');
        });

        it('should remove practice from favorites', async () => {
            await request(app)
                .post(`/api/practices/${practiceId}/favorite`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(app)
                .delete(`/api/practices/${practiceId}/favorite`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Provider removed from favorites.');
        });
    });
});
