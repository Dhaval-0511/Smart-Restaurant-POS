# System Design

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the detailed system design, module design, UI design approach, database design overview, and workflow design.

## 1. Design Goals
- Make the system modular
- Keep the UI clean and usable
- Support fast billing operations
- Support real-time kitchen interaction
- Enable accurate stock handling
- Keep future commercialization possible

## 2. Module Design

### 2.1 Authentication Module
- Login
- Signup
- Role management
- Session handling
- Password reset

### 2.2 Product Module
- Product CRUD
- Category CRUD
- Variants/modifiers
- Tax setup
- Product availability

### 2.3 Recipe Module
- Ingredient mapping per product
- Unit management
- Wastage control
- Historical recipe safety

### 2.4 POS Module
- Floor popup
- Table selection
- Product list
- Category tabs
- Cart management
- Discount popup
- Payment flow
- Receipt generation

### 2.5 KDS Module
- Ticket queue
- Stage transition
- Item-level completion
- Search/filter
- Visual ticket highlighting

### 2.6 Inventory Module
- Ingredient master
- Stock in/out
- Manual adjustment
- Wastage log
- Expiry alert
- Low-stock alert

### 2.7 Procurement Module
- Supplier records
- Requisition list
- Purchase order creation
- Receive stock
- Lead-time tracking

### 2.8 Reports Module
- Revenue reports
- Order reports
- Product/category reports
- Session reports
- Stock reports
- Procurement reports

### 2.9 AI Module
- Sales forecasting
- Ingredient prediction
- Reorder recommendation
- Prep-time prediction
- Sales anomaly detection

## 3. UI Design Guidelines
- POS should be touch-friendly
- Large product cards
- Fast search
- Clean category navigation
- Clear table state indicators
- High-visibility KDS cards
- Dashboard-based admin pages

## 4. Screen Design List
- Login
- Dashboard
- Product page
- Category page
- Ingredient page
- Recipe builder
- Supplier page
- Purchase order page
- POS screen
- Table view
- Customer page
- Orders page
- KDS page
- Reports page
- AI insights page
- Session close page

## 5. Workflow Design

### Order Workflow
Create order -> Add products -> Apply discount -> Send to kitchen -> Prepare -> Pay -> Receipt -> Stock deduction

### Procurement Workflow
Detect low stock -> Generate suggestion -> Create purchase order -> Receive goods -> Update stock

### Forecast Workflow
Collect sales data -> Train/predict -> Compute ingredient demand -> Suggest reorder

## 6. Database Design Overview

Main tables:
- users
- roles
- branches
- categories
- products
- ingredients
- recipes
- floors
- tables
- orders
- order_items
- customers
- payments
- promotions
- coupons
- sessions
- stock_ledger
- suppliers
- purchase_orders
- purchase_order_items
- forecasts
- reorder_suggestions
- audit_logs

## 7. Validation Design
- Required fields validation
- Numeric bounds validation
- Status transition validation
- Permission validation
- Payment consistency validation
- Stock consistency validation

## 8. Design Quality Goals
- Reusability
- Maintainability
- Simplicity
- Traceability
- Extensibility
