import prisma from '../config/database.js';

// Get start and end of a given date (defaults to today) in UTC.
// IMPORTANT: new Date("YYYY-MM-DD") parses as UTC midnight, so getDate()
// in IST can differ by ±1 day. We parse the string directly to avoid this.
const getDayBounds = (dateStr) => {
  let year, month, day;
  if (dateStr) {
    // Parse YYYY-MM-DD directly so we don't depend on timezone interpretation
    const parts = dateStr.split('-');
    year  = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // 0-indexed
    day   = parseInt(parts[2], 10);
  } else {
    // Default to today in server LOCAL time (IST)
    const now = new Date();
    year  = now.getFullYear();
    month = now.getMonth();
    day   = now.getDate();
  }
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const end   = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return { start, end };
};

export const createKitchenOrder = async (orderId, orderItemId, productId) => {
  const kitchenOrder = await prisma.kitchenOrder.create({
    data: {
      orderId,
      orderItemId,
      productId,
      status: 'TO_COOK',
    },
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true, tableId: true },
      },
      orderItem: {
        select: { quantity: true },
      },
    },
  });

  return kitchenOrder;
};

/**
 * getAllKitchenOrders
 * @param {string|null} status  - filter by KitchenStatus enum value (optional)
 * @param {string|null} date    - YYYY-MM-DD string (optional, defaults to today)
 */
export const getAllKitchenOrders = async (status = null, date = null) => {
  const { start, end } = getDayBounds(date);

  const where = {
    createdAt: { gte: start, lte: end },
    ...(status ? { status } : {}),
  };

  const orders = await prisma.kitchenOrder.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true, tableId: true, orderType: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      orderItem: {
        select: { quantity: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return orders;
};

/**
 * getKdsStats
 * Returns ticket counts for a given date (defaults to today)
 * @param {string|null} date - YYYY-MM-DD string
 */
export const getKdsStats = async (date = null) => {
  const { start, end } = getDayBounds(date);

  const [total, pending, preparing, completed] = await Promise.all([
    prisma.kitchenOrder.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.kitchenOrder.count({ where: { createdAt: { gte: start, lte: end }, status: 'TO_COOK' } }),
    prisma.kitchenOrder.count({ where: { createdAt: { gte: start, lte: end }, status: 'PREPARING' } }),
    prisma.kitchenOrder.count({ where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' } }),
  ]);

  return {
    date: date || new Date().toISOString().split('T')[0],
    total,
    pending,
    preparing,
    completed,
  };
};

export const getKitchenOrdersByOrder = async (orderId) => {
  const orders = await prisma.kitchenOrder.findMany({
    where: { orderId },
    include: {
      product: {
        select: { id: true, name: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      orderItem: {
        select: { quantity: true },
      },
    },
  });

  return orders;
};

export const updateKitchenOrderStatus = async (id, status) => {
  const kitchenOrder = await prisma.kitchenOrder.update({
    where: { id },
    data: { status },
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true },
      },
      orderItem: {
        select: { quantity: true },
      },
    },
  });

  return kitchenOrder;
};

export const assignKitchenOrder = async (id, userId) => {
  const kitchenOrder = await prisma.kitchenOrder.update({
    where: { id },
    data: { assignedToId: userId },
    include: {
      assignedTo: {
        select: { id: true, name: true },
      },
      product: {
        select: { id: true, name: true },
      },
    },
  });

  return kitchenOrder;
};

export const completeKitchenOrder = async (id) => {
  const kitchenOrder = await prisma.kitchenOrder.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      isItemCompleted: true,
    },
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true },
      },
      orderItem: {
        select: { quantity: true },
      },
    },
  });

  return kitchenOrder;
};
