import { verifyToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';
import prisma from '../config/database.js';
import { userActiveSessions } from '../services/auth.service.js';

// ── 60-second in-memory cache for user status checks ─────────────────────────
// Avoids a DB hit on EVERY authenticated request; still picks up deactivation
// within 60 seconds (acceptable for the POS use-case).
const _userStatusCache = new Map(); // userId → { user, cachedAt }
const _CACHE_TTL_MS = 60 * 1000;

export const invalidateUserCache = (userId) => {
  _userStatusCache.delete(userId);
};

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

    // ── Check if user is deactivated (TTL-cached to reduce DB hits) ─────────
    let user;
    const cached = _userStatusCache.get(decoded.userId);
    if (cached && (Date.now() - cached.cachedAt) < _CACHE_TTL_MS) {
      user = cached.user;
    } else {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true, isArchived: true, status: true },
      });
      if (user) _userStatusCache.set(decoded.userId, { user, cachedAt: Date.now() });
    }

    if (!user) {
      return errorResponse(res, 'Account not found', 401);
    }
    if (user.isArchived) {
      // Immediately evict cache so next request is fresh after re-activation
      _userStatusCache.delete(decoded.userId);
      return errorResponse(res, 'Your account has been deactivated. Please contact an administrator.', 401);
    }

    // ── Single Active Session: reject tokens from displaced sessions ──────────
    // Only enforced when a sessionId is embedded in the token (new logins).
    // Old tokens without sessionId (e.g., tokens issued before this feature) remain valid.
    if (decoded.sessionId) {
      const activeSession = userActiveSessions.get(decoded.userId);
      if (activeSession && activeSession.sessionId !== decoded.sessionId) {
        return errorResponse(res, 'SESSION_DISPLACED: Your session has ended because this account was logged in from another browser or device. Please log in again.', 401);
      }
    }

    // Attach userId and role from DB (fresh, not stale token data)
    req.userId = user.id;
    req.userRole = user.role;
    req._user = user;

    // Lazy-load helper (for backward compat — already populated above)
    req.getUser = async () => req._user;

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
