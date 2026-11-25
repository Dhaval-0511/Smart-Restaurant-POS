import prisma from '../config/database.js';
import { generateOrderNumber } from '../utils/order.util.js';

export const createOrder = async (data) => {
  const { sessionId, tableId, customerId, items, orderType = 'DINE_IN' } = data;
  let { employeeId } = data;

  // ── Validate session exists ───────────────────────────────────────────────
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');

  // ── Validate employee; fall back to first user if not found ──────────────
  let userExists = null;
  if (employeeId) {
    userExists = await prisma.user.findUnique({ where: { id: String(employeeId) } }).catch(() => null);
  }
  if (!userExists) {
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) throw new Error('No users found to assign to order');
    employeeId = defaultUser.id;
  }

  // ── B-5: Batch-fetch all products in one query (avoid N+1) ───────────────
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // ── Build order items & totals ────────────────────────────────────────────
  let subtotal = 0;
  let taxAmount = 0;

  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);

    const unitPrice  = parseFloat(product.price);
    const quantity   = parseFloat(item.quantity);
    const lineTotal  = Math.round(unitPrice * quantity * 100) / 100;
    const tax        = Math.round((lineTotal * parseFloat(product.tax)) / 100 * 100) / 100;

    subtotal  += lineTotal;
    taxAmount += tax;

    return {
      productId:      item.productId,
      quantity,
      unitPrice,
      lineTotal,
      discountAmount: item.discountAmount || 0,
      promotionId:    item.promotionId,
    };
  });

  subtotal  = Math.round(subtotal  * 100) / 100;
  taxAmount = Math.round(taxAmount * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // ── A-4: Wrap order creation + item inserts in a single transaction ───────
  // A-6: generateOrderNumber runs inside the transaction; on a P2002 unique
  //      conflict (race between two simultaneous orders) the tx is retried once.
  const createInTx = async () => {
    return prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx);
      return tx.order.create({
        data: {
          orderNumber,
          orderType,
          sessionId,
          tableId:    tableId || null,
          customerId,
          employeeId,
          status:     'DRAFT',
          subtotal,
          taxAmount,
          discountAmount: 0,
          total,
          orderItems: { createMany: { data: orderItems } },
        },
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, price: true } } } },
          employee:   { select: { id: true, name: true } },
        },
      });
    });
  };

  try {
    return await createInTx();
  } catch (err) {
    // Retry once on unique constraint violation for orderNumber (concurrent orders)
    if (err?.code === 'P2002' && err?.meta?.target?.includes('orderNumber')) {
      return await createInTx();
    }
    throw err;
  }
};

export const getOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      },
      employee: {
        select: { id: true, name: true },
      },
      table: {
        select: { id: true, tableNumber: true },
      },
      customer: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

export const getOrdersBySession = async (sessionId, limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const orders = await prisma.order.findMany({
    where: { sessionId },
    skip,
    take: parseInt(limit),
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      },
      employee: {
        select: { id: true, name: true },
      },
      kitchenOrders: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.order.count({
    where: { sessionId },
  });

  return { orders, total };
};

export const updateOrderStatus = async (orderId, status, paymentDetails = {}) => {
  // ── B-4: Enforce valid status transitions ─────────────────────────────────
  const VALID_TRANSITIONS = {
    DRAFT:     ['PAID', 'CANCELLED'],
    PAID:      [],           // PAID is terminal — no further transitions
    CANCELLED: [],           // CANCELLED is terminal
  };

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!existing) throw new Error('Order not found');

  const allowed = VALID_TRANSITIONS[existing.status];
  if (allowed === undefined || !allowed.includes(status)) {
    throw new Error(
      `Invalid status transition: cannot move order from '${existing.status}' to '${status}'`
    );
  }

  const { paymentMethod, paymentReference } = paymentDetails;
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(paymentMethod    ? { paymentMethod }    : {}),
      ...(paymentReference ? { paymentReference } : {}),
    },
    include: {
      orderItems: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  return order;
};

export const addItemToOrder = async (orderId, productId, quantity) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const unitPrice = parseFloat(product.price);
  const qty = parseFloat(quantity);
  const lineTotal = unitPrice * qty;
  const itemTax = (lineTotal * parseFloat(product.tax)) / 100;

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      quantity: qty,
      unitPrice,
      lineTotal,
      discountAmount: 0,
    },
    include: {
      product: {
        select: { id: true, name: true },
      },
    },
  });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: { increment: lineTotal },
      taxAmount: { increment: itemTax },
      total: { increment: lineTotal + itemTax },
    },
  });

  return { orderItem, order: updatedOrder };
};

export const removeItemFromOrder = async (orderItemId) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
  });

  if (!orderItem) {
    throw new Error('Order item not found');
  }

  const product = await prisma.product.findUnique({
    where: { id: orderItem.productId },
  });

  const itemTax = (orderItem.lineTotal * parseFloat(product.tax)) / 100;

  await prisma.order.update({
    where: { id: orderItem.orderId },
    data: {
      subtotal: { decrement: orderItem.lineTotal },
      taxAmount: { decrement: itemTax },
      total: { decrement: orderItem.lineTotal + itemTax },
    },
  });

  await prisma.orderItem.delete({
    where: { id: orderItemId },
  });

  return { success: true };
};

export const applyDiscount = async (orderId, discountAmount) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      discountAmount,
      total: { decrement: discountAmount },
    },
  });

  return order;
};
