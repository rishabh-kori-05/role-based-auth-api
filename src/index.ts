import 'dotenv/config';
import express from 'express';
import { env } from './config/env';
import { pool } from './config/db';
import { runMigrations } from './config/migrate';
import { pruneExpiredTokens } from './services/token.service';
import { errorHandler, notFound } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api',      userRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function start() {
  // Verify DB connection
  await pool.query('SELECT 1');
  console.log('✓ PostgreSQL connected');

  // Auto-run migrations on every startup (safe — uses IF NOT EXISTS)
  await runMigrations();
  console.log('✓ Migrations applied');

  // Start server
  app.listen(env.port, () => {
    console.log(`✓ Server running on http://localhost:${env.port}`);
    console.log(`  Environment : ${env.nodeEnv}`);
  });

  // Prune expired tokens once at startup, then every 24 hours
  pruneExpiredTokens().catch(console.error);
  setInterval(() => pruneExpiredTokens().catch(console.error), 24 * 60 * 60 * 1000);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;