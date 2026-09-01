/**
 * Seed one representative user for each SRS role.
 * Safe to run multiple times (skips existing emails).
 */
import prisma from './src/config/database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const users = [
  { name: 'Dhaval Prajapati', email: 'superadmin@cafe.com',  role: 'SUPER_ADMIN'       },
  { name: 'Branch Manager',   email: 'manager@cafe.com',     role: 'BRANCH_MANAGER'    },
  { name: 'Inventory Head',   email: 'inventory@cafe.com',   role: 'INVENTORY_MANAGER' },
  { name: 'Cashier Staff',    email: 'cashier1@cafe.com',    role: 'CASHIER'           },
  { name: 'Kitchen Chef',     email: 'chef1@cafe.com',       role: 'KITCHEN_STAFF'     },
];

async function seed() {
  console.log('🌱 Seeding role-based users...\n');
  const hashedPwd = await bcrypt.hash('password123', SALT_ROUNDS);

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${u.email} [${u.role}]`);
      continue;
    }
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPwd,
        role: u.role,
        status: 'APPROVED',
        isArchived: false,
      },
    });
    console.log(`✅ Created: ${u.email} [${u.role}]`);
  }

  console.log('\n🎉 Role seed complete!');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
