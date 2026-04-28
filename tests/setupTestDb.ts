import mysql from 'mysql2/promise';

/**
 * Setup test database - run this before running E2E tests
 * This script creates the test database if it doesn't exist
 */
const setupTestDb = async () => {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
    });

    try {
        await connection.execute(`CREATE DATABASE IF NOT EXISTS arcm_test`);
        console.log('Test database created or already exists: arcm_test');

        await connection.changeUser({ database: 'arcm_test' });

        // Note: You'll need to run your drizzle migrations on the test database
        // npx drizzle-kit push --config=drizzle.config.ts
        console.log('');
        console.log('IMPORTANT: Run drizzle migrations on the test database:');
        console.log('  cd packages/server');
        console.log('  MYSQL_DATABASE=arcm_test npx drizzle-kit push');
        console.log('');

    } catch (error) {
        console.error('Error setting up test database:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
};

setupTestDb();
