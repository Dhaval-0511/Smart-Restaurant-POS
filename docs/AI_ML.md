# AI/ML Module

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the AI/ML models, datasets, forecasting logic, reorder logic, and anomaly detection approach for the platform.

---

## 1. Overview
The AI/ML module provides intelligent decision support to restaurant managers. It does not replace human decisions but provides data-driven recommendations.

---

## 2. Use Cases

| Use Case | Description |
|---|---|
| Demand Forecasting | Predict how many units of each product will be sold |
| Ingredient Demand | Calculate ingredient requirements from demand forecast |
| Reorder Suggestion | Recommend when and how much to reorder |
| Prep-Time Estimation | Estimate kitchen preparation time per order |
| Sales Anomaly Detection | Flag unusual spikes or drops in sales |
| Promotion Recommendation | Suggest promotions for slow-moving items |

---

## 3. Data Requirements

### Input Data Sources
- orders table (historical order data)
- order_items table (product-level sales)
- recipes table (ingredient consumption mapping)
- stock_ledger table (current stock levels)
- purchase_orders table (supplier lead times)
- ingredients table (reorder levels)

### Minimum Data Requirement
- At least 30 days of order history for basic forecasting
- At least 90 days for seasonal pattern detection

---

## 4. Demand Forecasting

### Goal
Predict how many units of each product will be ordered in the next N days.

### Approach
- Aggregate daily sales per product from order_items
- Build time-series features: lag values, rolling averages, day-of-week, is-weekend
- Train regression or time-series model per product or category
- Output: predicted quantity per product per day

### Models
- Prophet (Facebook) for time-series with seasonality
- scikit-learn regression as fallback

### Output Table
- forecasts table: productId, forecastDate, predictedQuantity, confidenceScore

---

## 5. Ingredient Demand Calculation

### Goal
Convert product demand forecast into ingredient consumption estimate.

### Approach
- For each forecasted product quantity, look up recipe
- Multiply ingredient quantity by forecast quantity
- Apply wastage percentage
- Sum across all products for each ingredient

### Formula
```
ingredientDemand = SUM(forecastQty * recipeQty * (1 + wastage/100))
```

---

## 6. Reorder Suggestion

### Goal
Tell the inventory manager when and how much of each ingredient to order.

### Logic
```
reorderPoint = avgDailyUsage * leadTimeDays + safetyStock
if currentStock <= reorderPoint:
    suggestedQty = (avgDailyUsage * coverageDays) - currentStock
    create reorder suggestion
```

### Variables
- avgDailyUsage: derived from ingredient demand forecast
- leadTimeDays: from supplier record
- safetyStock: configurable per ingredient (defaults to 20% of weekly usage)
- coverageDays: configurable, default 7 days

### Output Table
- reorder_suggestions: ingredientId, suggestedQuantity, reason, isApproved

### Rule
Suggestions are advisory. Manager must approve before purchase order is created.

---

## 7. Prep-Time Estimation

### Goal
Estimate how long an order will take to prepare in the kitchen.

### Approach
- Use historical kitchen order data (createdAt to completed timestamp)
- Features: number of items, product types, current kitchen load, time of day
- Predict estimated completion time per new order

### Model
- Linear regression or gradient boosting

### Output
- Displayed on KDS as estimated ready time
- Used for customer-facing wait time display (future)

---

## 8. Sales Anomaly Detection

### Goal
Flag days or time periods where sales are unusually high or low.

### Approach
- Calculate rolling average and standard deviation of daily revenue
- Flag if actual deviates more than 2 standard deviations from expected
- Alert manager with summary

### Output
- Anomaly flag stored with date and description
- Shown on reporting dashboard

---

## 9. Promotion Recommendation

### Goal
Suggest running promotions on slow-moving products to clear stock.

### Logic
- Identify products with below-average sales velocity in last 14 days
- Cross-reference with ingredient stock nearing expiry
- Suggest a discount or bundle promotion for those products

### Output
- Recommendation list shown in admin dashboard

---

## 10. Model Training Strategy

### Phase 1 (Rule-Based Fallback)
- Use simple moving average for forecasting
- Use fixed safety stock formulas for reorder
- No ML training required initially

### Phase 2 (ML Models)
- Train models when sufficient data is available (30+ days)
- Retrain periodically (weekly batch job)
- Compare rule-based vs ML output and use best

### Execution
- Python scripts run as scheduled jobs (cron or task scheduler)
- Results written to forecasts and reorder_suggestions tables
- REST API exposes results to frontend

---

## 11. Tech Stack for AI Module
- Python 3.10+
- pandas (data processing)
- scikit-learn (regression, anomaly)
- Prophet (time-series forecasting)
- psycopg2 or SQLAlchemy (PostgreSQL connection)
- FastAPI (optional microservice wrapper)

---

## 12. AI Rules
- AI forecasts do not auto-create purchase orders
- Manager approval required before procurement action
- Confidence score must be stored with each prediction
- If data is insufficient, system falls back to rule-based logic
- All AI outputs must be explainable in plain language
