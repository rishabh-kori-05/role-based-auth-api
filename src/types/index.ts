export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  is_blacklisted: boolean;
  created_at: Date;
}

export interface JwtAccessPayload {
  sub: number;       // user id
  email: string;
  role: UserRole;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: number;
  type: 'refresh';
  jti: string;       // JWT ID — matches token record in DB
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}
