import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authenticateToken } from '../../src/middleware/auth.js';
import auth_routes from '../../src/routes/auth_routes.js';
import actions from '../../src/routes/action_routes.js';
import clearing_houses from '../../src/routes/clearing_house_routes.js';
import ehr_systems from '../../src/routes/ehr_system_routes.js';
import follow_ups from '../../src/routes/follow_up_reason_routes.js';
import locations from '../../src/routes/locations_routes.js';
import notes from '../../src/routes/note_routes.js';
import pm_systems from '../../src/routes/pm_system_routes.js';
import practices from '../../src/routes/practice_routes.js';
import providers from '../../src/routes/provider_routes.js';
import search from '../../src/routes/search_routes.js';
import statuses from '../../src/routes/status_routes.js';
import users from '../../src/routes/user_routes.js';
import initConfig from '../../src/utils/config.js';

export const createTestApp = () => {
    initConfig();

    const app = express();
    const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

    app.use(express.json());

    const corsOptions = {
        origin: APP_BASE_URL,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        optionsSuccessStatus: 204
    };

    app.use(cors(corsOptions));

    app.use('/api/auth/', auth_routes);
    app.use(authenticateToken);

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
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

    return app;
};
