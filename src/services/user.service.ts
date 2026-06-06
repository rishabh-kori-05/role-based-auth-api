import { query } from '../config/db';
import { AppError } from '../middleware/error.middleware';
import { User, UserRole } from '../types';

export async function getAllUsers() {
  const result = await query<Pick<User, 'id' | 'email' | 'role' | 'created_at'>>(
    'SELECT id, email, role, created_at FROM users ORDER BY id ASC'
  );
  return result.rows;
}

export async function getUserById(id: number) {
  const result = await query<Pick<User, 'id' | 'email' | 'role' | 'created_at'>>(
    'SELECT id, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  const user = result.rows[0];
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function updateUserRole(id: number, role: UserRole) {
  const result = await query<Pick<User, 'id' | 'email' | 'role'>>(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, email, role`,
    [role, id]
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }
  return result.rows[0];
}
