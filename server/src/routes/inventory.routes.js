import express from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authMiddleware, authorizeRoles, INV_ROLES } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All inventory routes require authentication
router.use(authMiddleware);

// ── Ingredients ───────────────────────────────────────────────────────────────
router.get('/ingredients', inventoryController.getAllIngredients);
router.get('/ingredients/:id', inventoryController.getIngredientById);
router.post('/ingredients', authorizeRoles(...INV_ROLES), inventoryController.createIngredient);
router.put('/ingredients/:id', authorizeRoles(...INV_ROLES), inventoryController.updateIngredient);
router.delete('/ingredients/:id', authorizeRoles(...INV_ROLES), inventoryController.deleteIngredient);

// ── Low Stock Alert ───────────────────────────────────────────────────────────
router.get('/low-stock', inventoryController.getLowStock);

// ── Stock Movements ───────────────────────────────────────────────────────────
router.post('/adjust', authorizeRoles(...INV_ROLES), inventoryController.adjustStock);
router.post('/wastage', authorizeRoles(...INV_ROLES), inventoryController.recordWastage);
router.get('/ledger', inventoryController.getStockLedger);

// ── Recipe Builder ─────────────────────────────────────────────────────────────
// Nested under /inventory/products/:productId/recipe for clarity
router.get('/products/:productId/recipe', inventoryController.getProductRecipe);
router.post('/products/:productId/recipe', authorizeRoles(...INV_ROLES), inventoryController.setProductRecipe);

export default router;
