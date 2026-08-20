# Smart Restaurant Operations & POS Platform

**Software Requirements Specification (SRS) - Version 1.0**  
**Date:** August 2026  

### Prepared By
- **Dhaval Prajapati** (23CP043)
- **Hitiksha Patel** (23CP013)
- **Krince Visoriya** (23CP069)

---

## 1. Introduction

### 1.1 Purpose
The **Smart Restaurant Operations & POS Platform** is a web-based, end-to-end restaurant management solution. It seamlessly integrates point-of-sale (POS) billing, real-time kitchen display coordination (KDS), ingredient-level inventory control, procurement planning, operational reporting, and AI/ML-assisted decision support.

### 1.2 Scope
The platform provides unified tools for:
- Backend configuration and administration
- Touch-friendly POS terminal for order processing & billing
- Real-time Kitchen Display System (KDS) for ticket tracking
- Table and floor plan management for dine-in operations
- Flexible promotions, coupons, and discount engine
- Ingredient-level stock & inventory control
- Supplier management and purchase order workflows
- Reporting and analytics dashboards
- Predictive AI/ML modules for demand forecasting & reorder recommendations

### 1.3 Intended Audience
- Project Supervisor & Evaluation Committee
- Development Team
- Future Stakeholders & Restaurant Operators

---

## 2. Overall Description

### 2.1 Product Perspective
Designed for cafes, restaurants, bakeries, cloud kitchens, juice bars, and quick-service outlets. The system transforms standard POS software into an intelligent operations platform by combining front-of-house sales, back-of-house kitchen workflows, inventory tracking, supplier procurement, and predictive analytics.

### 2.2 Core Product Functions
- **Admin Management:** Configure products, categories, employees, floor layout, tables, payment gateways, and promotional schemes.
- **POS Billing Terminal:** Fast order processing, table assignment, customer linking, automated discount calculation, and multi-method payments.
- **Kitchen Display System (KDS):** Live ticket dispatching with stage updates (*To Cook*, *Preparing*, *Completed*).
- **Inventory Tracking:** Real-time recipe-based stock deduction and low-stock alerts.
- **Procurement & Purchasing:** Vendor management, purchase requisitions, and stock receiving.
- **AI/ML Decision Support:** Sales pattern detection, item demand forecasting, and smart reorder suggestions.
- **Analytics & Reporting:** Multi-dimensional insights into revenue, top-selling items, employee performance, and stock movement.

### 2.3 User Classes & Roles
1. **Super Admin:** Complete system configuration, user access management, and multi-branch settings.
2. **Branch Manager:** Branch-level oversight, report viewing, and purchase approval.
3. **Inventory Manager:** Recipe setup, ingredient tracking, supplier management, and purchase order fulfillment.
4. **Cashier:** POS terminal operation, table service, customer order entry, and payment collection.
5. **Kitchen Staff:** KDS screen operations, dish preparation status updates, and order completion marking.

---

## 3. System Features & Modules

### 3.1 Authentication & Authorization
- Secure registration, login, and password reset functionality.
- Role-Based Access Control (RBAC) enforcing strict permission boundaries.
- User management (Create, Update, Archive, Delete) with comprehensive audit logging.

### 3.2 Menu & Product Management
- Categorized menu configuration with customized color coding for POS display.
- Detailed product metadata (price, tax rate, unit of measure, active/inactive status, descriptions).
- Real-time product search and filter capabilities.

### 3.3 Recipe & Ingredient Management
- Multi-ingredient mapping per menu product.
- Recipe specifications including ingredient quantity, unit, and wastage factor.
- Automatic inventory deduction based on order item fulfillment.

### 3.4 Floor & Table Management
- Graphical floor setup (Ground Floor, First Floor, Outdoor, etc.).
- Table allocation storing seating capacity and active status.
- Live POS table layout displaying availability versus occupied status.

### 3.5 POS Terminal & Order Management
- Fast item cart builder supporting custom quantities and add-ons.
- Automatic tax, subtotal, discount, and grand total computations.
- Support for Dine-In, Takeaway, and Delivery order types.
- Order lifecycle states: `DRAFT` $\rightarrow$ `SENT` $\rightarrow$ `PAID` $\rightarrow$ `COMPLETED` / `CANCELLED`.

### 3.6 Promotions & Discounts
- Coupon engine supporting percentage and fixed-amount discounts.
- Automated threshold promotions (e.g., minimum order quantity/value).
- Real-time discount validation and receipt summary integration.

### 3.7 Payment & Receipt Processing
- Multi-channel payments: Cash (with change calculator), Credit/Debit Card, and UPI (dynamic QR generation).
- Digital receipt generation with options for printing and automated email delivery.

### 3.8 Kitchen Display System (KDS)
- Instant order dispatch to KDS upon cashier submission.
- Color-coded order cards showing items, quantities, special notes, and elapsed time.
- Status management per item or full order (*To Cook*, *Preparing*, *Completed*).

### 3.9 Customer Relationship Management
- Customer profile directory (name, email, phone number).
- Customer linking during checkout for personalized order history and digital receipts.

### 3.10 Inventory & Stock Control
- Ingredient master ledger with real-time stock balances per branch.
- Automated deduction upon sale via recipe mappings.
- Manual stock adjustments, wastage logs, expiry tracking, and low-stock notification triggers.

### 3.11 Procurement & Supplier Management
- Supplier directory with contact details, pricing contracts, and lead times.
- Automated reorder point suggestions and purchase order workflow (Draft $\rightarrow$ Approved $\rightarrow$ Received).
- Partial stock receiving and inventory ledger updating.

### 3.12 Reporting & Executive Dashboards
- Key performance metrics: Total Revenue, Total Orders, Average Order Value (AOV).
- Visual trend charts for sales velocity, product popularity, and category revenue share.
- Filterable reports by date range, shift session, employee, and category.
- Export options for PDF and Excel reports.

### 3.13 AI/ML Predictive Intelligence
- Daily item-level demand forecasting based on historical sales data.
- Ingredient requirement projections derived from forecasted demand.
- Smart purchase recommendations (reorder quantities and dates).
- Kitchen prep-time estimation and sales anomaly detection.

---

## 4. Technical & Non-Functional Requirements

### 4.1 Performance & Reliability
- POS interface optimized for low-latency touch response.
- Real-time KDS update broadcasting with sub-second transmission delays.
- Transactional consistency across payment records, orders, and stock ledgers.

### 4.2 Security
- Enforced password hashing (Bcrypt).
- JWT (JSON Web Tokens) for stateless, secure API authentication.
- Sanitized input fields to prevent injection vulnerabilities and unauthorized role escalation.

### 4.3 Interface Standards
- **User Interface:** Responsive web client suitable for desktop monitors, POS terminals, and KDS tablets.
- **APIs & Protocols:** RESTful API design, WebSocket event channels for real-time kitchen updates, and HTTPS encryption.

---

## 5. Acceptance Criteria

- **End-to-End Workflow:** Flawless transition from order creation $\rightarrow$ KDS preparation $\rightarrow$ payment $\rightarrow$ receipt dispatch.
- **Stock Deductions:** Accurate recipe-based ingredient stock ledger updates.
- **KDS Synchronisation:** Instant notification delivery across kitchen terminals.
- **Access Control:** Strict role segregation enforced on all endpoints and UI views.

---

## 6. Future Scope & Enhancements

- Mobile apps for table-side ordering and manager monitoring.
- Direct integration with food delivery aggregators.
- Customer loyalty program and dynamic demand-based pricing algorithms.
- Multi-tenant SaaS architecture for multi-restaurant chains.
