# Delivery Boy Registration Guide

## Overview
Delivery boys must be registered by an admin before they can login. They cannot self-register through the app.

## Admin Registration Endpoint

### POST `/api/v1/admin/delivery-boys`
**Access:** Admin only  
**Description:** Register a new delivery boy

#### Request Parameters:
- `mobileNumber` (required): Mobile number of the delivery boy
- `fullName` (required): Full name of the delivery boy
- `licenseNumber` (optional): Driving license number
- `vehicleNumber` (optional): Vehicle registration number
- `vehicleType` (optional): Type of vehicle (e.g., "Bike", "Car")

#### Example Request:
```bash
POST /api/v1/admin/delivery-boys
Content-Type: application/x-www-form-urlencoded

mobileNumber=9876543210&fullName=John Doe&licenseNumber=DL123456&vehicleNumber=UP15AB1234&vehicleType=Bike
```

#### Example Response:
```json
{
  "success": true,
  "message": "Delivery boy created successfully",
  "data": {
    "id": 1,
    "userId": 5,
    "mobileNumber": "9876543210",
    "fullName": "John Doe"
  }
}
```

## Delivery Boy Login Flow

1. **Admin registers delivery boy** using the endpoint above
2. **Delivery boy opens app** and enters mobile number
3. **OTP is sent** to the registered mobile number
4. **Delivery boy enters OTP** to login
5. **System verifies:**
   - OTP is valid
   - User exists with role DELIVERY_BOY
   - DeliveryBoyDetails exists (created by admin)
   - User account is active
6. **If all checks pass:** Login successful, tokens generated (expire at midnight)

## Security Features

### ✅ Pre-Registration Required
- Delivery boys **cannot** self-register
- Must be registered by admin first
- Login will fail with error: "Delivery boy not registered. Please contact admin to register your account."

### ✅ Complete Registration Check
- System verifies both `User` and `DeliveryBoyDetails` exist
- Login will fail if `DeliveryBoyDetails` is missing: "Delivery boy account incomplete. Please contact admin to complete registration."

### ✅ Account Status Check
- Only active accounts can login
- Inactive accounts will be rejected

## API Endpoints Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/v1/admin/delivery-boys` | GET | Admin | List all delivery boys |
| `/api/v1/admin/delivery-boys` | POST | Admin | Register new delivery boy |
| `/api/v1/auth/otp/send` | POST | Public | Send OTP to mobile number |
| `/api/v1/auth/otp/verify/delivery` | POST | Public | Verify OTP and login (delivery boy) |

## Example: Register a Delivery Boy

### Using cURL:
```bash
curl -X POST "http://localhost:8080/api/v1/admin/delivery-boys" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "mobileNumber=9876543210&fullName=John Doe&licenseNumber=DL123456&vehicleNumber=UP15AB1234&vehicleType=Bike"
```

### Using SQL (Direct Database):
```sql
-- Step 1: Create User
INSERT INTO users (mobile_number, full_name, role, is_active, created_at, updated_at)
VALUES ('9876543210', 'John Doe', 'DELIVERY_BOY', true, NOW(), NOW());

-- Step 2: Get the user ID
SET @user_id = LAST_INSERT_ID();

-- Step 3: Create DeliveryBoyDetails
INSERT INTO delivery_boy_details (
    user_id, license_number, vehicle_number, vehicle_type,
    is_available, is_on_duty, total_deliveries, total_earnings,
    created_at, updated_at
) VALUES (
    @user_id,
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

## Testing

### 1. Register Delivery Boy (as Admin)
```bash
POST /api/v1/admin/delivery-boys
mobileNumber=9876543210&fullName=Test Driver
```

### 2. Try to Login (as Delivery Boy)
```bash
# Step 1: Send OTP
POST /api/v1/auth/otp/send
{
  "mobileNumber": "9876543210"
}

# Step 2: Verify OTP
POST /api/v1/auth/otp/verify/delivery
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

### 3. Test Unregistered Login (Should Fail)
```bash
# Try to login with unregistered mobile number
POST /api/v1/auth/otp/verify/delivery
{
  "mobileNumber": "9999999999",
  "otp": "123456"
}

# Expected Error:
# "Delivery boy not registered. Please contact admin to register your account."
```

## Notes

- **Customers** can still self-register (auto-created on first login)
- **Delivery boys** must be pre-registered by admin
- Admin can view all delivery boys: `GET /api/v1/admin/delivery-boys`
- Delivery boy details (license, vehicle) are optional but recommended







