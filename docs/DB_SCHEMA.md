# Database Schema

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the database tables, columns, types, relationships, and constraints for the platform.

---

## Database
PostgreSQL

## ORM
Prisma

---

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| email | String | Unique, required |
| password | String | Hashed, required |
| role | Enum (ADMIN, EMPLOYEE) | Default: EMPLOYEE |
| status | Enum (PENDING, APPROVED, REJECTED) | Default: PENDING |
| resetPasswordToken | String | Nullable, unique |
| resetPasswordExpires | DateTime | Nullable |
| isArchived | Boolean | Default: false |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### categories
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Unique, required |
| color | String | Default: #000000 |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### products
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| categoryId | UUID | FK -> categories |
| price | Decimal(10,2) | Required |
| unitOfMeasure | String | Default: piece |
| tax | Decimal(5,2) | Default: 0 |
| description | String | Nullable |
| imageUrl | String | Nullable |
| showInKds | Boolean | Default: false |
| isActive | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### ingredients
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| unit | String | Required (kg, g, L, ml, pcs) |
| reorderLevel | Decimal(10,2) | Threshold for low-stock alert |
| expiryTracked | Boolean | Default: false |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### recipes
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| productId | UUID | FK -> products |
| ingredientId | UUID | FK -> ingredients |
| quantity | Decimal(10,4) | Required, > 0 |
| wastagePercent | Decimal(5,2) | Default: 0 |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### stock_ledger
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| ingredientId | UUID | FK -> ingredients |
| branchId | UUID | FK -> branches (future) |
| type | Enum (IN, OUT, ADJUSTMENT, WASTAGE) | Required |
| quantity | Decimal(10,4) | Required |
| reason | String | Nullable |
| referenceId | UUID | Nullable (orderId, purchaseOrderId) |
| createdAt | DateTime | Auto |

---

### suppliers
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| contactName | String | Nullable |
| email | String | Nullable |
| phone | String | Nullable |
| leadTimeDays | Int | Default: 1 |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### purchase_orders
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| supplierId | UUID | FK -> suppliers |
| status | Enum (DRAFT, ORDERED, RECEIVED, PARTIAL) | Default: DRAFT |
| totalAmount | Decimal(10,2) | Required |
| orderedAt | DateTime | Nullable |
| receivedAt | DateTime | Nullable |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### purchase_order_items
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| purchaseOrderId | UUID | FK -> purchase_orders |
| ingredientId | UUID | FK -> ingredients |
| quantity | Decimal(10,4) | Required |
| receivedQuantity | Decimal(10,4) | Default: 0 |
| unitPrice | Decimal(10,2) | Required |
| createdAt | DateTime | Auto |

---

### floors
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Unique, required |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### tables
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| floorId | UUID | FK -> floors |
| tableNumber | String | Required |
| seats | Int | Required |
| isActive | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### customers
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| email | String | Nullable |
| phone | String | Nullable |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### sessions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK -> users |
| openedAt | DateTime | Auto |
| closedAt | DateTime | Nullable |
| closingAmount | Decimal(10,2) | Nullable |
| status | Enum (OPEN, CLOSED) | Default: OPEN |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### orders
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| orderNumber | String | Unique |
| sessionId | UUID | FK -> sessions |
| tableId | UUID | Nullable, FK -> tables |
| customerId | UUID | Nullable, FK -> customers |
| employeeId | UUID | FK -> users |
| status | Enum (DRAFT, PAID, CANCELLED) | Default: DRAFT |
| subtotal | Decimal(10,2) | Required |
| taxAmount | Decimal(10,2) | Default: 0 |
| discountAmount | Decimal(10,2) | Default: 0 |
| total | Decimal(10,2) | Required |
| paymentMethod | String | Nullable |
| paymentReference | String | Nullable |
| couponId | UUID | Nullable, FK -> coupons |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### order_items
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| orderId | UUID | FK -> orders |
| productId | UUID | FK -> products |
| quantity | Decimal(10,2) | Required |
| unitPrice | Decimal(10,2) | Required |
| lineTotal | Decimal(10,2) | Required |
| discountAmount | Decimal(10,2) | Default: 0 |
| promotionId | UUID | Nullable, FK -> promotions |
| createdAt | DateTime | Auto |

---

### kitchen_orders
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| orderId | UUID | FK -> orders |
| orderItemId | UUID | FK -> order_items |
| productId | UUID | FK -> products |
| assignedToId | UUID | Nullable, FK -> users |
| status | Enum (TO_COOK, PREPARING, COMPLETED) | Default: TO_COOK |
| isItemCompleted | Boolean | Default: false |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### payment_methods
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| type | Enum (CASH, CARD, UPI) | Required |
| isEnabled | Boolean | Default: true |
| upiId | String | Nullable |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### coupons
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| code | String | Unique, required |
| discountType | Enum (PERCENTAGE, FIXED) | Required |
| discountValue | Decimal(10,2) | Required |
| isActive | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### promotions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| type | Enum (PRODUCT, ORDER) | Required |
| discountType | Enum (PERCENTAGE, FIXED) | Required |
| discountValue | Decimal(10,2) | Required |
| productId | UUID | Nullable |
| minQuantity | Int | Nullable |
| minOrderAmount | Decimal(10,2) | Nullable |
| isActive | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### forecasts
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| productId | UUID | FK -> products |
| forecastDate | DateTime | Required |
| predictedQuantity | Decimal(10,2) | Required |
| confidenceScore | Decimal(5,2) | Nullable |
| createdAt | DateTime | Auto |

---

### reorder_suggestions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| ingredientId | UUID | FK -> ingredients |
| suggestedQuantity | Decimal(10,2) | Required |
| reason | String | Nullable |
| isApproved | Boolean | Default: false |
| createdAt | DateTime | Auto |

---

### audit_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK -> users |
| action | String | Required |
| entity | String | Required |
| entityId | UUID | Nullable |
| details | JSON | Nullable |
| createdAt | DateTime | Auto |

---

## Relationships Summary
- User -> Sessions (1:many)
- User -> Orders (1:many)
- Category -> Products (1:many)
- Product -> RecipeLines (1:many)
- Ingredient -> RecipeLines (1:many)
- Ingredient -> StockLedger (1:many)
- Supplier -> PurchaseOrders (1:many)
- PurchaseOrder -> PurchaseOrderItems (1:many)
- Floor -> Tables (1:many)
- Session -> Orders (1:many)
- Order -> OrderItems (1:many)
- Order -> KitchenOrders (1:many)
- OrderItem -> KitchenOrders (1:many)

## Enum Summary
| Enum | Values |
|---|---|
| Role | ADMIN, EMPLOYEE |
| UserStatus | PENDING, APPROVED, REJECTED |
| OrderStatus | DRAFT, PAID, CANCELLED |
| KitchenStatus | TO_COOK, PREPARING, COMPLETED |
| SessionStatus | OPEN, CLOSED |
| PaymentType | CASH, CARD, UPI |
| DiscountType | PERCENTAGE, FIXED |
| PromotionType | PRODUCT, ORDER |
| StockMovementType | IN, OUT, ADJUSTMENT, WASTAGE |
| PurchaseOrderStatus | DRAFT, ORDERED, RECEIVED, PARTIAL |
