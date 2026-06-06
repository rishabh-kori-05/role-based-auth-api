import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';
import { UserRole } from '../types';

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({
      status: 'success',
      data: { users, count: users.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.user is set by authenticate middleware
    const userId = req.user!.sub;
    const user = await UserService.getUserById(userId);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function changeUserRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id   = Number(req.params.id);
    const role = req.body.role as UserRole;

    const updated = await UserService.updateUserRole(id, role);

    res.status(200).json({
      status: 'success',
      message: 'User role updated',
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
}
