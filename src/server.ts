import express from 'express';
import path from "path";
import { authenticateToken } from './middleware/auth';

import auth from './routes/auth_routes';

import action from './routes/action_routes';
import clearing_house from './routes/clearing_house_routes';
import ehr_system from './routes/ehr_system_routes';
import follow_up from './routes/follow_up_reason_routes';
import pm_system from './routes/pm_system_routes';
import status from './routes/status_routes';
import users from './routes/user_routes';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from React build
app.use(express.static(path.resolve(__dirname, "../client/dist")));

app.use(authenticateToken);

app.use(auth)

app.use('/api/actions/', action);
app.use('/api/clearing_houses/', clearing_house);
app.use('/api/ehr_systems/', ehr_system);
app.use('/api/follow_ups/', follow_up);
app.use('/api/pm_systems/', pm_system);
app.use('/api/statuses/', status);
app.use('/api/users/', users);

// Fallback to index.html for SPA routes
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
