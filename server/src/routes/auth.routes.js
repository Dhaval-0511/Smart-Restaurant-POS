import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { registerValidator, loginValidator, updateUserValidator } from '../validators/auth.validator.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerValidator), authController.register);
router.post('/login', validateRequest(loginValidator), authController.login);
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

export default router;
