import express from 'express';
import * as kitchenController from '../controllers/kitchen.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Stats for a given date (defaults to today) — used by KDS header bar
router.get('/stats', authMiddleware, kitchenController.getKdsStats);

// Kitchen orders — supports ?date=YYYY-MM-DD&status=TO_COOK|PREPARING|COMPLETED
router.get('/orders', authMiddleware, kitchenController.getAllKitchenOrders);
router.get('/orders/:orderId', authMiddleware, kitchenController.getKitchenOrdersByOrder);
router.put('/orders/:id/status', authMiddleware, kitchenController.updateKitchenOrderStatus);
router.put('/orders/:id/assign', authMiddleware, kitchenController.assignKitchenOrder);
router.put('/orders/:id/complete', authMiddleware, kitchenController.completeKitchenOrder);

export default router;
