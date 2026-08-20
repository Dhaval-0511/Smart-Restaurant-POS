import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { sendPasswordResetEmail } from './mail.service.js';
import { env } from '../config/env.js';
import crypto from 'crypto';

export const registerUser = async (data) => {
  const { name, email, password } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('An account with this email already exists.');

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, status: 'PENDING' },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return { user };
};

export const loginUser = async (email, password, rememberMe = false) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error('Invalid email or password.');
  if (user.isArchived) throw new Error('Your account has been archived. Contact admin.');
  if (user.status === 'PENDING') throw new Error('Your account is awaiting admin approval.');
  if (user.status === 'REJECTED') throw new Error('Your registration request was rejected. Contact admin.');

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password.');

  const expiresIn = rememberMe ? env.JWT_REMEMBER_EXPIRE : env.JWT_EXPIRE;
  const token = generateToken(user.id, expiresIn);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
    rememberMe,
  };
};

export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond success to avoid email enumeration
  if (!user || user.isArchived) return { message: 'If that email exists, a reset link has been sent.' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires },
  });

  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: 'If that email exists, a reset link has been sent.' };
};

export const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findUnique({ where: { resetPasswordToken: token } });

  if (!user) throw new Error('Invalid or expired reset link.');
  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new Error('This reset link has expired. Please request a new one.');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return { message: 'Password updated successfully.' };
};

export const getPendingUsers = async () => {
  return await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
};

export const approveUser = async (userId, role) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (user.status !== 'PENDING') throw new Error('User is not pending approval.');

  return await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED', role: role || 'EMPLOYEE' },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
};

export const rejectUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');

  return await prisma.user.update({
    where: { id: userId },
    data: { status: 'REJECTED' },
    select: { id: true, name: true, email: true, status: true },
  });
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true, isArchived: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new Error('User not found');
  return user;
};

export const getAllUsers = async (limit = 10, page = 1) => {
  const skip = (page - 1) * limit;
  const users = await prisma.user.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, name: true, email: true, role: true, status: true, isArchived: true, createdAt: true },
    skip,
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
  });
  const total = await prisma.user.count({ where: { status: 'APPROVED' } });
  return { users, total };
};

export const updateUser = async (userId, data) => {
  const { name, email, password, role, isArchived } = data;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) throw new Error('Email already exists');
    updateData.email = email;
  }
  if (password) updateData.password = await hashPassword(password);
  if (role !== undefined) updateData.role = role;
  if (isArchived !== undefined) updateData.isArchived = isArchived;

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isArchived: true, createdAt: true },
  });
};

export const deleteUser = async (userId) => {
  return await prisma.user.delete({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
};
