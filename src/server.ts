import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { authenticateToken } from './middleware/auth.js';
import { closeDb } from './db/client.js';
import auth_routes from './routes/auth_routes.js';

import actions from './routes/action_routes.js';
import clearing_houses from './routes/clearing_house_routes.js';
import ehr_systems from './routes/ehr_system_routes.js';
import follow_ups from './routes/follow_up_reason_routes.js';
import locations from './routes/locations_routes.js';
import notes from './routes/note_routes.js';
import pm_systems from './routes/pm_system_routes.js';
import practices from './routes/practice_routes.js';
import providers from './routes/provider_routes.js';
import search from './routes/search_routes.js';
import statuses from './routes/status_routes.js';
import users from './routes/user_routes.js';
import initConfig from './utils/config.js';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later' }
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

async function run() {
    initConfig();

    const app = express();
    const SERVER_PORT = process.env.PORT || 3000;
    const APP_BASE_URL = (process.env.APP_BASE_URL || `http://localhost:5173`);

    console.log('CORS allowed origin:', APP_BASE_URL);

    app.use(generalLimiter);
    app.use(morgan('combined'));
    app.use(express.json());

    const corsOptions = {
        origin: APP_BASE_URL,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        optionsSuccessStatus: 204
    }

    app.use(cors(corsOptions));

    app.use('/api/auth/', authLimiter, auth_routes);
    app.use(authenticateToken);

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api/actions/', actions);
    app.use('/api/clearing-houses/', clearing_houses);
    app.use('/api/ehr-systems/', ehr_systems);
    app.use('/api/follow-up-reasons/', follow_ups);
    app.use('/api/locations/', locations);
    app.use('/api/notes/', notes);
    app.use('/api/pm-systems/', pm_systems);
    app.use('/api/practices/', practices);
    app.use('/api/providers/', providers);
    app.use('/api/search/', search);
    app.use('/api/statuses/', statuses);
    app.use('/api/users/', users);

    const server = app.listen(Number(SERVER_PORT), '0.0.0.0', () => {
        console.log(`🚀 Backend running at http://localhost:${SERVER_PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        server.close(async () => {
            await closeDb();
            console.log('Database connection closed');
            console.log('HTTP server closed');
            process.exit(0);
        });
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

run().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});
