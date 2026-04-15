import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        host: 'colefusion-lab',
        port: 3306,
        user: 'arcm_api',
        password: '3-URwrf58FF*',
        database: 'arcm'
    }
});