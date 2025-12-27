-- Register Delivery Boy with mobile number 7023166771
-- Run this SQL script in your MySQL database

USE food_delivery_db;

-- Step 1: Check if user already exists
SELECT * FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY';

-- Step 2: Create User (if doesn't exist)
INSERT INTO users (
    mobile_number, 
    full_name, 
    role, 
    is_active, 
    created_at, 
    updated_at
) 
SELECT 
    '7023166771',
    'Delivery Boy',
    'DELIVERY_BOY',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY'
);

-- Step 3: Get the user ID
SET @user_id = (SELECT id FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY');

-- Step 4: Create DeliveryBoyDetails (if doesn't exist)
INSERT INTO delivery_boy_details (
    user_id,
    license_number,
    vehicle_number,
    vehicle_type,
    is_available,
    is_on_duty,
    total_deliveries,
    total_earnings,
    created_at,
    updated_at
)
SELECT 
    @user_id,
    NULL,
    NULL,
    NULL,
    true,
    false,
    0,
    0.00,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM delivery_boy_details WHERE user_id = @user_id
);

-- Step 5: Verify registration
SELECT 
    u.id as user_id,
    u.mobile_number,
    u.full_name,
    u.role,
    u.is_active,
    d.id as details_id,
    d.is_available,
    d.is_on_duty
FROM users u
LEFT JOIN delivery_boy_details d ON u.id = d.user_id
WHERE u.mobile_number = '7023166771' AND u.role = 'DELIVERY_BOY';



