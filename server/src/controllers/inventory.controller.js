import * as inventoryService from '../services/inventory.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

// ── Ingredients ───────────────────────────────────────────────────────────────

export const getAllIngredients = async (req, res) => {
  try {
    const ingredients = await inventoryService.getAllIngredients();
    return successResponse(res, ingredients, 'Ingredients retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getIngredientById = async (req, res) => {
  try {
    const ingredient = await inventoryService.getIngredientById(req.params.id);
    return successResponse(res, ingredient, 'Ingredient retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const createIngredient = async (req, res) => {
  try {
    const ingredient = await inventoryService.createIngredient(req.body);
    return successResponse(res, ingredient, 'Ingredient created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const updateIngredient = async (req, res) => {
  try {
    const ingredient = await inventoryService.updateIngredient(req.params.id, req.body);
    return successResponse(res, ingredient, 'Ingredient updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deleteIngredient = async (req, res) => {
  try {
    await inventoryService.deleteIngredient(req.params.id);
    return successResponse(res, null, 'Ingredient deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

// ── Low Stock ─────────────────────────────────────────────────────────────────

export const getLowStock = async (req, res) => {
  try {
    const items = await inventoryService.getLowStockList();
    return successResponse(res, items, 'Low stock items retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

// ── Stock Adjustment ──────────────────────────────────────────────────────────

export const adjustStock = async (req, res) => {
  try {
    const { ingredientId, quantityChange, notes } = req.body;
    const result = await inventoryService.adjustStock({
      ingredientId,
      quantityChange,
      notes,
      recordedById: req.userId,
    });
    return successResponse(res, result, 'Stock adjusted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

// ── Wastage ───────────────────────────────────────────────────────────────────

export const recordWastage = async (req, res) => {
  try {
    const { ingredientId, quantity, reason } = req.body;
    const result = await inventoryService.recordWastage({
      ingredientId,
      quantity,
      reason,
      recordedById: req.userId,
    });
    return successResponse(res, result, 'Wastage recorded successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

// ── Stock Ledger ──────────────────────────────────────────────────────────────

export const getStockLedger = async (req, res) => {
  try {
    const { ingredientId, limit } = req.query;
    const ledger = await inventoryService.getStockLedger({ ingredientId, limit });
    return successResponse(res, ledger, 'Stock ledger retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

// ── Recipe ────────────────────────────────────────────────────────────────────

export const getProductRecipe = async (req, res) => {
  try {
    const recipe = await inventoryService.getProductRecipe(req.params.productId);
    return successResponse(res, recipe, 'Recipe retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const setProductRecipe = async (req, res) => {
  try {
    const { items } = req.body; // [{ ingredientId, quantity, wastagePercent }]
    const recipe = await inventoryService.setProductRecipe(req.params.productId, items);
    return successResponse(res, recipe, 'Recipe saved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};
