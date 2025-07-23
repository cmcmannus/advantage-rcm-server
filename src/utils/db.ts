import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: 'arcm',
});

export function extractSingleResult<T>(rows: T[]): T {
    if (!rows || rows.length === 0) {
        throw new Error("Expected result set is empty");
    }

    return rows[0];
}

export function extractList<T>(rows: T[]): T[] {
    if (!rows || rows.length === 0) {
        throw new Error("Expected result set is empty");
    }

    return rows;
}
