import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateRoleSchema } from '../validators/user.validator';
import * as UserController from '../controllers/user.controller';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route  GET /api/profile
 * @access Any authenticated user
 */
router.get('/profile', UserController.getProfile);

/**
 * @route  GET /api/users
 * @access admin only
 */
router.get('/users', requireRole('admin'), UserController.listUsers);

/**
 * @route  PUT /api/users/:id/role
 * @access admin only
 */
router.put(
  '/users/:id/role',
  requireRole('admin'),
  validate(updateRoleSchema),
  UserController.changeUserRole
);

export default router;
