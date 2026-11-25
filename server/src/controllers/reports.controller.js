/**
 * reports.controller.js — Server-side SQL aggregation for the Reports dashboard.
 * Replaces the client-side useMemo() computation on stale Zustand orders.
 * All queries run directly against PostgreSQL so the numbers are always accurate
 * regardless of what is loaded in the browser's local state.
 */
import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Default: last 30 days
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end   = to   ? new Date(to)   : new Date();

    const whereClause = { status: 'PAID', createdAt: { gte: start, lte: end } };

    const [
      totalOrders,
      revenueAgg,
      topProductsRaw,
      ordersPerDay,
    ] = await Promise.all([
      // Total paid orders in period
      prisma.order.count({ where: whereClause }),

      // Revenue / tax / discount totals
      prisma.order.aggregate({
        where: whereClause,
        _sum:  { total: true, taxAmount: true, discountAmount: true },
        _avg:  { total: true },
      }),

      // Top 10 products by revenue in period
      prisma.orderItem.groupBy({
        by:      ['productId'],
        where:   { order: whereClause },
        _sum:    { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: 'desc' } },
        take:    10,
      }),

      // Daily order count + revenue for the period (for sparklines)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', "createdAt") AS day,
          COUNT(*)::int                  AS orders,
          SUM(total)::float              AS revenue
        FROM orders
        WHERE status = 'PAID'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    ]);

    // Enrich top products with their names
    const productIds = topProductsRaw.map((r) => r.productId);
    const products   = await prisma.product.findMany({
      where:  { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

    const topProducts = topProductsRaw.map((r) => ({
      productId: r.productId,
      name:      nameMap[r.productId] ?? 'Unknown',
      quantity:  Number(r._sum.quantity ?? 0),
      revenue:   Number(r._sum.lineTotal ?? 0),
    }));

    return successResponse(res, {
      period: { from: start.toISOString(), to: end.toISOString() },
      totalOrders,
      totalRevenue:  Number(revenueAgg._sum.total        ?? 0),
      totalTax:      Number(revenueAgg._sum.taxAmount    ?? 0),
      totalDiscount: Number(revenueAgg._sum.discountAmount ?? 0),
      avgOrderValue: Number(revenueAgg._avg.total        ?? 0),
      topProducts,
      dailyBreakdown: ordersPerDay.map((r) => ({
        day:     r.day,
        orders:  r.orders,
        revenue: r.revenue,
      })),
    }, 'Reports summary retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};
