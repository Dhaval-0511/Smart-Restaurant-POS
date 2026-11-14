import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (userId, role, expiresIn, sessionId = null) => {
  const payload = { userId, role };
  if (sessionId) payload.sessionId = sessionId;
  return jwt.sign(payload, env.JWT_SECRET, {
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
