import prisma from '../config/database.js';

// ── Ingredients CRUD ─────────────────────────────────────────────────────────

export const getAllIngredients = async () => {
  return prisma.ingredient.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { recipeItems: true } },
    },
  });
};

export const getIngredientById = async (id) => {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      recipeItems: { include: { product: { select: { id: true, name: true } } } },
      stockLedgers: { orderBy: { createdAt: 'desc' }, take: 20, include: { recordedBy: { select: { name: true } } } },
    },
  });
  if (!ingredient) throw new Error('Ingredient not found');
  return ingredient;
};

export const createIngredient = async (data) => {
  return prisma.ingredient.create({ data });
};

export const updateIngredient = async (id, data) => {
  return prisma.ingredient.update({ where: { id }, data });
};

export const deleteIngredient = async (id) => {
  return prisma.ingredient.delete({ where: { id } });
};

// ── Low Stock ─────────────────────────────────────────────────────────────────

export const getLowStockIngredients = async () => {
  return prisma.ingredient.findMany({
    where: { currentStock: { lte: prisma.ingredient.fields.minimumStock } },
    orderBy: { currentStock: 'asc' },
  });
};

// Fetch low stock using raw comparison (Prisma doesn't support field-to-field WHERE easily)
export const getLowStockList = async () => {
  return prisma.$queryRaw`
    SELECT id, name, "unitOfMeasure", "currentStock", "minimumStock", "costPerUnit",
           "isPerishable", "shelfLifeDays"
    FROM ingredients
    WHERE "currentStock" <= "minimumStock"
    ORDER BY "isPerishable" DESC, "currentStock" ASC
  `;
};

// ── Manual Stock Adjustment ───────────────────────────────────────────────────

export const adjustStock = async ({ ingredientId, quantityChange, notes, recordedById }) => {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
  if (!ingredient) throw new Error('Ingredient not found');

  const newStock = Number(ingredient.currentStock) + Number(quantityChange);
  if (newStock < 0) throw new Error('Insufficient stock — adjustment would result in negative stock');

  const [updated, ledger] = await prisma.$transaction([
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: newStock },
    }),
    prisma.stockLedger.create({
      data: {
        ingredientId,
        movementType: quantityChange >= 0 ? 'PURCHASE_RECEIPT' : 'MANUAL_ADJUSTMENT',
        quantityChange: Number(quantityChange),
        resultingStock: newStock,
        notes,
        recordedById: recordedById || null,
      },
    }),
  ]);

  return { ingredient: updated, ledger };
};

// ── Wastage Recording ─────────────────────────────────────────────────────────

export const recordWastage = async ({ ingredientId, quantity, reason, recordedById }) => {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
  if (!ingredient) throw new Error('Ingredient not found');

  const newStock = Number(ingredient.currentStock) - Number(quantity);
  if (newStock < 0) throw new Error('Wastage quantity exceeds current stock');

  const [wastage, updated] = await prisma.$transaction([
    prisma.wastageRecord.create({
      data: { ingredientId, quantity: Number(quantity), reason, recordedById },
    }),
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: newStock },
    }),
    prisma.stockLedger.create({
      data: {
        ingredientId,
        movementType: 'WASTAGE',
        quantityChange: -Number(quantity),
        resultingStock: newStock,
        notes: `Wastage: ${reason}`,
        recordedById,
      },
    }),
  ]);

  return { wastage, ingredient: updated };
};

// ── Stock Ledger (audit trail) ────────────────────────────────────────────────

export const getStockLedger = async ({ ingredientId, limit = 50 } = {}) => {
  return prisma.stockLedger.findMany({
    where: ingredientId ? { ingredientId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    include: {
      ingredient: { select: { name: true, unitOfMeasure: true } },
      recordedBy: { select: { name: true } },
    },
  });
};

// ── Recipe Management ─────────────────────────────────────────────────────────

export const getProductRecipe = async (productId) => {
  return prisma.recipeItem.findMany({
    where: { productId },
    include: {
      ingredient: { select: { id: true, name: true, unitOfMeasure: true, currentStock: true, minimumStock: true } },
    },
    orderBy: { ingredient: { name: 'asc' } },
  });
};

export const setProductRecipe = async (productId, items) => {
  // items: [{ ingredientId, quantity, wastagePercent }]
  // Full replace — delete existing then create new
  await prisma.recipeItem.deleteMany({ where: { productId } });

  if (!items || items.length === 0) return [];

  const created = await prisma.recipeItem.createMany({
    data: items.map((item) => ({
      productId,
      ingredientId: item.ingredientId,
      quantity: Number(item.quantity),
      wastagePercent: Number(item.wastagePercent ?? 0),
    })),
  });

  return prisma.recipeItem.findMany({
    where: { productId },
    include: { ingredient: true },
  });
};

// ── Auto-Deduction on Order Payment ──────────────────────────────────────────

export const deductStockForOrder = async (orderId, recordedById) => {
  // Get all order items with their quantities
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true },
  });

  for (const item of orderItems) {
    const recipe = await prisma.recipeItem.findMany({
      where: { productId: item.productId },
      include: { ingredient: true },
    });

    for (const ri of recipe) {
      // Total consumption = qty ordered × ingredient per unit × (1 + wastage%)
      const totalConsumption =
        Number(item.quantity) *
        Number(ri.quantity) *
        (1 + Number(ri.wastagePercent) / 100);

      const currentIngredient = await prisma.ingredient.findUnique({
        where: { id: ri.ingredientId },
      });
      if (!currentIngredient) continue;

      const newStock = Math.max(0, Number(currentIngredient.currentStock) - totalConsumption);

      await prisma.$transaction([
        prisma.ingredient.update({
          where: { id: ri.ingredientId },
          data: { currentStock: newStock },
        }),
        prisma.stockLedger.create({
          data: {
            ingredientId: ri.ingredientId,
            movementType: 'SALE_DEDUCTION',
            quantityChange: -totalConsumption,
            resultingStock: newStock,
            referenceId: orderId,
            notes: `Auto-deducted for order ${orderId}`,
            recordedById: recordedById || null,
          },
        }),
      ]);
    }
  }
};
