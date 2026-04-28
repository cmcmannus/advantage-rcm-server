import { initDb } from '../src/db/client.js';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Setup test database connection
export const setupTestDb = () => {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'arcm_test',
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
    });
    return drizzle(pool);
};

// Clean up database tables between tests
export const cleanupTestDb = async (db: ReturnType<typeof drizzle>) => {
    // Delete in order respecting foreign key constraints
    const tables = [
        'user_favorites',
        'provider_practice_locations',
        'practice_locations',
        'locations',
        'notes',
        'providers',
        'practices',
        'users',
        'actions',
        'statuses',
        'follow_up_reasons',
        'ehr_systems',
        'pm_systems',
        'clearing_houses'
    ];

    for (const table of tables) {
        await db.execute(`DELETE FROM ${table}`);
    }
};
