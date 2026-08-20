# Business and System Rules

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the business rules, system rules, validation rules, and operational rules for the platform.

## 1. User Rules
- Only active users can log in.
- Access permissions depend on role.
- Users can access only permitted branches and modules.
- Archived users cannot perform any operation.

## 2. Product Rules
- Every product must belong to a category.
- Product price cannot be negative.
- Inactive products must not appear in POS.
- Product tax must be applied during bill calculation.

## 3. Recipe Rules
- Recipe lines must have valid ingredient references.
- Quantity must be greater than zero.
- Recipe edits must not affect old completed orders.
- Wastage percent must be non-negative.

## 4. Order Rules
- Orders begin in draft state.
- Only active products may be ordered.
- Order quantity must be positive.
- Paid orders are locked from normal editing.
- Cancelled orders must be marked separately from paid orders.

## 5. Table Rules
- Every table belongs to one floor.
- Occupied tables must show active status.
- One table should normally have one active order at a time.

## 6. Promotion Rules
- Coupon code must be unique.
- Expired coupons cannot be applied.
- Usage limit must be checked before applying coupon.
- Automated promotions trigger only when rule conditions are met.

## 7. Payment Rules
- Only enabled payment methods can be used.
- Cash payment requires received amount.
- Card/digital payment requires a transaction reference.
- Receipt is generated only after successful payment.

## 8. Kitchen Rules
- Only sent orders appear in KDS.
- KDS stages are To Cook, Preparing, and Completed.
- Item-level completion must be allowed.
- Unauthorized users cannot change kitchen states.

## 9. Inventory Rules
- Inventory deduction uses recipe quantities.
- Every stock change creates a ledger entry.
- Manual adjustments require reason entry.
- Low-stock alerts trigger when quantity falls below threshold.
- Expired stock must be flagged.

## 10. Procurement Rules
- Purchase order requires supplier.
- Goods receipt increases stock.
- Partial receiving updates remaining balance.
- Supplier lead time should influence reorder planning.

## 11. AI Rules
- AI requires historical order data.
- Forecasts should not auto-approve purchase orders.
- Reorder suggestion is advisory until manager approval.
- Model confidence should be stored when possible.

## 12. Reporting Rules
- Reports must respect filters.
- Export must match current filtered data.
- Paid and cancelled orders must not be mixed incorrectly.

## 13. Security Rules
- Passwords must be hashed.
- JWT must be validated on protected routes.
- Unauthorized actions must be blocked.
- Sensitive operations must be audited.
