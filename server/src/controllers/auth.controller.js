import {
  registerUser, loginUser, getUserById, getAllUsers, updateUser, deleteUser,
  forgotPassword, resetPassword, getPendingUsers, approveUser, rejectUser,
  verifyPassword,
} from '../services/auth.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';
import { getAuditLogs } from '../services/audit.service.js';
import prisma from '../config/database.js';

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    return successResponse(res, result, 'Registration submitted. Awaiting admin approval.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await loginUser(email, password, rememberMe, req);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    const status = error.message.includes('approval') || error.message.includes('rejected') ? 403 : 401;
    return errorResponse(res, error.message, status, error);
  }
};

export const forgotPasswordHandler = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);
    return successResponse(res, null, result.message);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const resetPasswordHandler = async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await resetPassword(token, password);
    return successResponse(res, null, result.message);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getPendingUsersHandler = async (req, res) => {
  try {
    const users = await getPendingUsers();
    return successResponse(res, users, 'Pending users retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const approveUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await approveUser(id, role, req.userId, req);
    return successResponse(res, user, 'User approved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const rejectUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await rejectUser(id, req.userId, req);
    return successResponse(res, user, 'User rejected');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    return successResponse(res, user, 'User profile retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const { users, total } = await getAllUsers(limit, page);
    return paginatedResponse(res, users, total, page, limit, 'Users retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { currentPassword, password, ...rest } = req.body;
    // If changing password, verify currentPassword first
    if (password) {
      if (!currentPassword) {
        return errorResponse(res, 'Current password is required to set a new password', 400);
      }
      // Fetch hashed password directly (getUserById excludes it)
      const existing = await prisma.user.findUnique({ where: { id: req.userId }, select: { password: true } });
      if (!existing) return errorResponse(res, 'User not found', 404);
      const valid = await verifyPassword(currentPassword, existing.password);
      if (!valid) {
        return errorResponse(res, 'Current password is incorrect', 401);
      }
    }
    const user = await updateUser(req.userId, { ...rest, ...(password ? { password } : {}) });
    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await updateUser(id, req.body);
    return successResponse(res, user, 'Employee updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const removeEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await deleteUser(id);
    return successResponse(res, user, 'User deactivated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

// ── B-3, X-4: Audit log endpoint (SUPER_ADMIN / BRANCH_MANAGER only) ─────────
export const getAuditLogsHandler = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const { logs, total } = await getAuditLogs(Number(limit), Number(page));
    return paginatedResponse(res, logs, total, Number(page), Number(limit), 'Audit logs retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};
