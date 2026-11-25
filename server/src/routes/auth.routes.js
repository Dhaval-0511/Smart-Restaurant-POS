import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { registerValidator, loginValidator, updateUserValidator } from '../validators/auth.validator.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rate limiter: max 15 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Public routes
router.post('/register', validateRequest(registerValidator), authController.register);
router.post('/login', loginLimiter, validateRequest(loginValidator), authController.login);
router.post('/forgot-password', authController.forgotPasswordHandler);
router.post('/reset-password', authController.resetPasswordHandler);

// Protected routes (any authenticated user)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateRequest(updateUserValidator), authController.updateProfile);

// Admin-only routes: Super Admin and Branch Manager can manage staff
const adminOnly = [authMiddleware, authorizeRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN')];
router.get('/employees', ...adminOnly, authController.getAllEmployees);
router.put('/employees/:id', ...adminOnly, authController.updateEmployee);
router.delete('/employees/:id', ...adminOnly, authController.removeEmployee);
router.get('/pending-users', ...adminOnly, authController.getPendingUsersHandler);
router.patch('/approve-user/:id', ...adminOnly, authController.approveUserHandler);
router.patch('/reject-user/:id', ...adminOnly, authController.rejectUserHandler);

// Audit logs — SUPER_ADMIN and BRANCH_MANAGER only (B-3, X-4)
const superAdminOnly = [authMiddleware, authorizeRoles('SUPER_ADMIN', 'BRANCH_MANAGER')];
router.get('/audit-logs', ...superAdminOnly, authController.getAuditLogsHandler);

export default router;
