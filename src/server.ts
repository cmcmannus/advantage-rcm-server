import express from 'express';
import { User } from '../../shared/dist/User';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api', (_req, res) => {
  const user: User = { id: 1, name: 'Cole', email: 'colemcmannus@gmail.com' };
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
