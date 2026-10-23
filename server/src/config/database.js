import { PrismaClient } from '@prisma/client';

// Neon free-tier databases auto-suspend after inactivity and need up to 10 s
// to wake up. Setting connect_timeout=30 on the connection URL and using the
// non-pooling endpoint (or a generous pool timeout) prevents "can't reach
// database" errors on cold starts.
const rawUrl = process.env.DATABASE_URL || '';

// Append connect_timeout if not already present so Neon gets enough time to wake
const dbUrl = rawUrl.includes('connect_timeout')
  ? rawUrl
  : rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
  log: ['error', 'warn'],
});

export default prisma;
