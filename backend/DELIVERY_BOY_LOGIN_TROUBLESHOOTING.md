# Delivery Boy Login Troubleshooting Guide

## Common Errors and Solutions

### Error 1: "Delivery boy account incomplete. Please contact admin to complete registration."

**Cause:** The User exists in the database, but `DeliveryBoyDetails` is missing. This happens when:
- User was created manually without creating DeliveryBoyDetails
- DeliveryBoyDetails was deleted
- Incomplete registration process

**Solution:** Register the delivery boy properly using the admin endpoint:

```bash
POST /api/v1/admin/delivery-boys
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "fullName": "John Doe",
  "licenseNumber": "DL123456",
  "vehicleNumber": "UP15AB1234",
  "vehicleType": "Bike"
}
```

**Or fix via SQL:**
```sql
-- Check if User exists
SELECT * FROM users WHERE mobile_number = '9876543210' AND role = 'DELIVERY_BOY';

-- Check if DeliveryBoyDetails exists
SELECT * FROM delivery_boy_details WHERE user_id = <user_id>;

-- If DeliveryBoyDetails is missing, create it:
INSERT INTO delivery_boy_details (
    user_id, license_number, vehicle_number, vehicle_type,
    is_available, is_on_duty, total_deliveries, total_earnings,
    created_at, updated_at
) VALUES (
    <user_id>,
    'DL123456',
    'UP15AB1234',
    'Bike',
    true,
    false,
    0,
    0.00,
    NOW(),
    NOW()
);
```

### Error 2: "Invalid or expired OTP"

**Causes:**
1. OTP expired (default: 10 minutes)
2. OTP was already used (OTP is deleted after verification)
3. Wrong OTP entered
4. OTP was never sent or stored correctly

**Solutions:**

1. **Request a new OTP:**
   ```bash
   POST /api/v1/auth/otp/send
   {
     "mobileNumber": "9876543210"
   }
   ```

2. **Check OTP in console:** The backend logs the OTP when sent:
   ```
   OTP for 9876543210: 123456
   ```

3. **Verify OTP is stored:**
   - If using Redis: `redis-cli GET "otp:9876543210"`
   - If using InMemory: Check backend logs

4. **Common issues:**
   - OTP expires after 10 minutes (configurable in `application.properties`)
   - Each OTP can only be used once
   - Make sure you're using the correct mobile number

### Error 3: "Delivery boy not registered. Please contact admin to register your account."

**Cause:** No User exists with the mobile number and role DELIVERY_BOY.

**Solution:** Admin must register the delivery boy first:

```bash
POST /api/v1/admin/delivery-boys
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "fullName": "John Doe"
}
```

## Complete Registration Flow

### Step 1: Admin Registers Delivery Boy

```bash
POST /api/v1/admin/delivery-boys
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "fullName": "John Doe",
  "licenseNumber": "DL123456",
  "vehicleNumber": "UP15AB1234",
  "vehicleType": "Bike"
}
```

**This creates:**
- ✅ User with role DELIVERY_BOY
- ✅ DeliveryBoyDetails record
- ✅ Account is active

### Step 2: Delivery Boy Requests OTP

```bash
POST /api/v1/auth/otp/send
{
  "mobileNumber": "9876543210"
}
```

**Response:**
- OTP is generated and stored
- OTP is logged in backend console
- OTP expires in 10 minutes (default)

### Step 3: Delivery Boy Verifies OTP

```bash
POST /api/v1/auth/otp/verify/delivery
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

**System checks:**
- ✅ OTP is valid and not expired
- ✅ User exists with role DELIVERY_BOY
- ✅ DeliveryBoyDetails exists
- ✅ User account is active

**If all checks pass:**
- ✅ Tokens generated (expire at midnight for delivery boys)
- ✅ Login successful

## Quick Fix Checklist

If delivery boy can't login:

- [ ] **Check if User exists:**
  ```sql
  SELECT * FROM users WHERE mobile_number = '<mobile>' AND role = 'DELIVERY_BOY';
  ```

- [ ] **Check if DeliveryBoyDetails exists:**
  ```sql
  SELECT d.* FROM delivery_boy_details d
  JOIN users u ON d.user_id = u.id
  WHERE u.mobile_number = '<mobile>';
  ```

- [ ] **Check if account is active:**
  ```sql
  SELECT is_active FROM users WHERE mobile_number = '<mobile>';
  ```

- [ ] **Request new OTP** (if OTP expired)

- [ ] **Check backend logs** for OTP value

- [ ] **Verify OTP storage** (Redis or InMemory)

## Database Queries for Troubleshooting

### Check Delivery Boy Registration Status:
```sql
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
WHERE u.mobile_number = '9876543210' AND u.role = 'DELIVERY_BOY';
```

### Fix Incomplete Registration:
```sql
-- If User exists but DeliveryBoyDetails doesn't:
INSERT INTO delivery_boy_details (
    user_id, is_available, is_on_duty, total_deliveries, total_earnings,
    created_at, updated_at
)
SELECT 
    id, true, false, 0, 0.00, NOW(), NOW()
FROM users
WHERE mobile_number = '9876543210' AND role = 'DELIVERY_BOY'
AND NOT EXISTS (
    SELECT 1 FROM delivery_boy_details WHERE user_id = users.id
);
```

## Testing the Flow

1. **Register delivery boy (as admin):**
   ```bash
   curl -X POST "http://localhost:8080/api/v1/admin/delivery-boys" \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9876543210","fullName":"Test Driver"}'
   ```

2. **Send OTP:**
   ```bash
   curl -X POST "http://localhost:8080/api/v1/auth/otp/send" \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9876543210"}'
   ```

3. **Check backend console for OTP** (e.g., "OTP for 9876543210: 123456")

4. **Verify OTP:**
   ```bash
   curl -X POST "http://localhost:8080/api/v1/auth/otp/verify/delivery" \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9876543210","otp":"123456"}'
   ```

## Notes

- ✅ Delivery boys **cannot** self-register
- ✅ Must be registered by admin first
- ✅ OTP expires in 10 minutes (configurable)
- ✅ Tokens expire at midnight for delivery boys
- ✅ OTP can only be used once

