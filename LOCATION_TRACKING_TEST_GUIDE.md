# Location Tracking Feature - Testing Guide

This guide explains how to test the location tracking feature we just implemented.

## Prerequisites

1. **Backend is running** on `http://localhost:8080`
2. **MySQL database** is running with the food delivery database
3. **React Native app** dependencies are installed
4. **Android device/emulator** is connected

## Testing Setup

### 1. Start Backend Server

```bash
cd backend
mvn spring-boot:run
```

Verify backend is running:
- Check: http://localhost:8080/api/v1/public/menu
- Should return JSON menu data

### 2. Start Customer App

```bash
# Terminal 1 - Start Metro Bundler
cd ShivDhabaCustomer
npm start

# Terminal 2 - Run on Android
npx react-native run-android
```

### 3. Start Delivery App (for testing location updates)

```bash
# Terminal 3 - Start Metro Bundler (different port)
cd delivery-app
npm start -- --port=8082

# Terminal 4 - Run on Android
cd delivery-app
npx react-native run-android --port=8082
```

## Testing Scenarios

### Scenario 1: Customer Views Delivery Boy Location

**Steps:**

1. **Login as Customer** in the customer app
2. **Place an order** or navigate to an existing order with status `OUT_FOR_DELIVERY`
3. **Open Order Tracking Screen** (should show order details with map)
4. **Verify**:
   - Map shows delivery address marker
   - If delivery boy has updated location, their marker should appear
   - Location updates every 10 seconds (polling interval)

**Expected Behavior:**
- Order tracking screen loads successfully
- Map displays delivery location
- If delivery boy location is available, it shows on map
- Location updates automatically every 10 seconds

**API Endpoint Test:**
```bash
# Replace {orderId} with actual order ID and {token} with customer token
curl -X GET http://localhost:8080/api/v1/customer/orders/{orderId}/delivery-boy-location \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Delivery boy location retrieved successfully",
  "data": {
    "deliveryBoyId": 5,
    "deliveryBoyName": "John Doe",
    "deliveryBoyMobile": "9876543210",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": null,
    "isAvailable": true,
    "isOnDuty": true,
    "lastUpdatedAt": "2024-01-15T10:30:00",
    "currentOrderId": 123,
    "currentOrderNumber": "ORD-20240115-001"
  }
}
```

### Scenario 2: Delivery Boy Updates Location

**Steps:**

1. **Login as Delivery Boy** in the delivery app
2. **Accept an order** (order status should be READY or OUT_FOR_DELIVERY)
3. **Navigate to the order** and update location
4. **Update location** using the update-location endpoint

**API Endpoint Test:**
```bash
# Replace {orderId} with actual order ID and {token} with delivery boy token
curl -X POST http://localhost:8080/api/v1/delivery/orders/{orderId}/update-location \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": "Near Metro Station"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

**Verify:**
- Location is saved in database (check `delivery_boy_details` table)
- Customer app receives updated location (within 10 seconds due to polling)

### Scenario 3: Admin Views All Delivery Boys Locations

**Steps:**

1. **Login as Admin** (use admin credentials)
2. **Call the admin endpoint** to get all delivery boys locations

**API Endpoint Test:**
```bash
# Replace {token} with admin token
curl -X GET http://localhost:8080/api/v1/admin/delivery-boys/locations \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All delivery boys locations retrieved successfully",
  "data": [
    {
      "deliveryBoyId": 5,
      "deliveryBoyName": "John Doe",
      "deliveryBoyMobile": "9876543210",
      "latitude": 28.7041,
      "longitude": 77.1025,
      "isAvailable": true,
      "isOnDuty": true,
      "lastUpdatedAt": "2024-01-15T10:30:00",
      "currentOrderId": 123,
      "currentOrderNumber": "ORD-20240115-001"
    },
    {
      "deliveryBoyId": 6,
      "deliveryBoyName": "Jane Smith",
      "deliveryBoyMobile": "9876543211",
      "latitude": 28.7050,
      "longitude": 77.1030,
      "isAvailable": false,
      "isOnDuty": false,
      "lastUpdatedAt": "2024-01-15T09:00:00",
      "currentOrderId": null,
      "currentOrderNumber": null
    }
  ]
}
```

### Scenario 4: Admin Views Active Delivery Boys Only

**API Endpoint Test:**
```bash
# Replace {token} with admin token
curl -X GET http://localhost:8080/api/v1/admin/delivery-boys/locations/active \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
- Only returns delivery boys with `isAvailable: true` and `isOnDuty: true`

