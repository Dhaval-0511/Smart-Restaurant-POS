# Technical Design Document (TDD)

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the technical blueprint for implementation of the Smart Restaurant Operations & POS Platform.

## 1. Technical Overview
The system is built as a layered web application with real-time updates and a separate AI/ML processing component.

## 2. Recommended Tech Stack

### Frontend
- React + TypeScript
- Next.js or Vite
- Tailwind CSS
- Zustand or Redux Toolkit

### Backend
- ASP.NET Core Web API
- Entity Framework Core
- JWT Authentication
- SignalR

### Database
- PostgreSQL
- Optional Redis cache/pub-sub

### AI/ML
- Python
- pandas
- scikit-learn
- Prophet
- FastAPI optional

## 3. Architectural Style
- Modular monolith initially
- Service-based internal structure
- Realtime event-driven communication for kitchen updates
- Clean separation between UI, business logic, and persistence

## 4. Core Services
- Auth Service
- Product Service
- Order Service
- Payment Service
- KDS Service
- Inventory Service
- Procurement Service
- Reporting Service
- AI Service

## 5. Data Model

Main entities:
- User
- Role
- Branch
- Product
- Category
- Ingredient
- Recipe
- Floor
- Table
- Order
- OrderItem
- Customer
- Payment
- Promotion
- Coupon
- Session
- StockLedger
- Supplier
- PurchaseOrder
- PurchaseOrderItem
- Forecast
- ReorderSuggestion
- AuditLog

## 6. Database Design Notes
- Use consistent IDs
- Use decimal for quantities and prices
- Use soft delete where appropriate
- Use indexes on product search and order lookup
- Use foreign keys for critical relations

## 7. API Standards
- RESTful naming
- Versioned endpoints
- JSON format
- Consistent error schema
- Pagination support
- Auth on protected routes

## 8. Sample Endpoints

### Auth
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password

### Products
- GET /api/v1/products
- POST /api/v1/products
- PUT /api/v1/products/{id}
- DELETE /api/v1/products/{id}

### Orders
- POST /api/v1/orders
- POST /api/v1/orders/{id}/send-kitchen
- POST /api/v1/orders/{id}/pay

### KDS
- GET /api/v1/kds/tickets
- PATCH /api/v1/kds/tickets/{id}/stage

### Inventory
- GET /api/v1/ingredients
- POST /api/v1/stock/adjustments

### Procurement
- GET /api/v1/suppliers
- POST /api/v1/purchase-orders

### AI
- GET /api/v1/ai/forecast
- GET /api/v1/ai/reorder-suggestions

## 9. Realtime Design
- POS sends order events
- KDS subscribes to order events
- Managers receive inventory alerts
- Session state changes may be broadcast

## 10. AI/ML Technical Logic

### Forecasting
- Use historical sales
- Build lag and seasonal features
- Predict next-day or next-week demand

### Ingredient Demand
- Convert product forecast to ingredient quantities using recipes

### Reorder Suggestion
- Compare predicted usage with current stock and safety stock
- Consider supplier lead time

### Prep-Time Prediction
- Use order size, product type, and kitchen load

## 11. Security Design
- Hashed passwords
- JWT validation
- Role policies
- Input validation
- HTTPS in production
- Audit logs for sensitive operations

## 12. Performance Design
- Index frequently queried data
- Cache product and category data
- Use async processing for reports and AI jobs
- Keep realtime payloads lightweight

## 13. Testing Strategy
- Unit testing
- Integration testing
- API testing
- UI testing
- Realtime behavior testing
- AI logic testing

## 14. Deployment Design
- Docker-based setup
- Frontend and backend deployment separation
- Managed PostgreSQL
- CI/CD via GitHub Actions

## 15. Risks and Mitigation
- Low ML accuracy -> fallback to rule-based predictions
- Realtime sync issues -> reconnection strategy
- Inventory mismatch -> strict ledger and tests
- Scope growth -> phased release plan

## 16. Conclusion
This design enables the project to be implemented in a modular and scalable way while supporting both final-year demonstration and future commercialization.
