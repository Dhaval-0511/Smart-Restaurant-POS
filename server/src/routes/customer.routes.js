import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, customerController.getAllCustomers);
router.post('/', authMiddleware, customerController.createCustomer);
router.get('/:id', authMiddleware, customerController.getCustomerById);
router.put('/:id', authMiddleware, customerController.updateCustomer);
// S-1: Only admins can delete customers — Cashiers and Kitchen Staff cannot
router.delete('/:id', authMiddleware, authorizeRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN'), customerController.deleteCustomer);

export default router;
