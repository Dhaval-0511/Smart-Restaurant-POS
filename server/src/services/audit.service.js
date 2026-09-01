import prisma from '../config/database.js';

/**
 * Log an audit action to the database.
 * @param {string} userId - The user performing the action
 * @param {string} action - Action identifier e.g. "USER_LOGIN", "PRODUCT_DELETED"
 * @param {string|object} [details] - Optional extra detail (string or JSON-serializable object)
 * @param {import('express').Request} [req] - Express request object (for IP address)
 */
export const logAuditAction = async (userId, action, details = null, req = null) => {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null)
      : null;

    const detailsStr = details
      ? (typeof details === 'string' ? details : JSON.stringify(details))
      : null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: detailsStr,
        ipAddress,
      },
    });
  } catch (err) {
    // Audit logging should never crash the main request
    console.error('[AuditLog] Failed to log action:', action, err.message);
  }
};

/**
 * Retrieve audit logs (for admin dashboard use)
 */
export const getAuditLogs = async (limit = 50, page = 1) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);
  return { logs, total };
};
