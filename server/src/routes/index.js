import express from 'express';
import prisma from '../config/database.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import sessionRoutes from './session.routes.js';
import kitchenRoutes from './kitchen.routes.js';
import floorRoutes from './floor.routes.js';
import tableRoutes from './table.routes.js';
import couponRoutes from './coupon.routes.js';
import customerRoutes from './customer.routes.js';
import paymentMethodRoutes from './payment-method.routes.js';
import inventoryRoutes from './inventory.routes.js';
import reportsRoutes from './reports.routes.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── B-6: Health check endpoint ─────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status:    'ok',
      db:        'connected',
      uptime:    Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status:    'error',
      db:        'unreachable',
      timestamp: new Date().toISOString(),
    });
  }
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/sessions', sessionRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/floors', floorRoutes);
router.use('/tables', tableRoutes);
router.use('/coupons', couponRoutes);
router.use('/customers', customerRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/inventory', inventoryRoutes);
// A-1: Server-side reports — protected, admin/manager only
router.use(
  '/reports',
  authMiddleware,
  authorizeRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN'),
  reportsRoutes
);

export default router;
