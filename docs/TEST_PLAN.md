# Test Plan

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the testing strategy, test categories, module-wise test cases, and acceptance criteria for the platform.

---

## 1. Testing Strategy

### Approach
- Test each module independently before integration
- Cover happy path and edge cases
- Test role-based access for each protected route
- Test real-time behavior for KDS
- Test inventory deduction accuracy

### Test Levels
| Level | Description |
|---|---|
| Unit Tests | Test individual functions and utilities |
| Integration Tests | Test API endpoints with real database |
| UI Tests | Test frontend flows manually |
| Realtime Tests | Test socket events between POS and KDS |
| AI Logic Tests | Test forecast and reorder output |

---

## 2. Authentication Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| AUTH-001 | Register with valid data | 201 Created, status PENDING |
| AUTH-002 | Register with existing email | 400 Error, duplicate email |
| AUTH-003 | Login with PENDING account | 403 Forbidden, pending message |
| AUTH-004 | Login with APPROVED account and correct password | 200 OK, JWT token returned |
| AUTH-005 | Login with wrong password | 401 Unauthorized |
| AUTH-006 | Login with REJECTED account | 403 Forbidden |
| AUTH-007 | Forgot password with valid email | 200 OK, email sent |
| AUTH-008 | Forgot password with unknown email | 200 OK (no leak), silent success |
| AUTH-009 | Reset password with valid token | 200 OK, password updated |
| AUTH-010 | Reset password with expired token | 400 Error, token expired |
| AUTH-011 | Admin approve user and assign role | User status APPROVED, role set |
| AUTH-012 | Admin reject user | User status REJECTED |
| AUTH-013 | Remember Me checked | Token stored in localStorage |
| AUTH-014 | Remember Me unchecked | Token stored in sessionStorage |
| AUTH-015 | Access protected route without token | 401 Unauthorized |
| AUTH-016 | Access admin route as EMPLOYEE | 403 Forbidden |

---

## 3. Product Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| PROD-001 | Create product with valid data | 201 Created |
| PROD-002 | Create product without category | 400 Validation error |
| PROD-003 | Create product with negative price | 400 Validation error |
| PROD-004 | Update product name | 200 Updated |
| PROD-005 | Deactivate product | Product hidden from POS |
| PROD-006 | Delete product | Product removed |
| PROD-007 | Search product by name | Matching results returned |
| PROD-008 | Filter products by category | Only matching category returned |

---

## 4. Order Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| ORD-001 | Create draft order | Order created with DRAFT status |
| ORD-002 | Add items to order | Cart updated, totals recalculated |
| ORD-003 | Apply valid coupon | Discount applied correctly |
| ORD-004 | Apply expired coupon | 400 Error, coupon expired |
| ORD-005 | Send order to kitchen | Status updated, KDS ticket created |
| ORD-006 | Pay order with cash | Status PAID, receipt generated |
| ORD-007 | Pay order with UPI | Status PAID, QR generated |
| ORD-008 | Cancel draft order | Status CANCELLED |
| ORD-009 | Edit paid order | 403 Forbidden |
| ORD-010 | Tax calculated correctly | Tax amount matches product tax rate |

---

## 5. KDS Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| KDS-001 | Order appears in KDS after send-to-kitchen | Real-time ticket shown |
| KDS-002 | Update stage to PREPARING | Status updated in DB and UI |
| KDS-003 | Mark item as completed | Item completion flag set |
| KDS-004 | Mark full order as COMPLETED | All items completed |
| KDS-005 | KDS reconnects after network drop | Pending tickets reload |

---

## 6. Inventory Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| INV-001 | Stock deducts after order paid | Ledger entry created, stock reduced |
| INV-002 | Manual stock adjustment with reason | Ledger entry created |
| INV-003 | Stock falls below reorder level | Low-stock alert triggered |
| INV-004 | Wastage entry recorded | Ledger entry with type WASTAGE |
| INV-005 | Expiry flagged for expired ingredient | Warning shown |

---

## 7. Procurement Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| PROC-001 | Create supplier | Supplier record created |
| PROC-002 | Create purchase order | PO created with DRAFT status |
| PROC-003 | Receive full goods | Stock increased, PO status RECEIVED |
| PROC-004 | Receive partial goods | PO status PARTIAL, remaining balance tracked |
| PROC-005 | Supplier lead time used in reorder | Suggestion accounts for lead time |

---

## 8. Reports Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| RPT-001 | Sales report for date range | Correct total shown |
| RPT-002 | Top products report | Ranked by quantity sold |
| RPT-003 | Export report to PDF | PDF generated with filters applied |
| RPT-004 | Export report to Excel | XLS file with correct data |
| RPT-005 | Cancelled orders excluded from revenue | Revenue totals correct |

---

## 9. Role-Based Access Tests

| Test ID | Test Case | Expected Result |
|---|---|---|
| RBAC-001 | EMPLOYEE accesses admin endpoint | 403 Forbidden |
| RBAC-002 | ADMIN accesses all endpoints | 200 OK |
| RBAC-003 | Archived user tries to login | 403 Forbidden |
| RBAC-004 | PENDING user tries to login | 403 Forbidden |

---

## 10. Acceptance Criteria
- All AUTH test cases pass
- Order-to-payment flow completes without errors
- KDS updates in real time
- Stock deduction is accurate
- Reports generate with correct data
- Role restrictions enforced correctly
- AI suggestions are generated and displayed
