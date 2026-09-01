/**
 * inventory_seed.js
 * Safe to re-run — uses upsert for ingredients, deleteMany then createMany for recipes.
 * Does NOT delete any existing orders, products, or users.
 *
 * Run: node prisma/inventory_seed.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting inventory seed...');

  // ── 1. Upsert all Ingredients ────────────────────────────────────────────
  const ingredientDefs = [
    { name: 'Arabica Coffee Beans', unitOfMeasure: 'g',     currentStock: 5000, minimumStock: 500,  costPerUnit: 1.20, isPerishable: false, shelfLifeDays: 0 },
    { name: 'Fresh Whole Milk',     unitOfMeasure: 'ml',    currentStock: 10000,minimumStock: 1500, costPerUnit: 0.07, isPerishable: true,  shelfLifeDays: 2 },
    { name: 'Organic Sugar',        unitOfMeasure: 'g',     currentStock: 3000, minimumStock: 500,  costPerUnit: 0.05, isPerishable: false, shelfLifeDays: 0 },
    { name: 'Chocolate Syrup',      unitOfMeasure: 'ml',    currentStock: 2000, minimumStock: 300,  costPerUnit: 0.40, isPerishable: false, shelfLifeDays: 0 },
    { name: 'Green Tea Leaves',     unitOfMeasure: 'g',     currentStock: 1000, minimumStock: 200,  costPerUnit: 0.80, isPerishable: false, shelfLifeDays: 0 },
    { name: 'Chai Masala',          unitOfMeasure: 'g',     currentStock: 500,  minimumStock: 100,  costPerUnit: 0.60, isPerishable: false, shelfLifeDays: 0 },
    { name: 'Sandwich Bread',       unitOfMeasure: 'slice', currentStock: 100,  minimumStock: 20,   costPerUnit: 2.00, isPerishable: true,  shelfLifeDays: 2 },
    { name: 'Cheddar Cheese',       unitOfMeasure: 'slice', currentStock: 80,   minimumStock: 15,   costPerUnit: 10.00,isPerishable: true,  shelfLifeDays: 3 },
    { name: 'Salted Butter',        unitOfMeasure: 'g',     currentStock: 1500, minimumStock: 250,  costPerUnit: 0.60, isPerishable: true,  shelfLifeDays: 5 },
    { name: 'Croissant Dough',      unitOfMeasure: 'piece', currentStock: 30,   minimumStock: 8,    costPerUnit: 25.00,isPerishable: true,  shelfLifeDays: 1 },
    { name: 'Whipped Cream',        unitOfMeasure: 'ml',    currentStock: 1000, minimumStock: 200,  costPerUnit: 0.30, isPerishable: true,  shelfLifeDays: 3 },
    { name: 'Ice Cubes',            unitOfMeasure: 'piece', currentStock: 500,  minimumStock: 100,  costPerUnit: 0.10, isPerishable: true,  shelfLifeDays: 1 },
    { name: 'Chicken Tikka',        unitOfMeasure: 'g',     currentStock: 1000, minimumStock: 200,  costPerUnit: 1.50, isPerishable: true,  shelfLifeDays: 1 },
    { name: 'Whole Wheat Wrap',     unitOfMeasure: 'piece', currentStock: 40,   minimumStock: 10,   costPerUnit: 5.00, isPerishable: true,  shelfLifeDays: 2 },
    { name: 'Cocoa Powder',         unitOfMeasure: 'g',     currentStock: 500,  minimumStock: 100,  costPerUnit: 0.80, isPerishable: false, shelfLifeDays: 0 },
    { name: 'Banana',               unitOfMeasure: 'piece', currentStock: 20,   minimumStock: 5,    costPerUnit: 4.00, isPerishable: true,  shelfLifeDays: 2 },
    { name: 'Peach Syrup',          unitOfMeasure: 'ml',    currentStock: 500,  minimumStock: 100,  costPerUnit: 0.50, isPerishable: false, shelfLifeDays: 0 },
  ];

  const ingredients = {};
  for (const def of ingredientDefs) {
    const ing = await prisma.ingredient.upsert({
      where: { name: def.name },
      update: {
        unitOfMeasure: def.unitOfMeasure,
        currentStock:  def.currentStock,
        minimumStock:  def.minimumStock,
        costPerUnit:   def.costPerUnit,
        isPerishable:  def.isPerishable,
        shelfLifeDays: def.shelfLifeDays,
      },
      create: {
        name:          def.name,
        unitOfMeasure: def.unitOfMeasure,
        currentStock:  def.currentStock,
        minimumStock:  def.minimumStock,
        costPerUnit:   def.costPerUnit,
        isPerishable:  def.isPerishable,
        shelfLifeDays: def.shelfLifeDays,
      },
    });
    ingredients[def.name] = ing.id;
    console.log(`  ✅ Ingredient: ${def.name}`);
  }

  console.log(`\n📦 ${ingredientDefs.length} ingredients upserted successfully.\n`);

  // ── 2. Fetch products by name ─────────────────────────────────────────────
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  if (products.length === 0) {
    console.log('⚠️  No products found in DB. Run custom_seed.js first, then re-run this script.');
    return;
  }

  const productMap = {};
  for (const p of products) {
    productMap[p.name] = p.id;
  }

  console.log(`🍽️  Found ${products.length} products. Mapping recipes...\n`);

  // ── 3. Define Recipes (qty = per 1 unit of product, wastagePercent = %) ───
  // Helper: gracefully skip if product or ingredient doesn't exist
  const I = (name) => ingredients[name];   // ingredient ID
  const P = (name) => productMap[name];    // product ID

  const recipeDefs = [
    // ── Hot Coffees ──────────────────────────────────────────────────────
    {
      product: 'Espresso',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 18, wastage: 5 },
      ],
    },
    {
      product: 'Americano',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 18, wastage: 5 },
      ],
    },
    {
      product: 'Cappuccino',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 18, wastage: 5 },
        { ing: 'Fresh Whole Milk',     qty: 150, wastage: 3 },
        { ing: 'Organic Sugar',        qty: 5,   wastage: 0 },
      ],
    },
    {
      product: 'Latte',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 18, wastage: 5 },
        { ing: 'Fresh Whole Milk',     qty: 200, wastage: 3 },
        { ing: 'Organic Sugar',        qty: 5,   wastage: 0 },
      ],
    },

    // ── Cold Coffees ─────────────────────────────────────────────────────
    {
      product: 'Iced Latte',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 18, wastage: 5 },
        { ing: 'Fresh Whole Milk',     qty: 180, wastage: 3 },
        { ing: 'Organic Sugar',        qty: 10,  wastage: 0 },
        { ing: 'Ice Cubes',            qty: 3,   wastage: 0 },
      ],
    },
    {
      product: 'Frappuccino',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 18, wastage: 5 },
        { ing: 'Fresh Whole Milk',     qty: 150, wastage: 3 },
        { ing: 'Chocolate Syrup',      qty: 30,  wastage: 2 },
        { ing: 'Organic Sugar',        qty: 15,  wastage: 0 },
        { ing: 'Ice Cubes',            qty: 5,   wastage: 0 },
        { ing: 'Whipped Cream',        qty: 30,  wastage: 5 },
      ],
    },
    {
      product: 'Cold Brew',
      items: [
        { ing: 'Arabica Coffee Beans', qty: 25, wastage: 5 },
        { ing: 'Ice Cubes',            qty: 4,  wastage: 0 },
      ],
    },

    // ── Teas & Infusions ─────────────────────────────────────────────────
    {
      product: 'Masala Chai',
      items: [
        { ing: 'Fresh Whole Milk',  qty: 100, wastage: 3 },
        { ing: 'Organic Sugar',     qty: 10,  wastage: 0 },
        { ing: 'Chai Masala',       qty: 3,   wastage: 0 },
      ],
    },
    {
      product: 'Green Tea',
      items: [
        { ing: 'Green Tea Leaves', qty: 5, wastage: 2 },
      ],
    },
    {
      product: 'Iced Peach Tea',
      items: [
        { ing: 'Green Tea Leaves', qty: 4,  wastage: 2 },
        { ing: 'Peach Syrup',      qty: 30, wastage: 2 },
        { ing: 'Organic Sugar',    qty: 8,  wastage: 0 },
        { ing: 'Ice Cubes',        qty: 3,  wastage: 0 },
      ],
    },

    // ── Pastries & Bakery ─────────────────────────────────────────────────
    {
      product: 'Butter Croissant',
      items: [
        { ing: 'Croissant Dough',  qty: 1,  wastage: 5 },
        { ing: 'Salted Butter',    qty: 15, wastage: 3 },
        { ing: 'Whipped Cream',    qty: 20, wastage: 5 },
      ],
    },
    {
      product: 'Chocolate Muffin',
      items: [
        { ing: 'Cocoa Powder',  qty: 20, wastage: 3 },
        { ing: 'Organic Sugar', qty: 30, wastage: 0 },
        { ing: 'Salted Butter', qty: 20, wastage: 3 },
      ],
    },
    {
      product: 'Banana Bread',
      items: [
        { ing: 'Banana',        qty: 1,  wastage: 5 },
        { ing: 'Organic Sugar', qty: 25, wastage: 0 },
        { ing: 'Salted Butter', qty: 15, wastage: 3 },
      ],
    },
    {
      product: 'Blueberry Cheesecake',
      items: [
        { ing: 'Organic Sugar',  qty: 20, wastage: 0 },
        { ing: 'Whipped Cream',  qty: 40, wastage: 5 },
        { ing: 'Salted Butter',  qty: 10, wastage: 3 },
      ],
    },

    // ── Sandwiches & Wraps ────────────────────────────────────────────────
    {
      product: 'Grilled Cheese Sandwich',
      items: [
        { ing: 'Sandwich Bread',  qty: 2,  wastage: 3 },
        { ing: 'Cheddar Cheese',  qty: 2,  wastage: 5 },
        { ing: 'Salted Butter',   qty: 15, wastage: 3 },
      ],
    },
    {
      product: 'Chicken Tikka Wrap',
      items: [
        { ing: 'Whole Wheat Wrap', qty: 1,   wastage: 3 },
        { ing: 'Chicken Tikka',    qty: 120, wastage: 5 },
        { ing: 'Organic Sugar',    qty: 2,   wastage: 0 },
      ],
    },
    {
      product: 'Veggie Club Sandwich',
      items: [
        { ing: 'Sandwich Bread', qty: 3,  wastage: 3 },
        { ing: 'Cheddar Cheese', qty: 1,  wastage: 5 },
        { ing: 'Salted Butter',  qty: 10, wastage: 3 },
      ],
    },
  ];

  // ── 4. Apply recipes — delete existing first, then create ────────────────
  let totalRecipes = 0;
  for (const rd of recipeDefs) {
    const productId = P(rd.product);
    if (!productId) {
      console.warn(`  ⚠️  Product not found: "${rd.product}" — skipping`);
      continue;
    }

    // Wipe existing recipe for this product
    await prisma.recipeItem.deleteMany({ where: { productId } });

    // Build new recipe rows (skip missing ingredients gracefully)
    const rows = [];
    for (const item of rd.items) {
      const ingredientId = I(item.ing);
      if (!ingredientId) {
        console.warn(`    ⚠️  Ingredient not found: "${item.ing}" — skipping line`);
        continue;
      }
      rows.push({
        productId,
        ingredientId,
        quantity:       item.qty,
        wastagePercent: item.wastage,
      });
    }

    if (rows.length > 0) {
      await prisma.recipeItem.createMany({ data: rows });
      totalRecipes += rows.length;
      console.log(`  🍽️  Recipe for "${rd.product}": ${rows.length} ingredient(s) mapped`);
    }
  }

  console.log(`\n✅ Inventory seed complete!`);
  console.log(`   Ingredients : ${ingredientDefs.length}`);
  console.log(`   Recipe Lines: ${totalRecipes}`);
  console.log(`\n🎯 You can now place POS orders and watch stock auto-deduct on payment.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
