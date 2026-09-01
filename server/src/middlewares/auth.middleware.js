import { verifyToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';
import prisma from '../config/database.js';

// Roles that have admin-level system access
export const ADMIN_ROLES = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN'];
// Roles that can access POS terminal
export const POS_ROLES   = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'ADMIN', 'EMPLOYEE'];
// Roles that can access Kitchen Display
export const KDS_ROLES   = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'KITCHEN_STAFF', 'ADMIN', 'EMPLOYEE'];
// Roles that can access inventory management
export const INV_ROLES   = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'ADMIN'];

/**
 * authMiddleware — verifies JWT and attaches decoded user to req.user
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'No token provided', 401);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    // Attach userId and role from token (no extra DB query needed)
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Lazy-load full user object only when needed
    req.getUser = async () => {
      if (!req._user) {
        req._user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, name: true, email: true, role: true, isArchived: true, status: true },
        });
      }
      return req._user;
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 401, error);
  }
};

/**
 * authorizeRoles(...roles) — factory middleware for role-based access control
 * Usage: router.get('/admin/settings', authMiddleware, authorizeRoles('SUPER_ADMIN', 'BRANCH_MANAGER'), handler)
 */
export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const role = req.userRole;

      if (!role) {
        return errorResponse(res, 'Access denied: no role information', 403);
      }

      if (!allowedRoles.includes(role)) {
        return errorResponse(
          res,
          `Access denied: requires one of [${allowedRoles.join(', ')}]`,
          403
        );
      }

      next();
    } catch (error) {
      return errorResponse(res, 'Authorization failed', 403, error);
    }
  };
};

/**
 * adminMiddleware — legacy alias: allows ADMIN, SUPER_ADMIN, BRANCH_MANAGER
 * Kept for backward compatibility with existing routes
 */
export const adminMiddleware = authorizeRoles(...ADMIN_ROLES);
