-- ============================================================
--  Smart Restaurant Operations & POS Platform
--  Database Schema — PostgreSQL DDL
--  Generated from Prisma Schema
-- ============================================================

-- Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD', 'UPI');
CREATE TYPE "PromotionType" AS ENUM ('PRODUCT', 'ORDER');
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PAID', 'CANCELLED');
CREATE TYPE "KitchenStatus" AS ENUM ('TO_COOK', 'PREPARING', 'COMPLETED');

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE "users" (
    "id"                   TEXT         NOT NULL,
    "name"                 TEXT         NOT NULL,
    "email"                TEXT         NOT NULL,
    "password"             TEXT         NOT NULL,
    "role"                 "Role"       NOT NULL DEFAULT 'EMPLOYEE',
    "status"               "UserStatus" NOT NULL DEFAULT 'APPROVED',
    "resetPasswordToken"   TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "isArchived"           BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"              ON "users"("email");
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken");

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE "categories" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "color"     TEXT         NOT NULL DEFAULT '#000000',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE "products" (
    "id"            TEXT           NOT NULL,
    "name"          TEXT           NOT NULL,
    "categoryId"    TEXT           NOT NULL,
    "price"         DECIMAL(10,2)  NOT NULL,
    "unitOfMeasure" TEXT           NOT NULL DEFAULT 'piece',
    "tax"           DECIMAL(5,2)   NOT NULL DEFAULT 0,
    "description"   TEXT,
    "imageUrl"      TEXT,
    "showInKds"     BOOLEAN        NOT NULL DEFAULT false,
    "createdAt"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE: payment_methods
-- ============================================================
CREATE TABLE "payment_methods" (
    "id"        TEXT          NOT NULL,
    "name"      TEXT          NOT NULL DEFAULT 'Payment Method',
    "type"      "PaymentType" NOT NULL,
    "isEnabled" BOOLEAN       NOT NULL DEFAULT true,
    "upiId"     TEXT,
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE: floors
-- ============================================================
CREATE TABLE "floors" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "floors_name_key" ON "floors"("name");

-- ============================================================
-- TABLE: tables
-- ============================================================
CREATE TABLE "tables" (
    "id"          TEXT         NOT NULL,
    "floorId"     TEXT         NOT NULL,
    "tableNumber" TEXT         NOT NULL,
    "seats"       INTEGER      NOT NULL,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tables_floorId_tableNumber_key" ON "tables"("floorId", "tableNumber");

-- ============================================================
-- TABLE: coupons
-- ============================================================
CREATE TABLE "coupons" (
    "id"            TEXT           NOT NULL,
    "code"          TEXT           NOT NULL,
    "discountType"  "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2)  NOT NULL,
    "isActive"      BOOLEAN        NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- ============================================================
-- TABLE: promotions
-- ============================================================
CREATE TABLE "promotions" (
    "id"             TEXT            NOT NULL,
    "name"           TEXT            NOT NULL,
    "type"           "PromotionType" NOT NULL,
    "discountType"   "DiscountType"  NOT NULL,
    "discountValue"  DECIMAL(10,2)   NOT NULL,
    "productId"      TEXT,
    "minQuantity"    INTEGER,
    "minOrderAmount" DECIMAL(10,2),
    "isActive"       BOOLEAN         NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE "customers" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "email"     TEXT,
    "phone"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE: sessions
-- ============================================================
CREATE TABLE "sessions" (
    "id"            TEXT            NOT NULL,
    "userId"        TEXT            NOT NULL,
    "openedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt"      TIMESTAMP(3),
    "closingAmount" DECIMAL(10,2),
    "status"        "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE "orders" (
    "id"               TEXT          NOT NULL,
    "orderNumber"      TEXT          NOT NULL,
    "sessionId"        TEXT          NOT NULL,
    "tableId"          TEXT,
    "customerId"       TEXT,
    "employeeId"       TEXT          NOT NULL,
    "status"           "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal"         DECIMAL(10,2) NOT NULL,
    "taxAmount"        DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount"   DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total"            DECIMAL(10,2) NOT NULL,
    "paymentMethod"    TEXT,
    "paymentReference" TEXT,
    "couponId"         TEXT,
    "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE "order_items" (
    "id"             TEXT          NOT NULL,
    "orderId"        TEXT          NOT NULL,
    "productId"      TEXT          NOT NULL,
    "quantity"       DECIMAL(10,2) NOT NULL,
    "unitPrice"      DECIMAL(10,2) NOT NULL,
    "lineTotal"      DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "promotionId"    TEXT,
    "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE: kitchen_orders
-- ============================================================
CREATE TABLE "kitchen_orders" (
    "id"              TEXT            NOT NULL,
    "orderId"         TEXT            NOT NULL,
    "orderItemId"     TEXT            NOT NULL,
    "productId"       TEXT            NOT NULL,
    "assignedToId"    TEXT,
    "status"          "KitchenStatus" NOT NULL DEFAULT 'TO_COOK',
    "isItemCompleted" BOOLEAN         NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "kitchen_orders_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

-- products → categories
ALTER TABLE "products"
    ADD CONSTRAINT "products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- tables → floors
ALTER TABLE "tables"
    ADD CONSTRAINT "tables_floorId_fkey"
    FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- promotions → products (optional)
ALTER TABLE "promotions"
    ADD CONSTRAINT "promotions_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- sessions → users
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- orders → coupons (optional)
ALTER TABLE "orders"
    ADD CONSTRAINT "orders_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- orders → customers (optional)
ALTER TABLE "orders"
    ADD CONSTRAINT "orders_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- orders → users (employee)
ALTER TABLE "orders"
    ADD CONSTRAINT "orders_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- orders → sessions
ALTER TABLE "orders"
    ADD CONSTRAINT "orders_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- orders → tables (optional)
ALTER TABLE "orders"
    ADD CONSTRAINT "orders_tableId_fkey"
    FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- order_items → orders
ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- order_items → products
ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- order_items → promotions (optional)
ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_promotionId_fkey"
    FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- kitchen_orders → users (assigned staff, optional)
ALTER TABLE "kitchen_orders"
    ADD CONSTRAINT "kitchen_orders_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- kitchen_orders → orders
ALTER TABLE "kitchen_orders"
    ADD CONSTRAINT "kitchen_orders_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- kitchen_orders → order_items
ALTER TABLE "kitchen_orders"
    ADD CONSTRAINT "kitchen_orders_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- kitchen_orders → products
ALTER TABLE "kitchen_orders"
    ADD CONSTRAINT "kitchen_orders_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
