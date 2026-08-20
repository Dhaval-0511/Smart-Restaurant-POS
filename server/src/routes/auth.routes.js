import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { registerValidator, loginValidator, updateUserValidator } from '../validators/auth.validator.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerValidator), authController.register);
router.post('/login', validateRequest(loginValidator), authController.login);
router.post('/forgot-password', authController.forgotPasswordHandler);
router.post('/reset-password', authController.resetPasswordHandler);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/employees', authMiddleware, authController.getAllEmployees);
router.put('/profile', authMiddleware, validateRequest(updateUserValidator), authController.updateProfile);
router.put('/employees/:id', authMiddleware, authController.updateEmployee);
router.delete('/employees/:id', authMiddleware, authController.removeEmployee);

// Admin: pending user management
router.get('/pending-users', authMiddleware, authController.getPendingUsersHandler);
router.patch('/approve-user/:id', authMiddleware, authController.approveUserHandler);
router.patch('/reject-user/:id', authMiddleware, authController.rejectUserHandler);

export default router;
