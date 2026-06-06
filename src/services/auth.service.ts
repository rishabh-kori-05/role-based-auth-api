import bcrypt from 'bcrypt';
import { query } from '../config/db';
import { AppError } from '../middleware/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  blacklistRefreshToken,
  verifyRefreshToken,
} from './token.service';
import { User } from '../types';

const SALT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(email: string, password: string) {
  // Check duplicate
  const existing = await query<Pick<User, 'id'>>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query<Pick<User, 'id' | 'email' | 'role' | 'created_at'>>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, role, created_at`,
    [email, passwordHash]
  );

  return result.rows[0];
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new AppError(401, 'Invalid email or password');
  }

  const accessToken  = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await saveRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refreshAccessToken(token: string) {
  // 1. Verify JWT signature & expiry
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new AppError(401, 'Invalid token type');
  }

  // 2. Check DB record
  const record = await findRefreshToken(token);
  if (!record) {
    throw new AppError(401, 'Refresh token not found');
  }
  if (record.is_blacklisted) {
    throw new AppError(401, 'Refresh token has been revoked');
  }
  if (new Date(record.expires_at) < new Date()) {
    throw new AppError(401, 'Refresh token expired');
  }

  // 3. Fetch user
  const userResult = await query<Pick<User, 'id' | 'email' | 'role'>>(
    'SELECT id, email, role FROM users WHERE id = $1',
    [record.user_id]
  );
  const user = userResult.rows[0];
  if (!user) {
    throw new AppError(401, 'User not found');
  }

  // 4. Issue new access token (refresh token stays the same)
  const accessToken = generateAccessToken(user.id, user.email, user.role);

  return { accessToken };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(token: string) {
  const record = await findRefreshToken(token);
  if (!record) {
    throw new AppError(400, 'Refresh token not found');
  }
  await blacklistRefreshToken(token);
}
