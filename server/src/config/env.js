import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REMEMBER_EXPIRE: process.env.JWT_REMEMBER_EXPIRE || '30d',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER?.replace(/^['"]|['"]$/g, '').trim(),
  EMAIL_PASS: process.env.EMAIL_PASS?.replace(/^['"]|['"]$/g, '').replace(/\s+/g, '').trim(),
  CLIENT_URL: process.env.CLIENT_URL?.replace(/^['"]|['"]$/g, '').trim() || 'http://localhost:5173',
};
