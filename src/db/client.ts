import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import initConfig from '../utils/config.js';

let pool;

export const initDb = (params?: {
    MYSQL_HOST: string;
    MYSQL_USER: string;
    MYSQL_PASSWORD: string;
    MYSQL_DATABASE?: string;
}) => {
    if (!process.env.MYSQL_HOST) {
        initConfig();
    }

    const settings = Object.assign({}, process.env, params);

    pool = mysql.createPool({
        host: settings.MYSQL_HOST,
        user: settings.MYSQL_USER,
        password: settings.MYSQL_PASSWORD,
        database: settings.MYSQL_DATABASE || 'arcm',
    });
    return drizzle(pool);
}
