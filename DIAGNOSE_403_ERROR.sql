-- SQL Queries to Diagnose 403 Error for Order Access

-- ============================================
-- 1. Check Order Details and Customer
-- ============================================
-- Replace 15 with your order ID
SELECT 
    o.id AS order_id,
    o.order_number,
    o.customer_id AS order_customer_id,
    o.delivery_boy_id,
    o.status,
    u_customer.id AS customer_user_id,
    u_customer.mobile_number AS customer_mobile,
    u_customer.role AS customer_role,
    o.created_at
FROM orders o
LEFT JOIN users u_customer ON o.customer_id = u_customer.id
WHERE o.id = 15;

-- ============================================
-- 2. Check All Customers (to find correct customer_id)
-- ============================================
SELECT 
    id,
    mobile_number,
    role,
    full_name,
    is_active,
    created_at
FROM users
WHERE role = 'CUSTOMER'
ORDER BY created_at DESC;

-- ============================================
-- 3. Fix: Update Order to Match Your Customer ID
-- ============================================
-- Replace YOUR_CUSTOMER_ID with the actual customer ID you're logged in as
-- Replace 15 with your order ID

UPDATE orders 
SET customer_id = YOUR_CUSTOMER_ID
WHERE id = 15;

-- ============================================
-- 4. Quick Fix: Assign Order to First Available Customer
-- ============================================
UPDATE orders 
SET customer_id = (SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1)
WHERE id = 15;

-- ============================================
-- 5. Verify the Fix
-- ============================================
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    u.mobile_number AS customer_mobile,
    u.role AS customer_role
FROM orders o
JOIN users u ON o.customer_id = u.id
WHERE o.id = 15;


