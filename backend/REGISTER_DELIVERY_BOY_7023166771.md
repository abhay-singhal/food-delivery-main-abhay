# Register Delivery Boy - Mobile: 7023166771

## Quick Registration Methods

### Method 1: Using Public API Endpoint (Easiest)

**Endpoint:** `POST /api/v1/auth/delivery-boy/register`

**Request:**
```bash
curl -X POST "http://localhost:8080/api/v1/auth/delivery-boy/register" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "7023166771",
    "fullName": "Delivery Boy"
  }'
```

**Or using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/delivery-boy/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"mobileNumber":"7023166771","fullName":"Delivery Boy"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery boy registered successfully",
  "data": {
    "id": 1,
    "userId": 5,
    "mobileNumber": "7023166771",
    "fullName": "Delivery Boy"
  }
}
```

### Method 2: Using SQL Script (Direct Database)

Run the SQL script:
```bash
mysql -u admin -p food_delivery_db < backend/register-delivery-boy-7023166771.sql
```

Or execute in MySQL:
```sql
USE food_delivery_db;

-- Create User
INSERT INTO users (mobile_number, full_name, role, is_active, created_at, updated_at)
SELECT '7023166771', 'Delivery Boy', 'DELIVERY_BOY', true, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY'
);

-- Get user ID and create DeliveryBoyDetails
SET @user_id = (SELECT id FROM users WHERE mobile_number = '7023166771' AND role = 'DELIVERY_BOY');

INSERT INTO delivery_boy_details (
    user_id, is_available, is_on_duty, total_deliveries, total_earnings,
    created_at, updated_at
)
SELECT @user_id, true, false, 0, 0.00, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM delivery_boy_details WHERE user_id = @user_id
);
```

### Method 3: Using Admin Endpoint (If you have admin access)

**First, login as admin:**
```bash
POST /api/v1/auth/admin/login
{
  "username": "<admin_mobile>",
  "password": "<admin_password>"
}
```

**Then register delivery boy:**
```bash
POST /api/v1/admin/delivery-boys
Authorization: Bearer <ADMIN_TOKEN>
{
  "mobileNumber": "7023166771",
  "fullName": "Delivery Boy"
}
```

## After Registration

1. ✅ Delivery boy can now login using mobile number: **7023166771**
2. ✅ Send OTP: `POST /api/v1/auth/otp/send` with `{"mobileNumber": "7023166771"}`
3. ✅ Check backend console for OTP (e.g., "OTP for 7023166771: 123456")
4. ✅ Verify OTP: `POST /api/v1/auth/otp/verify/delivery` with OTP
5. ✅ Login successful!

## Verify Registration

Check if registration was successful:
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
WHERE u.mobile_number = '7023166771' AND u.role = 'DELIVERY_BOY';
```

## Notes

- ✅ Public registration endpoint is available at `/api/v1/auth/delivery-boy/register`
- ✅ No admin token required
- ✅ Creates both User and DeliveryBoyDetails automatically
- ✅ Account is active and ready to use immediately






