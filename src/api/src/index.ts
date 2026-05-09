import express from 'express';
import cors from 'cors';
import { applySchema } from './db/client';
import residentsRouter from './routes/residents';
import logsRouter from './routes/logs';
import alertsRouter from './routes/alerts';
import staffRouter from './routes/staff';
import aiRouter from './routes/ai';

applySchema();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/residents', residentsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`AgeWell API running on http://localhost:${PORT}`);
});
