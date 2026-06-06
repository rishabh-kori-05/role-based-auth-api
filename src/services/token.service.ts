import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { query } from '../config/db';
import { JwtAccessPayload, JwtRefreshPayload, UserRole } from '../types';

// ─── Access Token ─────────────────────────────────────────────────────────────

export function generateAccessToken(
  userId: number,
  email: string,
  role: UserRole
): string {
  const payload: Omit<JwtAccessPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    role,
    type: 'access',
  };
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

/** 7 days in milliseconds */
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateRefreshToken(userId: number): string {
  const jti = crypto.randomUUID();
  const payload: Omit<JwtRefreshPayload, 'iat' | 'exp'> = {
    sub: userId,
    type: 'refresh',
    jti,
  };
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function saveRefreshToken(
  userId: number,
  token: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
}

export async function findRefreshToken(token: string) {
  const result = await query<{
    id: number;
    user_id: number;
    expires_at: Date;
    is_blacklisted: boolean;
  }>(
    `SELECT id, user_id, expires_at, is_blacklisted
     FROM refresh_tokens
     WHERE token = $1`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function blacklistRefreshToken(token: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET is_blacklisted = TRUE WHERE token = $1`,
    [token]
  );
}

/** Convenience: verify + decode refresh JWT */
export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as unknown as JwtRefreshPayload;
}

/** House-keeping: delete expired tokens older than 1 day */
export async function pruneExpiredTokens(): Promise<void> {
  await query(
    `DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '1 day'`
  );
}
