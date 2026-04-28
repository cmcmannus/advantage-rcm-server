import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import initConfig from '../utils/config.js';

let pool: mysql.Pool;

export const initDb = () => {
    if (!process.env.MYSQL_HOST) {
        initConfig();
    }

    pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE || 'arcm',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    return drizzle(pool);
}

export const closeDb = async () => {
    if (pool) {
        await pool.end();
    }
}
