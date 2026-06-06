/**
 * Run with:  npm run db:migrate
 * OR auto-called on server startup via runMigrations()
 * Creates all necessary tables if they don't already exist.
 */
import { pool } from './db';

const SQL = `
-- Enable pgcrypto for gen_random_uuid (optional but handy)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Refresh tokens table (blacklist + expiry tracking)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id             SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token          TEXT UNIQUE NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token    ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id  ON refresh_tokens(user_id);
`;

/** Exported for use in index.ts on server startup */
export async function runMigrations(): Promise<void> {
  await pool.query(SQL);
}

/** Standalone script: npm run db:migrate */
async function migrate() {
  console.log('Running migrations…');
  await runMigrations();
  console.log('Migrations complete.');
  await pool.end();
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}