# Functional Requirements Document (FRD)

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the functional capabilities of the Smart Restaurant Operations & POS Platform.

## 1. Introduction
The platform manages restaurant sales, kitchen operations, stock control, procurement, reporting, and AI-enhanced decisions.

## 2. Goals
- Fast POS-based restaurant management
- Real-time kitchen coordination
- Ingredient-level stock automation
- Better procurement planning
- Better reporting
- Intelligent decision support

## 3. Modules
- Authentication
- Branch management
- Product and category management
- Recipe/BOM management
- POS billing
- Table and floor management
- KDS
- Customer management
- Promotions and discounts
- Inventory management
- Procurement
- Reporting
- AI/ML intelligence

## 4. Functional Requirements

### Authentication and User Management
FR-001: Users shall register, log in, and log out.
FR-002: Password reset shall be supported.
FR-003: Role-based access control shall be enforced.
FR-004: Admin shall create, update, archive, and delete users.
FR-005: Audit logs shall record critical user actions.

### Branch Management
FR-006: The system shall support multiple branches.
FR-007: Branch settings shall be managed independently.
FR-008: Users shall access branches based on permission.

### Product and Category Management
FR-009: Admin shall create, edit, and delete products.
FR-010: Admin shall create, edit, and delete categories.
FR-011: Products shall be searchable.
FR-012: Product variants shall be supported.
FR-013: Products shall support active/inactive state.

### Recipe Management
FR-014: Products shall map to ingredients.
FR-015: Recipe quantities shall be stored with unit and wastage.
FR-016: Ingredient consumption shall be derived from recipe rules.

### Floor and Table Management
FR-017: Floors shall be manageable.
FR-018: Tables shall be manageable.
FR-019: Table status shall show occupancy state.
FR-020: Tables shall support order assignment.

### POS Management
FR-021: Cashier shall create orders.
FR-022: Cashier shall update cart items and quantities.
FR-023: Subtotal, tax, discount, and total shall be auto-calculated.
FR-024: Orders shall support draft, send, paid, cancelled, and completed states.
FR-025: Customers shall be assignable to orders.

### Promotions and Discounts
FR-026: Coupon codes shall be supported.
FR-027: Fixed and percentage discounts shall be supported.
FR-028: Automated promotions shall be supported.
FR-029: Coupon validation shall be enforced.

### Payment and Receipt
FR-030: Cash payments shall be supported.
FR-031: Card/digital payments shall be supported.
FR-032: UPI QR payments shall be supported.
FR-033: Change calculation shall be supported.
FR-034: Receipt printing and emailing shall be supported.

### Kitchen Display System
FR-035: Orders shall appear in KDS in real time.
FR-036: Kitchen staff shall update order status.
FR-037: Individual item completion shall be supported.
FR-038: KDS filters and search shall be supported.

### Customer Management
FR-039: Customer CRUD shall be supported.
FR-040: Customer contact information shall be stored.
FR-041: Customer order history may be displayed.

### Inventory Management
FR-042: Ingredient records shall be maintained.
FR-043: Stock quantities shall be branch-aware.
FR-044: Sales shall deduct stock automatically.
FR-045: Stock adjustments shall be supported.
FR-046: Low-stock and expiry alerts shall be generated.

### Procurement Management
FR-047: Supplier CRUD shall be supported.
FR-048: Purchase requisitions shall be generated.
FR-049: Purchase orders shall be created and approved.
FR-050: Goods receipt shall update stock.
FR-051: Supplier lead times shall be stored.

### Reporting
FR-052: Sales dashboards shall be generated.
FR-053: Product and category reports shall be generated.
FR-054: Inventory reports shall be generated.
FR-055: Procurement reports shall be generated.
FR-056: Reports shall support export.

### AI/ML
FR-057: Daily demand forecasts shall be generated.
FR-058: Ingredient demand shall be predicted.
FR-059: Reorder suggestions shall be generated.
FR-060: Prep-time estimation shall be supported.
FR-061: Sales anomalies shall be flagged.

## 5. Success Conditions
- Core restaurant flow works end to end
- Stock logic works correctly
- Reports are useful
- AI outputs are understandable
- System is product-ready in structure
