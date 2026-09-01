import prisma from './src/config/database.js';

async function main() {
  const [users, categories, products, floors, tables, paymentMethods, customers, sessions, orders, orderItems, kitchenOrders, coupons, promotions] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.floor.count(),
    prisma.table.count(),
    prisma.paymentMethod.count(),
    prisma.customer.count(),
    prisma.session.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.kitchenOrder.count(),
    prisma.coupon.count(),
    prisma.promotion.count(),
  ]);

  console.log('\n📊 Database Status:');
  console.log('─'.repeat(35));
  console.log(`Users:           ${users}`);
  console.log(`Categories:      ${categories}`);
  console.log(`Products:        ${products}`);
  console.log(`Floors:          ${floors}`);
  console.log(`Tables:          ${tables}`);
  console.log(`Payment Methods: ${paymentMethods}`);
  console.log(`Customers:       ${customers}`);
  console.log(`Sessions:        ${sessions}`);
  console.log(`Orders:          ${orders}`);
  console.log(`Order Items:     ${orderItems}`);
  console.log(`Kitchen Orders:  ${kitchenOrders}`);
  console.log(`Coupons:         ${coupons}`);
  console.log(`Promotions:      ${promotions}`);
  console.log('─'.repeat(35));

  await prisma.$disconnect();
}

main().catch(console.error);
