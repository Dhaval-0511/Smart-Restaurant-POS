import prisma from './src/config/database.js';

// Helper: random item from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: random int between min and max (inclusive)
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: date X days ago
const daysAgo = (d) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt;
};

// Helper: generate order number
let orderCounter = 1;
const nextOrderNum = () => `ORD-${String(orderCounter++).padStart(4, '0')}`;

async function main() {
  console.log('🌱 Seeding operational data (sessions, customers, orders, coupons, promotions)...\n');

  // ── Fetch existing base data ───────────────────────────────────────────────
  const [users, products, tables, sessions] = await Promise.all([
    prisma.user.findMany({ select: { id: true, role: true } }),
    prisma.product.findMany({ select: { id: true, price: true, tax: true, showInKds: true } }),
    prisma.table.findMany({ select: { id: true } }),
    prisma.session.findMany({ select: { id: true, userId: true } }),
  ]);

  const admins    = users.filter(u => u.role === 'ADMIN');
  const employees = users.filter(u => u.role === 'EMPLOYEE');
  const allStaff  = [...admins, ...employees];

  console.log(`Found: ${users.length} users, ${products.length} products, ${tables.length} tables, ${sessions.length} existing sessions`);

  // ── 1. Coupons ────────────────────────────────────────────────────────────
  const couponData = [
    { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, isActive: true },
    { code: 'FLAT50',    discountType: 'FIXED',      discountValue: 50, isActive: true },
    { code: 'SAVE20',    discountType: 'PERCENTAGE', discountValue: 20, isActive: true },
    { code: 'TREAT100',  discountType: 'FIXED',      discountValue: 100, isActive: false },
  ];

  const coupons = [];
  for (const c of couponData) {
    const existing = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (!existing) {
      const created = await prisma.coupon.create({ data: c });
      coupons.push(created);
    } else {
      coupons.push(existing);
    }
  }
  console.log(`✅ Coupons ready: ${coupons.length}`);

  // ── 2. Promotions ─────────────────────────────────────────────────────────
  const promoData = [
    {
      name: 'Weekend Special - 15% off orders above ₹500',
      type: 'ORDER',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 500,
      isActive: true,
    },
    {
      name: 'Buy 3 Get 10% off',
      type: 'ORDER',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minQuantity: 3,
      isActive: true,
    },
    {
      name: 'Happy Hour - ₹30 off',
      type: 'ORDER',
      discountType: 'FIXED',
      discountValue: 30,
      minOrderAmount: 200,
      isActive: true,
    },
  ];

  const promotions = [];
  for (const p of promoData) {
    const existing = await prisma.promotion.findFirst({ where: { name: p.name } });
    if (!existing) {
      const created = await prisma.promotion.create({ data: p });
      promotions.push(created);
    } else {
      promotions.push(existing);
    }
  }
  console.log(`✅ Promotions ready: ${promotions.length}`);

  // ── 3. Customers ──────────────────────────────────────────────────────────
  const customerData = [
    { name: 'Riya Sharma',    email: 'riya.sharma@gmail.com',    phone: '9876543210' },
    { name: 'Arjun Mehta',    email: 'arjun.mehta@gmail.com',    phone: '9812345678' },
    { name: 'Priya Desai',    email: 'priya.desai@gmail.com',    phone: '9823456789' },
    { name: 'Nikhil Joshi',   email: 'nikhil.joshi@gmail.com',   phone: '9834567890' },
    { name: 'Sneha Patel',    email: 'sneha.patel@gmail.com',    phone: '9845678901' },
    { name: 'Rohit Kapoor',   email: 'rohit.kapoor@gmail.com',   phone: '9856789012' },
    { name: 'Kavya Nair',     email: 'kavya.nair@gmail.com',     phone: '9867890123' },
    { name: 'Vivek Tiwari',   email: 'vivek.tiwari@gmail.com',   phone: '9878901234' },
    { name: 'Meera Iyer',     email: 'meera.iyer@gmail.com',     phone: '9889012345' },
    { name: 'Aditya Rao',     email: 'aditya.rao@gmail.com',     phone: '9890123456' },
  ];

  const customers = [];
  for (const c of customerData) {
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    if (!existing) {
      const created = await prisma.customer.create({ data: c });
      customers.push(created);
    } else {
      customers.push(existing);
    }
  }
  console.log(`✅ Customers ready: ${customers.length}`);

  // ── 4. Sessions (new closed + open sessions) ──────────────────────────────
  // Create closed sessions spread over last 7 days
  const newSessions = [];
  const sessionDays = [7, 6, 5, 4, 3, 2, 1, 0]; // 0 = today

  for (const daysBack of sessionDays) {
    const staff = pick(allStaff);
    const openedAt = daysAgo(daysBack);
    openedAt.setHours(8, 0, 0, 0);

    const closedAt = new Date(openedAt);
    closedAt.setHours(22, 0, 0, 0);

    const isToday = daysBack === 0;
    const session = await prisma.session.create({
      data: {
        userId: staff.id,
        openedAt,
        closedAt: isToday ? null : closedAt,
        closingAmount: isToday ? null : randInt(3000, 12000),
        status: isToday ? 'OPEN' : 'CLOSED',
      },
    });
    newSessions.push(session);
  }
  console.log(`✅ Sessions created: ${newSessions.length}`);

  // ── 5. Orders with Items & Kitchen Orders ─────────────────────────────────
  const paymentMethods = ['CASH', 'CARD', 'UPI'];
  let totalOrders = 0;
  let totalItems  = 0;
  let totalKds    = 0;

  for (const session of newSessions) {
    // 3–8 orders per session
    const ordersInSession = randInt(3, 8);

    for (let o = 0; o < ordersInSession; o++) {
      const sessionUser = allStaff.find(u => u.id === session.userId) || pick(allStaff);
      const customer    = Math.random() > 0.4 ? pick(customers) : null;
      const table       = Math.random() > 0.3 ? pick(tables) : null;
      const coupon      = Math.random() > 0.7 ? pick(coupons.filter(c => c.isActive)) : null;
      const isPaid      = session.status === 'CLOSED' || Math.random() > 0.3;

      // Pick 1–4 products for this order
      const pickedProducts = [];
      const numItems = randInt(1, 4);
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(numItems, shuffled.length); i++) {
        pickedProducts.push(shuffled[i]);
      }

      // Calculate financials
      let subtotal = 0;
      const itemLines = pickedProducts.map(prod => {
        const qty       = randInt(1, 3);
        const unitPrice = parseFloat(prod.price);
        const lineTotal = parseFloat((unitPrice * qty).toFixed(2));
        subtotal += lineTotal;
        return { prod, qty, unitPrice, lineTotal };
      });

      const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
      let discountAmount = 0;
      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = parseFloat(((subtotal * parseFloat(coupon.discountValue)) / 100).toFixed(2));
        } else {
          discountAmount = Math.min(parseFloat(coupon.discountValue), subtotal);
        }
      }
      const total = parseFloat((subtotal + taxAmount - discountAmount).toFixed(2));

      // Create order
      const orderCreatedAt = new Date(session.openedAt);
      orderCreatedAt.setMinutes(orderCreatedAt.getMinutes() + randInt(10, 600));

      const order = await prisma.order.create({
        data: {
          orderNumber:    nextOrderNum(),
          sessionId:      session.id,
          tableId:        table?.id || null,
          customerId:     customer?.id || null,
          employeeId:     sessionUser.id,
          status:         isPaid ? 'PAID' : 'DRAFT',
          subtotal,
          taxAmount,
          discountAmount,
          total,
          paymentMethod:  isPaid ? pick(paymentMethods) : null,
          paymentReference: isPaid && Math.random() > 0.5 ? `TXN${randInt(100000, 999999)}` : null,
          couponId:       coupon?.id || null,
          createdAt:      orderCreatedAt,
        },
      });

      totalOrders++;

      // Create order items & kitchen orders
      for (const { prod, qty, unitPrice, lineTotal } of itemLines) {
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId:    order.id,
            productId:  prod.id,
            quantity:   qty,
            unitPrice,
            lineTotal,
            discountAmount: 0,
          },
        });
        totalItems++;

        // Only create KDS entry for KDS-enabled products
        if (prod.showInKds) {
          const kdsStatuses = ['TO_COOK', 'PREPARING', 'COMPLETED'];
          const kdsStatus   = isPaid ? 'COMPLETED' : pick(kdsStatuses);

          await prisma.kitchenOrder.create({
            data: {
              orderId:         order.id,
              orderItemId:     orderItem.id,
              productId:       prod.id,
              assignedToId:    Math.random() > 0.5 ? pick(employees)?.id || null : null,
              status:          kdsStatus,
              isItemCompleted: kdsStatus === 'COMPLETED',
            },
          });
          totalKds++;
        }
      }
    }
  }

  console.log(`✅ Orders created:        ${totalOrders}`);
  console.log(`✅ Order Items created:   ${totalItems}`);
  console.log(`✅ Kitchen Orders created: ${totalKds}`);

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log('\n🎉 Operational seeding complete!\n');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
