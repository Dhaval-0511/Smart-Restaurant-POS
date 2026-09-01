# Implementation Roadmap: Steps 1 to 3
## Smart Restaurant Operations & POS Platform

This document outlines the detailed step-by-step implementation plan for the first three critical phases of the platform as specified in the SRS. Each phase is divided into **Database**, **Backend**, and **Frontend** tasks.

---

# Phase 1: User Roles & Role-Based Access Control (RBAC)
**Goal:** Align system roles with Section 2.3 of the SRS (`SUPER_ADMIN`, `BRANCH_MANAGER`, `INVENTORY_MANAGER`, `CASHIER`, `KITCHEN_STAFF`) and enforce granular access control.

---

### 1.1 Database Layer (Database)
- [ ] **Update `schema.prisma`:**
  - Replace current `Role` enum:
    ```prisma
    enum Role {
      SUPER_ADMIN
      BRANCH_MANAGER
      INVENTORY_MANAGER
      CASHIER
      KITCHEN_STAFF
    }
    ```
  - Create `AuditLog` model (FR-AUTH-006):
    ```prisma
    model AuditLog {
      id        String   @id @default(uuid())
      userId    String
      action    String   // e.g. "USER_LOGIN", "PRICE_UPDATE", "STOCK_ADJUST"
      details   String?  // JSON or text details
      ipAddress String?
      createdAt DateTime @default(now())
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

      @@map("audit_logs")
    }
    ```
- [ ] **Run Database Migration / Push:**
  - Execute `npx prisma db push` to synchronize PostgreSQL.
- [ ] **Update Seed Script (`prisma/seed.js` or `prisma/custom_seed.js`):**
  - Seed 5 distinct test accounts:
    - Super Admin: `superadmin@cafe.com` / `password123`
    - Branch Manager: `manager@cafe.com` / `password123`
    - Inventory Manager: `inventory@cafe.com` / `password123`
    - Cashier: `cashier1@cafe.com` / `password123`
    - Kitchen Staff: `chef1@cafe.com` / `password123`

---

### 1.2 Backend Layer (Server API)
- [ ] **Update Auth Middleware (`src/middlewares/auth.middleware.js`):**
  - Implement a flexible role-checking middleware `authorizeRoles(...roles)`.
  - Example:
    - `/api/admin/*` $\rightarrow$ Allowed for `SUPER_ADMIN`, `BRANCH_MANAGER`.
    - `/api/inventory/*`, `/api/procurement/*` $\rightarrow$ Allowed for `SUPER_ADMIN`, `BRANCH_MANAGER`, `INVENTORY_MANAGER`.
    - `/api/orders/*`, `/api/sessions/*` $\rightarrow$ Allowed for `SUPER_ADMIN`, `BRANCH_MANAGER`, `CASHIER`.
    - `/api/kitchen/*` $\rightarrow$ Allowed for `SUPER_ADMIN`, `BRANCH_MANAGER`, `KITCHEN_STAFF`.
- [ ] **Update Auth Controller & Service:**
  - Ensure JWT token includes `{ id, name, email, role }`.
  - Update user registration to assign default role or allow admin role assignment during approval.
- [ ] **Implement Audit Log Service (`src/services/audit.service.js`):**
  - Add helper function `logAuditAction(userId, action, details, req)`.

---

### 1.3 Frontend Layer (Client UI)
- [ ] **Update Global Store & State (`src/lib/store.js`):**
  - Update role definitions and helper getters (`isSuperAdmin`, `isBranchManager`, `isInventoryManager`, `isCashier`, `isKitchenStaff`).
- [ ] **Role-Based Routing & Guards (`src/App.jsx`):**
  - Create `<ProtectedRoute roles={[...]} />` component.
  - Route matrix:
    - `/admin/*` $\rightarrow$ Super Admin, Branch Manager
    - `/admin/inventory/*` $\rightarrow$ Super Admin, Branch Manager, Inventory Manager
    - `/pos` $\rightarrow$ Super Admin, Branch Manager, Cashier
    - `/kds` $\rightarrow$ Super Admin, Branch Manager, Kitchen Staff
- [ ] **Update Navigation & Header (`src/components/PosHeader.jsx` & `AdminShell.jsx`):**
  - Dynamically display sidebar and topbar menu links according to the logged-in user's role.
- [ ] **Update User Management UI (`src/pages/admin.users.jsx`):**
  - Support selecting from the 5 new roles in user approval and role assignment dropdowns.

---

# Phase 2: Recipe & Ingredient-Level Inventory Control
**Goal:** Implement Sections 3.3 and 3.10 of the SRS (Ingredient tracking, recipe mapping, stock deduction on sale, low-stock alerts, wastage logging).

---

