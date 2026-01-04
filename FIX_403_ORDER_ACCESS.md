# Fix 403 Error: Order Access Denied

## Problem
Getting `403 Forbidden` when accessing `/api/v1/customer/orders/15`

## Root Cause
The order's `customer_id` doesn't match the authenticated user's ID. The backend checks ownership and returns 403 if they don't match.

## Solution

### Step 1: Find Your Customer ID
```sql
-- Find your customer ID (the one you're logged in as)
SELECT id, mobile_number, role, full_name
FROM users
WHERE role = 'CUSTOMER'
ORDER BY created_at DESC;
```

### Step 2: Check Order's Customer ID
```sql
-- Check which customer the order belongs to
SELECT 
    o.id AS order_id,
    o.order_number,
    o.customer_id,
    u.mobile_number AS customer_mobile
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id
WHERE o.id = 15;
```

### Step 3: Fix the Order
```sql
-- Update order to match your customer ID
-- Replace YOUR_CUSTOMER_ID with the ID from Step 1
UPDATE orders 
SET customer_id = YOUR_CUSTOMER_ID
WHERE id = 15;
```

### Quick Fix (Assign to First Customer)
```sql
-- If you just want to test, assign to first available customer
UPDATE orders 
SET customer_id = (SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1)
WHERE id = 15;
```

## Verification
```sql
-- Verify the fix
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    u.mobile_number AS customer_mobile,
    u.role
FROM orders o
JOIN users u ON o.customer_id = u.id
WHERE o.id = 15;
```

## Alternative: Create Order with Correct Customer
If you want to create a new order that belongs to your customer:

```sql
INSERT INTO orders (
    order_number, customer_id, delivery_boy_id, status, subtotal, 
    delivery_charge, total_amount, payment_method, delivery_address,
    delivery_latitude, delivery_longitude, delivery_city, 
    special_instructions, created_at, updated_at
) VALUES (
    CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0')),
    YOUR_CUSTOMER_ID,  -- Use your actual customer ID
    NULL,
    'READY',
    250.00,
    25.00,
    275.00,
    'COD',
    '123 Main Street, Apartment 4B, Meerut, Uttar Pradesh',
    28.9845,
    77.7064,
    'Meerut',
    'Please call before delivery',
    NOW(),
    NOW()
);
```

## Notes
- The 403 error is a security feature - customers can only access their own orders
- Make sure you're logged in as the customer who owns the order
- If you created the order manually in the database, ensure `customer_id` matches your logged-in user's ID







