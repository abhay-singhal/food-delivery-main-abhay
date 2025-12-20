# How to Register a Delivery Boy

## Admin Endpoint (Already Exists)

### POST `/api/v1/admin/delivery-boys`
**Access:** Admin only (requires ADMIN role token)

### Request Body (JSON):
```json
{
  "mobileNumber": "9876543210",
  "fullName": "John Doe",
  "licenseNumber": "DL1234567890",
  "vehicleNumber": "UP15AB1234",
  "vehicleType": "Bike"
}
```

### Required Fields:
- `mobileNumber` (10 digits)
- `fullName`

### Optional Fields:
- `licenseNumber`
- `vehicleNumber`
- `vehicleType`

### Example cURL:
```bash
curl -X POST "http://localhost:8080/api/v1/admin/delivery-boys" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210",
    "fullName": "John Doe",
    "licenseNumber": "DL123456",
    "vehicleNumber": "UP15AB1234",
    "vehicleType": "Bike"
  }'
```

### Response:
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

## After Registration

1. **Delivery boy can now login** using their mobile number
2. **OTP will be sent** to the registered mobile number
3. **Login will succeed** because:
   - User exists with role DELIVERY_BOY
   - DeliveryBoyDetails exists
   - Account is active

## Security

- ✅ Only admins can register delivery boys
- ✅ Delivery boys cannot self-register
- ✅ Login will fail if not pre-registered
- ✅ Login will fail if DeliveryBoyDetails is missing

