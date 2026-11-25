// A-2: Shared normalise helpers extracted from store.js
// Used by authSlice, referenceSlice, orderSlice

// Role display name map — DB role → UI label
export const ROLE_DISPLAY = {
  SUPER_ADMIN:       'Super Admin',
  BRANCH_MANAGER:    'Branch Manager',
  INVENTORY_MANAGER: 'Inventory Manager',
  CASHIER:           'Cashier',
  KITCHEN_STAFF:     'Kitchen Staff',
  // Legacy values (kept during data migration)
  ADMIN:             'Super Admin',
  EMPLOYEE:          'Cashier',
};

// Roles that can access the Admin dashboard
export const ADMIN_ACCESS_ROLES = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN'];
// Roles that can access Inventory management
export const INV_ACCESS_ROLES   = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'ADMIN'];
// Roles that can access POS terminal
export const POS_ACCESS_ROLES   = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'ADMIN', 'EMPLOYEE'];
// Roles that can access KDS
export const KDS_ACCESS_ROLES   = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'KITCHEN_STAFF', 'ADMIN', 'EMPLOYEE'];

export function normaliseUser(u) {
  const dbRole = u.role || 'CASHIER';
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    // Keep raw DB role for permission checks
    role: dbRole,
    // Human-readable display label
    roleLabel: ROLE_DISPLAY[dbRole] || dbRole,
    // Permission flags for UI gating
    canAccessAdmin: ADMIN_ACCESS_ROLES.includes(dbRole),
    canAccessInventory: INV_ACCESS_ROLES.includes(dbRole),
    canAccessPos: POS_ACCESS_ROLES.includes(dbRole),
    canAccessKds: KDS_ACCESS_ROLES.includes(dbRole),
    active: !u.isArchived,
    password: '', // never returned from server
  };
}

export function normaliseProduct(p) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    price: Number(p.price),
    unit: p.unitOfMeasure ?? "piece",
    tax: Number(p.tax ?? 0),
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? null,
    sendToKitchen: p.showInKds ?? false,
  };
}

export function normaliseTable(t) {
  return {
    id: t.id,
    floorId: t.floorId,
    number: Number(t.tableNumber?.replace(/\D/g, "")) || t.tableNumber,
    seats: t.seats,
    active: t.isActive,
  };
}

export function normaliseOrder(o) {
  return {
    id: o.id,
    number: o.orderNumber,
    tableId: o.tableId ?? null,
    customerId: o.customerId ?? null,
    employeeId: o.employeeId,
    sessionId: o.sessionId,
    status: o.status === "PAID" ? "Paid" : o.status === "CANCELLED" ? "Cancelled" : "Draft",
    subtotal: Number(o.subtotal ?? 0),
    tax: Number(o.taxAmount ?? 0),
    discountTotal: Number(o.discountAmount ?? 0),
    total: Number(o.total ?? 0),
    paymentMethodId: o.paymentMethod ?? null,
    createdAt: new Date(o.createdAt).getTime(),
    lines: (o.orderItems ?? []).map((i) => ({
      productId: i.productId,
      qty: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
  };
}

export function normaliseSession(s) {
  return {
    id: s.id,
    openedAt: new Date(s.openedAt).getTime(),
    closedAt: s.closedAt ? new Date(s.closedAt).getTime() : null,
    closingAmount: s.closingAmount ? Number(s.closingAmount) : 0,
    employeeId: s.userId,
  };
}

export function normaliseCoupon(c) {
  return {
    id: c.id,
    name: c.name ?? c.code,
    type: c.promotionType ? "Promotion" : "Coupon",
    code: c.code ?? null,
    apply: c.promotionType === "PRODUCT" ? "Product" : (c.promotionType === "ORDER" ? "Order" : "Order"),
    discountKind: (c.discountType ?? "PERCENTAGE") === "PERCENTAGE" ? "percent" : "fixed",
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    productId: c.productId ?? null,
    minQty: c.minQuantity ?? null,
    active: c.isActive,
  };
}

export function normalisePayment(p) {
  return {
    id: p.id,
    name: p.name || p.type,
    type: p.type,
    upiId: p.upiId ?? null,
    active: p.isEnabled,
  };
}