### 2.1 Database Layer (Database)
- [ ] **Add Inventory Models to `schema.prisma`:**
  ```prisma
  model Ingredient {
    id            String         @id @default(uuid())
    name          String         @unique
    unitOfMeasure String         // e.g. "kg", "g", "liter", "ml", "piece"
    currentStock  Decimal        @default(0) @db.Decimal(10, 3)
    minimumStock  Decimal        @default(0) @db.Decimal(10, 3) // Low stock threshold
    costPerUnit   Decimal        @default(0) @db.Decimal(10, 2)
    createdAt     DateTime       @default(now())
    updatedAt     DateTime       @updatedAt
    recipeItems   RecipeItem[]
    stockLedgers  StockLedger[]
    poItems       PurchaseOrderItem[]

    @@map("ingredients")
  }

  model RecipeItem {
    id            String     @id @default(uuid())
    productId     String
    ingredientId  String
    quantity      Decimal    @db.Decimal(10, 3) // Amount of ingredient per product unit
    wastagePercent Decimal   @default(0) @db.Decimal(5, 2) // Recipe wastage %
    product       Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
    ingredient    Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Cascade)

    @@unique([productId, ingredientId])
    @@map("recipe_items")
  }

  enum StockMovementType {
    PURCHASE_RECEIPT
    SALE_DEDUCTION
    WASTAGE
    MANUAL_ADJUSTMENT
    RETURN
  }

  model StockLedger {
    id             String            @id @default(uuid())
    ingredientId   String
    movementType   StockMovementType
    quantityChange Decimal           @db.Decimal(10, 3) // Positive for IN, Negative for OUT
    resultingStock Decimal           @db.Decimal(10, 3)
    referenceId    String?           // Order ID, Purchase Order ID, or Wastage ID
    notes          String?
    recordedById   String?
    createdAt      DateTime          @default(now())
    ingredient     Ingredient        @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
    recordedBy     User?             @relation(fields: [recordedById], references: [id])

    @@map("stock_ledgers")
  }

  model WastageRecord {
    id           String     @id @default(uuid())
    ingredientId String
    quantity     Decimal    @db.Decimal(10, 3)
    reason       String     // e.g. "Expired", "Spilled", "Damaged"
    recordedById String
    createdAt    DateTime   @default(now())
    ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
    recordedBy   User       @relation(fields: [recordedById], references: [id])

    @@map("wastage_records")
  }
  ```
- [ ] **Run Database Migration / Push:**
  - Execute `npx prisma db push`.
- [ ] **Seed Sample Ingredients & Recipes:**
  - Ingredients: Coffee Beans (kg), Milk (liters), Sugar (kg), Burger Buns (pcs), Cheese Slice (pcs), Patty (pcs), Tea Leaves (kg).
  - Recipes: Link Espresso to Coffee Beans; Burger to Buns, Cheese, Patty, etc.

---

### 2.2 Backend Layer (Server API)
- [ ] **Create Ingredient & Inventory Services & Controllers:**
  - `GET /api/inventory/ingredients` $\rightarrow$ List all ingredients with current vs. min stock.
  - `POST /api/inventory/ingredients` $\rightarrow$ Create new ingredient.
  - `PUT /api/inventory/ingredients/:id` $\rightarrow$ Update ingredient details/thresholds.
  - `POST /api/inventory/adjust` $\rightarrow$ Manual stock adjustment (creates `StockLedger` entry).
  - `POST /api/inventory/wastage` $\rightarrow$ Record wastage (deducts stock + creates `StockLedger` & `WastageRecord`).
  - `GET /api/inventory/low-stock` $\rightarrow$ Returns ingredients where `currentStock <= minimumStock`.
  - `GET /api/inventory/ledger` $\rightarrow$ Audit trail of all stock movements.
- [ ] **Create Recipe Services & Controllers:**
  - `GET /api/products/:id/recipe` $\rightarrow$ Get ingredients for a product.
  - `POST /api/products/:id/recipe` $\rightarrow$ Set or update product recipe mappings.
- [ ] **Hook Automatic Inventory Deduction in Order Service:**
  - When an order transitions to `PAID` / `COMPLETED`:
    - Iterate through order items $\rightarrow$ fetch linked `RecipeItem`s.
    - Calculate total ingredient consumption: `qty * (recipeQty * (1 + wastagePercent / 100))`.
    - Deduct from `Ingredient.currentStock` and record `SALE_DEDUCTION` in `StockLedger`.
    - Trigger real-time alert via WebSocket if any ingredient hits low stock.

---

### 2.3 Frontend Layer (Client UI)
- [ ] **Inventory Management Screen (`src/pages/admin.inventory.jsx`):**
  - Ingredient catalog table with stock status badges (In Stock, Low Stock, Out of Stock).
  - "Adjust Stock" and "Log Wastage" modal dialogs.
  - Stock movement ledger history viewer.
- [ ] **Recipe Builder inside Product Admin (`src/pages/admin.products.jsx`):**
  - Add "Recipe / Ingredients" tab or drawer to product editor.
  - Add/remove ingredient lines, configure unit consumption and wastage %.
- [ ] **Low-Stock Alert Component (`src/components/LowStockBanner.jsx`):**
  - Visual notification badge in Admin and Inventory dashboards when ingredients drop below minimum threshold.

