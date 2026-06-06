import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../validators/auth.validator';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

/**
 * @route  POST /api/auth/register
 * @access Public
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @route  POST /api/auth/login
 * @access Public
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @route  POST /api/auth/refresh
 * @access Public
 */
router.post('/refresh', validate(refreshSchema), AuthController.refresh);

/**
 * @route  POST /api/auth/logout
 * @access Public (token in body)
 */
router.post('/logout', validate(logoutSchema), AuthController.logout);

export default router;
