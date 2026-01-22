import express from 'express';
import cors from 'cors';

import { authenticateToken } from './middleware/auth.js';

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

if (!process.env.MYSQL_HOST) {
    initConfig();
}

const app = express();
const PORT = process.env.PORT || 3000;
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:5173`;

console.log('CORS allowed origin:', APP_BASE_URL);

app.use(express.json());

const corsOptions = {
  origin: APP_BASE_URL,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow Authorization header
  credentials: true,
  optionsSuccessStatus: 204 // For preflight requests
}

app.use(cors(corsOptions));

app.use('/api/auth/', auth_routes);
app.use(authenticateToken);

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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
