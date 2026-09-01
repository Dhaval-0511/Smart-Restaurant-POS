# Smart Restaurant Operations & POS Platform

A comprehensive, web-based restaurant management solution integrating Point-of-Sale (POS) billing, real-time Kitchen Display System (KDS), ingredient-level inventory tracking, procurement management, operational reporting, and AI/ML-assisted decision support.

---

## 👥 Project Team

- **Dhaval Prajapati** (23CP043)
- **Hitiksha Patel** (23CP013)
- **Krince Visoriya** (23CP069)

---

## 🌟 Key Features

### 🛒 Point of Sale (POS) Terminal
- Fast, touch-optimized billing interface for cashiers.
- Multi-order types: **Dine-In**, **Takeaway**, and **Delivery**.
- Graphical floor plan with live table occupancy status.
- Automated calculation of subtotals, taxes, promotions, and discounts.
- Customer account linking and digital/printable receipt generation.

### 🍳 Real-Time Kitchen Display System (KDS)
- Instant order ticket transmission from POS to kitchen terminals via WebSockets.
- Stage-by-stage preparation tracking (*To Cook* $\rightarrow$ *Preparing* $\rightarrow$ *Completed*).
- Color-coded tickets with item quantities and special prep instructions.

### 📦 Recipe & Ingredient Inventory Control
- Recipe mapping connecting menu items to specific raw ingredients.
- Automatic stock deduction per order item sold.
- Low-stock alerts, manual stock adjustments, wastage logs, and expiry tracking.

### 🛒 Procurement & Supplier Management
- Supplier directory maintaining lead times, contact details, and price terms.
- Purchase order workflows (Draft $\rightarrow$ Approval $\rightarrow$ Goods Receipt).
- Automated purchase requisition suggestions based on stock thresholds.

### 🧠 AI / ML Decision Support
- Daily demand forecasting for menu products and ingredients.
- Intelligent reorder quantity and reorder date recommendations.
- Kitchen preparation time estimation and sales pattern anomaly detection.

### 📊 Analytics & Reporting Dashboards
- Key performance metrics: Total Revenue, Total Orders, and Average Order Value (AOV).
- Visual trend charts for sales, category breakdown, and item velocity.
- Filterable reports by shift session, employee, product, and custom date range.
- Export options to PDF and Excel formats.

---

## 🔐 User Roles & Access Control

- **Super Admin:** Full platform administration, settings, and multi-branch management.
- **Branch Manager:** Branch-level supervision, report analytics, and purchase approvals.
- **Inventory Manager:** Recipe creation, ingredient ledgers, stock management, and purchase orders.
- **Cashier:** POS operations, table management, order taking, and payment handling.
- **Kitchen Staff:** Real-time KDS order fulfillment and preparation status updates.

---

## ⚙️ Operating Environment

- **Frontend:** Responsive web interface for desktop PCs, touch POS terminals, and KDS tablets.
- **Backend API:** Node.js / Express REST API with real-time WebSocket communication.
- **Database:** PostgreSQL (Cloud hosted on Neon).
- **Intelligence:** AI/ML engine for demand forecasting and predictive ordering.

---

## 🚀 Future Enhancements

- Dedicated mobile apps for staff, table-side ordering, and management.
- Integration with third-party food delivery aggregators.
- Customer loyalty program and dynamic demand-based pricing models.
- Multi-tenant SaaS architecture for multi-outlet restaurant chains.
