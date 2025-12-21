-- Direct SQL to register delivery boy 7023166771
-- Execute this in MySQL

USE food_delivery_db;

-- Insert User
INSERT INTO users (mobile_number, full_name, role, is_active, created_at, updated_at)
SELECT '7023166771', 'Delivery Boy', 'DELIVERY_BOY', true, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY'
);

-- Insert DeliveryBoyDetails
INSERT INTO delivery_boy_details (
    user_id, is_available, is_on_duty, total_deliveries, total_earnings, created_at, updated_at
)
SELECT 
    (SELECT id FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY'),
    true, false, 0, 0.00, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM delivery_boy_details 
    WHERE user_id = (SELECT id FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY')
);

-- Verify
SELECT 
    u.id as user_id, u.mobile_number, u.full_name, u.role, u.is_active,
    d.id as details_id, d.is_available, d.is_on_duty
FROM users u
LEFT JOIN delivery_boy_details d ON u.id = d.user_id
WHERE u.mobile_number = '7023166771' AND u.role = 'DELIVERY_BOY';