---

# Phase 3: Supplier & Procurement Management
**Goal:** Implement Section 3.11 of the SRS (Supplier management, Purchase Requisitions, Purchase Orders, Goods Receipt stock increment).

---

### 3.1 Database Layer (Database)
- [ ] **Add Procurement Models to `schema.prisma`:**
  ```prisma
  model Supplier {
    id             String          @id @default(uuid())
    name           String
    contactPerson  String?
    email          String?
    phone          String
    address        String?
    leadTimeDays   Int             @default(3)
    isActive       Boolean         @default(true)
    createdAt      DateTime        @default(now())
    updatedAt      DateTime        @updatedAt
    purchaseOrders PurchaseOrder[]

    @@map("suppliers")
  }

  enum PurchaseOrderStatus {
    DRAFT
    PENDING_APPROVAL
    APPROVED
    ORDERED
    PARTIALLY_RECEIVED
    RECEIVED
    CANCELLED
  }

  model PurchaseOrder {
    id              String              @id @default(uuid())
    poNumber        String              @unique // e.g. "PO-2026-0001"
    supplierId      String
    createdById     String
    approvedById    String?
    status          PurchaseOrderStatus @default(DRAFT)
    totalAmount     Decimal             @default(0) @db.Decimal(10, 2)
    expectedDate    DateTime?
    notes           String?
    createdAt       DateTime            @default(now())
    updatedAt       DateTime            @updatedAt
    supplier        Supplier            @relation(fields: [supplierId], references: [id])
    createdBy       User                @relation("POCreatedBy", fields: [createdById], references: [id])
    approvedBy      User?               @relation("POApprovedBy", fields: [approvedById], references: [id])
    items           PurchaseOrderItem[]

    @@map("purchase_orders")
  }

  model PurchaseOrderItem {
    id              String        @id @default(uuid())
    purchaseOrderId String
    ingredientId    String
    quantityOrdered Decimal       @db.Decimal(10, 3)
    quantityReceived Decimal      @default(0) @db.Decimal(10, 3)
    unitCost        Decimal       @db.Decimal(10, 2)
    totalCost       Decimal       @db.Decimal(10, 2)
    purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
    ingredient      Ingredient    @relation(fields: [ingredientId], references: [id])

    @@map("purchase_order_items")
  }
  ```
- [ ] **Run Database Migration / Push:**
  - Execute `npx prisma db push`.
- [ ] **Seed Sample Suppliers & PO Data:**
  - Create 2–3 sample local vendors (Dairy Supplier, Bakery Wholesaler, Beverage Distributor).

---

### 3.2 Backend Layer (Server API)
- [ ] **Create Supplier Endpoints (`src/controllers/supplier.controller.js`):**
  - `GET /api/procurement/suppliers` $\rightarrow$ List suppliers.
  - `POST /api/procurement/suppliers` $\rightarrow$ Create supplier.
  - `PUT /api/procurement/suppliers/:id` $\rightarrow$ Edit supplier.
  - `DELETE /api/procurement/suppliers/:id` $\rightarrow$ Soft-delete/toggle supplier.
- [ ] **Create Purchase Order Endpoints (`src/controllers/purchase-order.controller.js`):**
  - `GET /api/procurement/purchase-orders` $\rightarrow$ List POs with filters (status, supplier, date).
  - `POST /api/procurement/purchase-orders` $\rightarrow$ Create new PO (Draft).
  - `PATCH /api/procurement/purchase-orders/:id/status` $\rightarrow$ Status workflow (`PENDING_APPROVAL`, `APPROVED`, `ORDERED`, `CANCELLED`).
  - `POST /api/procurement/purchase-orders/:id/receive` $\rightarrow$ **Goods Receipt endpoint**:
    - Updates `quantityReceived` for received items.
    - Automatically increments `Ingredient.currentStock`.
    - Creates a `PURCHASE_RECEIPT` entry in `StockLedger`.
    - Updates PO status to `PARTIALLY_RECEIVED` or `RECEIVED`.
  - `GET /api/procurement/reorder-suggestions` $\rightarrow$ Suggests purchase quantities for items where `currentStock <= minimumStock`.

---

### 3.3 Frontend Layer (Client UI)
- [ ] **Supplier Management Page (`src/pages/admin.suppliers.jsx`):**
  - Supplier list with contact cards, lead times, and active/inactive toggle.
  - Add/Edit supplier modal form.
- [ ] **Purchase Orders Dashboard (`src/pages/admin.purchase-orders.jsx`):**
  - PO table with status filter chips (*Draft, Approved, Ordered, Received*).
  - "Create Purchase Order" wizard (select supplier, select ingredients, quantities, unit prices).
  - Role-gated "Approve" button (only visible to `SUPER_ADMIN` and `BRANCH_MANAGER`).
- [ ] **Goods Receipt Dialog / Screen:**
  - Modal to input received quantities when shipment arrives.
  - Calculates balance remaining and updates stock instantly.
