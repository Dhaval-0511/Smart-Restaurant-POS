import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (userId, role, expiresIn) => {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: expiresIn || env.JWT_EXPIRE,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
