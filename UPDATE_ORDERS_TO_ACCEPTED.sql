-- SQL Query to Mark First 3 Orders as ACCEPTED
-- This updates the first 3 unassigned orders (by ID or creation date) to ACCEPTED status

-- Option 1: Update first 3 orders by ID (oldest first)
UPDATE orders 
SET status = 'ACCEPTED',
    accepted_at = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT id 
        FROM orders 
        WHERE status = 'PLACED' 
        AND delivery_boy_id IS NULL
        ORDER BY id ASC
        LIMIT 3
    ) AS subquery
);

-- Option 2: Update first 3 orders by creation date (oldest first)
UPDATE orders 
SET status = 'ACCEPTED',
    accepted_at = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT id 
        FROM orders 
        WHERE status = 'PLACED' 
        AND delivery_boy_id IS NULL
        ORDER BY created_at ASC
        LIMIT 3
    ) AS subquery
);

-- Option 3: Update first 3 orders regardless of current status (if you want to update any status)
UPDATE orders 
SET status = 'ACCEPTED',
    accepted_at = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT id 
        FROM orders 
        WHERE delivery_boy_id IS NULL
        AND status NOT IN ('DELIVERED', 'CANCELLED')
        ORDER BY created_at ASC
        LIMIT 3
    ) AS subquery
);

-- To verify before updating, run this SELECT query first:
SELECT id, order_number, status, delivery_boy_id, created_at
FROM orders 
WHERE status = 'PLACED' 
AND delivery_boy_id IS NULL
ORDER BY created_at ASC
LIMIT 3;







