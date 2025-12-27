-- SQL Query to Create an Order Visible to Delivery Guys
-- This order will appear in the delivery app's "Available Orders" screen

-- Step 1: Get a customer ID (use an existing customer or create one)
-- If you don't have a customer, uncomment and run this first:
/*
INSERT INTO users (mobile_number, role, is_active, created_at, updated_at)
VALUES ('9999999999', 'CUSTOMER', true, NOW(), NOW());
*/

-- Step 2: Create the order
-- Replace CUSTOMER_ID with an actual customer ID from your users table
-- Replace ORDER_NUMBER with a unique order number (format: ORD-YYYYMMDD-XXXXX)

INSERT INTO orders (
    order_number,
    customer_id,
    delivery_boy_id,  -- NULL = unassigned, visible to delivery guys
    status,          -- PLACED, ACCEPTED, PREPARING, or READY (READY is best for testing)
    subtotal,
    delivery_charge,
    total_amount,
    payment_method,  -- COD or RAZORPAY
    delivery_address,
    delivery_latitude,
    delivery_longitude,
    delivery_city,
    special_instructions,
    created_at,
    updated_at
) VALUES (
    CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0')),  -- Auto-generate unique order number
    (SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1),  -- Use first available customer
    NULL,  -- NULL = unassigned, will be visible to delivery guys
    'READY',  -- Status: PLACED, ACCEPTED, PREPARING, or READY (READY triggers notifications)
    250.00,  -- Subtotal
    25.00,   -- Delivery charge
    275.00,  -- Total amount
    'COD',   -- Payment method: COD or RAZORPAY
    '123 Main Street, Apartment 4B, Meerut, Uttar Pradesh',  -- Delivery address
    28.9845,  -- Delivery latitude (Meerut coordinates)
    77.7064,  -- Delivery longitude (Meerut coordinates)
    'Meerut',  -- Delivery city
    'Please call before delivery',  -- Special instructions (optional)
    NOW(),    -- Created at
    NOW()     -- Updated at
);

-- Step 3: Verify the order was created and is visible
SELECT 
    id,
    order_number,
    status,
    total_amount,
    delivery_address,
    delivery_boy_id,
    created_at
FROM orders
WHERE status IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY')
AND delivery_boy_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- QUICK COPY-PASTE VERSION (Single Query)
-- ============================================
-- Just replace CUSTOMER_ID with an actual customer ID:

INSERT INTO orders (
    order_number, customer_id, delivery_boy_id, status, subtotal, 
    delivery_charge, total_amount, payment_method, delivery_address,
    delivery_latitude, delivery_longitude, delivery_city, 
    special_instructions, created_at, updated_at
) VALUES (
    CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0')),
    (SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1),
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

-- ============================================
-- ALTERNATIVE: Update Existing Order to READY
-- ============================================
-- If you already have orders, just update one to READY status:

UPDATE orders 
SET status = 'READY',
    delivery_boy_id = NULL,
    updated_at = NOW()
WHERE id = YOUR_ORDER_ID
AND delivery_boy_id IS NULL;

-- ============================================
-- CHECK AVAILABLE ORDERS FOR DELIVERY GUYS
-- ============================================
-- This query shows what delivery guys will see:

SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_address,
    o.delivery_city,
    o.payment_method,
    o.created_at,
    u.mobile_number AS customer_mobile
FROM orders o
JOIN users u ON o.customer_id = u.id
WHERE o.status IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY')
AND o.delivery_boy_id IS NULL
ORDER BY o.created_at DESC;




