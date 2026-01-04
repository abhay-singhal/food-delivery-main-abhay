# Order Status Flow - Why Available Orders Might Be Empty

## 🔍 Problem

Your available orders list is empty because **only orders with status `READY`** are shown to delivery partners.

## 📊 Order Status Flow

```
Customer Places Order
    ↓
Status: PLACED
    ↓
Admin Accepts Order
    ↓
Status: ACCEPTED
    ↓
Admin Marks as Preparing
    ↓
Status: PREPARING
    ↓
Admin Marks as Ready
    ↓
Status: READY ← Only orders with this status appear in "Available Orders"
    ↓
Delivery Partner Accepts
    ↓
Status: OUT_FOR_DELIVERY
    ↓
Delivery Partner Marks as Delivered
    ↓
Status: DELIVERED
```

## ✅ Current Behavior

**Available Orders Endpoint** (`GET /api/v1/delivery/orders/available`):
- Returns orders with status: `READY`
- AND `deliveryBoy IS NULL` (unassigned)

**This means:**
- Orders with status `PLACED`, `ACCEPTED`, or `PREPARING` will NOT appear
- Only orders that admin has marked as `READY` will appear

## 🔧 Solution Applied

I've updated the endpoint to show orders in multiple statuses:
- `PLACED` - Customer just placed order
- `ACCEPTED` - Admin accepted the order
- `PREPARING` - Admin is preparing the order
- `READY` - Order is ready for delivery (can be accepted)

**Note:** Delivery partners can only **accept** orders that are `READY` or `PREPARING`. Orders in `PLACED` or `ACCEPTED` status will be visible but cannot be accepted yet.

## 🎯 How to Test

1. **Check your database:**
   ```sql
   SELECT id, order_number, status, delivery_boy_id 
   FROM orders 
   WHERE status IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY')
   AND delivery_boy_id IS NULL;
   ```

2. **Update an order to READY (via Admin API):**
   ```bash
   POST /api/v1/admin/orders/{orderId}/status?status=READY
   ```

3. **Or use the admin panel** to update order status to READY

## 📝 Admin Actions Required

For orders to appear in "Available Orders", admin must:

1. **Accept the order:** `POST /api/v1/admin/orders/{orderId}/accept`
   - Changes status: `PLACED` → `ACCEPTED`

2. **Mark as Preparing:** `POST /api/v1/admin/orders/{orderId}/status?status=PREPARING`
   - Changes status: `ACCEPTED` → `PREPARING`

3. **Mark as Ready:** `POST /api/v1/admin/orders/{orderId}/status?status=READY`
   - Changes status: `PREPARING` → `READY`
   - **This triggers push notifications to all available delivery partners**
   - **This makes the order appear in "Available Orders"**

## 🔔 Automatic Notifications

When an order status changes to `READY`:
- ✅ All available delivery partners receive push notification
- ✅ Order appears in "Available Orders" list
- ✅ First delivery partner to accept gets the order

## 💡 Quick Fix

If you want to see orders immediately without admin intervention, you can:

1. **Manually update orders in database:**
   ```sql
   UPDATE orders 
   SET status = 'READY' 
   WHERE status = 'PLACED' 
   AND delivery_boy_id IS NULL;
   ```

2. **Or use the admin API to update status:**
   ```bash
   POST /api/v1/admin/orders/{orderId}/status?status=READY
   ```

## 🎯 Summary

- **Available Orders** now shows: `PLACED`, `ACCEPTED`, `PREPARING`, and `READY` orders
- **Can Accept** only: `READY` or `PREPARING` orders
- **Admin must mark orders as READY** for delivery partners to accept them
- **When order becomes READY**, all delivery partners get notified automatically