## Test Data Setup

### Create Test Order with Delivery Boy

1. **Create/Login as Customer**
2. **Place an order** through the app
3. **Login as Admin** and accept the order (or use delivery app to accept)
4. **Assign delivery boy** to the order
5. **Update order status** to `OUT_FOR_DELIVERY`

### Create Test Delivery Boy Location

```sql
-- Update delivery boy location in database
UPDATE delivery_boy_details
SET current_latitude = 28.7041,
    current_longitude = 77.1025,
    updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE role = 'DELIVERY_BOY' LIMIT 1);
```

## Manual Testing Checklist

### Customer App Testing

- [ ] Login as customer
- [ ] Place a test order
- [ ] Navigate to order tracking screen
- [ ] Verify map displays delivery location
- [ ] Verify delivery boy location appears (if assigned and location updated)
- [ ] Verify location updates automatically (check console logs)
- [ ] Test with order that has no delivery boy assigned (should show appropriate message)

### Delivery App Testing

- [ ] Login as delivery boy
- [ ] Accept an order
- [ ] Update location using the app
- [ ] Verify location is saved in database
- [ ] Verify customer app receives location update

### Admin Testing

- [ ] Login as admin
- [ ] Call `/api/v1/admin/delivery-boys/locations` endpoint
- [ ] Verify all delivery boys are returned
- [ ] Call `/api/v1/admin/delivery-boys/locations/active` endpoint
- [ ] Verify only active delivery boys are returned

## Error Scenarios to Test

1. **Customer tries to view location of order that doesn't belong to them**
   - Should return 403 Forbidden

2. **Delivery boy tries to update location for order not assigned to them**
   - Should return 400 Bad Request

3. **Customer views order with no delivery boy assigned**
   - Should return success with null data

4. **Invalid order ID**
   - Should return 404 Not Found

5. **Unauthenticated request**
   - Should return 401 Unauthorized

## Performance Testing

1. **Polling Interval**: Verify location updates every 10 seconds
2. **Multiple Customers**: Test with multiple customers viewing same delivery boy
3. **Rapid Updates**: Test delivery boy updating location rapidly
4. **Network Issues**: Test behavior when network is slow or disconnected

## Database Verification

Check these tables after location updates:

```sql
-- Check delivery boy current location
SELECT u.full_name, dbd.current_latitude, dbd.current_longitude, dbd.updated_at
FROM delivery_boy_details dbd
JOIN users u ON dbd.user_id = u.id;

-- Check location tracking history
SELECT dt.id, o.order_number, dt.latitude, dt.longitude, dt.created_at
FROM delivery_tracking dt
JOIN orders o ON dt.order_id = o.id
ORDER BY dt.created_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Location not updating in customer app

**Possible causes:**
1. Backend not running
2. Incorrect API endpoint URL
3. Authentication token expired
4. Order doesn't have delivery boy assigned
5. Delivery boy hasn't updated location yet

**Solutions:**
1. Verify backend is running: `curl http://localhost:8080/api/v1/public/menu`
2. Check API configuration in `src/config/api.js`
3. Re-login to get fresh token
4. Verify order has delivery boy in database
5. Update location via delivery app first

### Issue: 403 Forbidden when accessing location

**Cause:** Customer trying to access order that doesn't belong to them

**Solution:** Ensure order belongs to the logged-in customer

### Issue: Empty location data

**Possible causes:**
1. Delivery boy hasn't updated location
2. Delivery boy details not found in database

**Solutions:**
1. Update location via delivery app
2. Check `delivery_boy_details` table has entry for the delivery boy

## Next Steps for Enhanced Testing

1. **Integration Tests**: Create automated tests for API endpoints
2. **E2E Tests**: Create end-to-end tests using Detox or Appium
3. **Load Testing**: Test with multiple concurrent location updates
4. **Real-time Testing**: Implement WebSocket for real-time updates (instead of polling)




