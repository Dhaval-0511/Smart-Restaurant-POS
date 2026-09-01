/**
 * One-time migration: map legacy ADMIN → SUPER_ADMIN, EMPLOYEE → CASHIER
 * Safe to run multiple times (idempotent).
 */
import prisma from './src/config/database.js';

async function migrate() {
  console.log('🔄 Migrating legacy roles...');

  const adminResult = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data:  { role: 'SUPER_ADMIN' },
  });
  console.log(`✅ ADMIN → SUPER_ADMIN: ${adminResult.count} users updated`);

  const empResult = await prisma.user.updateMany({
    where: { role: 'EMPLOYEE' },
    data:  { role: 'CASHIER' },
  });
  console.log(`✅ EMPLOYEE → CASHIER: ${empResult.count} users updated`);

  // Verify
  const users = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { role: 'asc' },
  });
  console.log('\n📋 Current user roles:');
  users.forEach(u => console.log(`  ${u.email} → ${u.role}`));

  await prisma.$disconnect();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
