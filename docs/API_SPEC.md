# API Specification

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines all API endpoints, request/response formats, authentication requirements, and error schemas for the platform.

---

## Base URL
```
/api/v1
```

## Authentication
All protected routes require a Bearer JWT token in the Authorization header.
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user. Account starts with PENDING status until admin approves.

**Request**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response 201**
```json
{
  "message": "Registration submitted. Awaiting admin approval."
}
```

---

### POST /auth/login
Authenticate a user and receive a JWT token.

**Request**
```json
{
  "email": "string",
  "password": "string",
  "rememberMe": true
}
```

**Response 200**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "ADMIN | EMPLOYEE"
  }
}
```

---

### POST /auth/forgot-password
Request a password reset email.

**Request**
```json
{
  "email": "string"
}
```

**Response 200**
```json
{
  "message": "Reset link sent to your email."
}
```

---

### POST /auth/reset-password
Reset password using the token from email.

**Request**
```json
{
  "token": "string",
  "password": "string"
}
```

**Response 200**
```json
{
  "message": "Password updated successfully."
}
```

---

### GET /auth/pending-users
Admin only. Fetch all users with PENDING status.

**Response 200**
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "createdAt": "datetime"
  }
]
```

---

### PATCH /auth/approve-user/:id
Admin only. Approve a pending user and assign role.

**Request**
```json
{
  "role": "ADMIN | EMPLOYEE"
}
```

**Response 200**
```json
{
  "message": "User approved successfully."
}
```

---

### PATCH /auth/reject-user/:id
Admin only. Reject a pending registration request.

**Response 200**
```json
{
  "message": "User rejected."
}
```

---

## Product Endpoints

### GET /products
Get all active products. Supports query params: `?category=&search=`

### POST /products
Admin only. Create a new product.

### GET /products/:id
Get a single product by ID.

### PUT /products/:id
Admin only. Update a product.

### DELETE /products/:id
Admin only. Delete a product.

---

## Category Endpoints

### GET /categories
Get all categories.

### POST /categories
Admin only. Create a category.

### PUT /categories/:id
Admin only. Update a category.

### DELETE /categories/:id
Admin only. Delete a category.

---

## Order Endpoints

### GET /orders
Get all orders for current session.

### POST /orders
Create a new draft order.

### GET /orders/:id
Get a single order.

### PUT /orders/:id
Update an existing draft order.

### POST /orders/:id/send-kitchen
Send order to KDS.

### POST /orders/:id/pay
Mark order as paid with payment details.

### DELETE /orders/:id
Cancel or delete a draft order.

---

## KDS Endpoints

### GET /kds/tickets
Get all active kitchen tickets.

### PATCH /kds/tickets/:id/stage
Update ticket preparation stage.

### PATCH /kds/tickets/:id/item/:itemId
Mark individual item as complete.

---

## Customer Endpoints

### GET /customers
Search and list customers.

### POST /customers
Create a new customer.

### PUT /customers/:id
Update customer details.

### DELETE /customers/:id
Delete a customer.

---

## Floor and Table Endpoints

### GET /floors
List all floors with tables.

### POST /floors
Create a floor.

### POST /floors/:id/tables
Add a table to a floor.

### PUT /tables/:id
Update table details.

### DELETE /tables/:id
Delete a table.

---

## Inventory Endpoints

### GET /ingredients
List all ingredients.

### POST /ingredients
Create a new ingredient.

### PUT /ingredients/:id
Update an ingredient.

### GET /stock
Get current stock levels.

### POST /stock/adjustments
Manual stock adjustment entry.

### GET /stock/ledger
Get stock movement history.

---

## Procurement Endpoints

### GET /suppliers
List all suppliers.

### POST /suppliers
Create a supplier.

### PUT /suppliers/:id
Update supplier.

### GET /purchase-orders
List all purchase orders.

### POST /purchase-orders
Create a purchase order.

### POST /purchase-orders/:id/receive
Record goods receipt.

---

## Reports Endpoints

### GET /reports/sales
Sales summary report with date filters.

### GET /reports/products
Top products report.

### GET /reports/categories
Category revenue report.

### GET /reports/sessions
Session-wise report.

### GET /reports/inventory
Inventory movement report.

---

## AI Endpoints

### GET /ai/forecast
Get product demand forecast.

### GET /ai/reorder-suggestions
Get reorder suggestions based on stock and forecast.

### GET /ai/prep-time/:productId
Get estimated preparation time.

---

## Error Schema
All errors return consistent format:
```json
{
  "error": true,
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

## Common Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |
