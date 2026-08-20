# Software Requirements Specification (SRS)

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the software requirements of the Smart Restaurant Operations & POS Platform, including functional requirements, non-functional requirements, user roles, assumptions, constraints, and acceptance criteria.

## 1. Introduction
The system is a web-based platform for managing restaurant operations. It includes backend setup, POS billing, kitchen coordination, ingredient inventory, procurement planning, reporting, and AI/ML-based forecasting.

## 2. Scope
The software shall support:
- Backend admin management
- POS billing and order handling
- Real-time kitchen display
- Customer management
- Table and floor handling
- Promotions and coupons
- Inventory management
- Supplier and procurement handling
- Reporting and analytics
- AI/ML modules

## 3. Users
- Super Admin
- Branch Manager
- Inventory Manager
- Cashier
- Kitchen Staff

## 4. Functional Requirements

### 4.1 Authentication
- Users shall be able to register, log in, and log out.
- The system shall support password reset.
- The system shall implement role-based access control.
- The system shall restrict features based on user role.

### 4.2 Product Management
- Admin shall create, edit, delete, and archive products.
- Products shall include name, category, price, tax, description, and unit of measure.
- Products shall be searchable by name and category.
- Products may have variants and modifiers.

### 4.3 Category Management
- Admin shall create, edit, and delete categories.
- Categories shall have a name and color.
- Category colors shall reflect in POS screens.

### 4.4 Recipe Management
- A product may be linked to multiple ingredients.
- Recipe entries shall contain quantity, unit, and wastage percentage.
- Recipe changes shall not invalidate old orders.

### 4.5 Floor and Table Management
- Admin shall create floors.
- Admin shall create and manage tables under floors.
- Tables shall store table number, seat count, and active state.
- POS shall show occupied and free tables distinctly.

### 4.6 POS Order Handling
- Cashier shall create draft orders.
- Cashier shall add and remove products in cart.
- Cashier shall modify item quantities.
- System shall calculate subtotal, taxes, discounts, and total.
- Cashier shall assign customer to an order.
- Orders shall support dine-in, takeaway, and future delivery mode.
- Orders shall be saved, edited, cancelled, or completed.

### 4.7 Promotion and Coupon Handling
- Admin shall create coupon codes.
- System shall support fixed and percentage discounts.
- Automated promotions shall trigger by quantity or order amount.
- Coupon validity and usage limits shall be enforced.

### 4.8 Payment and Receipt
- System shall support cash payments.
- System shall support card/digital payments with transaction reference.
- System shall support UPI QR payments.
- System shall calculate change for cash.
- System shall print or email receipts.

### 4.9 Kitchen Display System
- Orders shall be sent to KDS in real time.
- Kitchen shall view order number, items, and quantities.
- KDS shall support stages: To Cook, Preparing, Completed.
- Kitchen shall update full-order and item-level status.

### 4.10 Customer Management
- Staff shall create, edit, search, and delete customers.
- Customer name, email, and phone shall be stored.
- Customer receipts may be sent by email.
- Customer order history may be referenced.

### 4.11 Inventory Management
- System shall maintain ingredient records.
- System shall maintain stock by branch.
- Sales shall deduct ingredient quantities using recipes.
- System shall support stock adjustments.
- System shall track wastage and expiry.
- System shall generate low-stock alerts.

### 4.12 Procurement
- System shall maintain supplier records.
- System shall generate purchase requisitions.
- Managers shall create and approve purchase orders.
- Receiving goods shall update stock.
- System shall support partial receiving.

### 4.13 Reports
- System shall display total orders, revenue, and average order value.
- System shall display top products and categories.
- System shall display session and employee reports.
- System shall export reports to PDF and Excel.
- System shall support date-based filtering.

### 4.14 AI/ML
- System shall forecast product demand.
- System shall estimate ingredient consumption.
- System shall suggest reorder quantity and date.
- System shall estimate kitchen preparation time.
- System shall flag abnormal sales behavior.

## 5. Non-Functional Requirements
- Responsive web UI
- Secure authentication and authorization
- Real-time update support
- Good performance on normal branch load
- Data consistency for payments and inventory
- Modular and maintainable code
- Multi-branch scalability
- Audit logging support

## 6. Assumptions
- Users have internet access during normal operations.
- Branch stock is maintained digitally.
- Historical order data becomes available after usage.
- Payment integrations may initially be semi-manual.

## 7. Constraints
- Final-year timeline may require phased delivery.
- Forecast quality depends on data volume.
- Full ERP integration is outside current scope.

## 8. Acceptance Criteria
- Order-to-payment flow works correctly.
- KDS updates in real time.
- Stock deductions are accurate.
- Low-stock alerts work.
- Reports generate correctly.
- Role restrictions are correctly enforced.

## 9. Future Enhancements
- Mobile applications
- Delivery integration
- Loyalty program
- SaaS multi-tenant deployment
- Dynamic pricing
