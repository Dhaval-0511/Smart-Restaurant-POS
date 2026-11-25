import prisma from '../config/database.js';

/**
 * Generates a unique order number for the current day.
 * Accepts an optional Prisma transaction client (tx) so it can run safely
 * inside a $transaction block and avoid race conditions.
 */
export const generateOrderNumber = async (tx = prisma) => {
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = now.getFullYear();
  const dateStr = `${day}${month}${year}`;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const count = await tx.order.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `ORD-${dateStr}${sequence}`;
};
