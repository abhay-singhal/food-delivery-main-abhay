# Quick Test Instructions - Location Tracking Feature

## 🚀 Quick Start to Test Location Tracking

### Step 1: Verify Backend is Running

Check if backend is running on port 8080:
```powershell
netstat -an | findstr :8080
```

If not running, start it:
```powershell
cd backend
mvn spring-boot:run
```

Wait for: `Started ShivDhabaFoodDeliveryApplication`

### Step 2: Start Customer App

**Terminal 1 - Metro Bundler:**
```powershell
cd ShivDhabaCustomer
npm start
```

**Terminal 2 - Run on Android:**
```powershell
cd ShivDhabaCustomer
npx react-native run-android
```

### Step 3: Test Location Tracking

1. **Login as Customer** in the app
2. **Place an order** or navigate to an existing order
3. **Open Order Tracking Screen**
4. **Verify:**
   - Map shows delivery address
   - If delivery boy has updated location, their marker appears
   - Location updates every 10 seconds (check console logs)

### Step 4: Test Delivery Boy Location Update (Optional)

**Terminal 3 - Metro Bundler for Delivery App:**
```powershell
cd delivery-app
npm start -- --port=8082
```

**Terminal 4 - Run Delivery App:**
```powershell
cd delivery-app
npx react-native run-android --port=8082
```

1. **Login as Delivery Boy**
2. **Accept an order**
3. **Update location** (if location update screen exists)

### Step 5: Test API Endpoints Directly

**Test Customer Endpoint:**
```powershell
# Replace {orderId} and {token} with actual values
$token = "YOUR_CUSTOMER_TOKEN"
$orderId = "123"
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/customer/orders/$orderId/delivery-boy-location" -Headers @{"Authorization"="Bearer $token"}
```

**Test Admin Endpoint:**
```powershell
# Replace {token} with admin token
$token = "YOUR_ADMIN_TOKEN"
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/delivery-boys/locations" -Headers @{"Authorization"="Bearer $token"}
```

**Test Delivery Boy Update Location:**
```powershell
# Replace {orderId} and {token} with actual values
$token = "YOUR_DELIVERY_BOY_TOKEN"
$orderId = "123"
$body = @{
    latitude = 28.7041
    longitude = 77.1025
    address = "Test Location"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/delivery/orders/$orderId/update-location" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $body
```

## 📋 Testing Checklist

- [ ] Backend is running
- [ ] Customer app starts successfully
- [ ] Can login as customer
- [ ] Can view orders
- [ ] Order tracking screen loads
- [ ] Map displays delivery location
- [ ] Location polling works (check console logs)
- [ ] API endpoints return correct data

## 🔍 Verification Points

### Console Logs to Check

In Metro bundler console, you should see:
- `API Request: GET /customer/orders/{orderId}/delivery-boy-location`
- `API Response: 200 /customer/orders/{orderId}/delivery-boy-location`

In React Native debugger/logs:
- `Order data received:` - Order details
- `Error polling delivery boy location:` - Any errors (can be normal if no location yet)

### Database Verification

```sql
-- Check delivery boy current location
SELECT u.full_name, dbd.current_latitude, dbd.current_longitude, dbd.updated_at
FROM delivery_boy_details dbd
JOIN users u ON dbd.user_id = u.id;

-- Check recent location updates
SELECT o.order_number, dt.latitude, dt.longitude, dt.created_at
FROM delivery_tracking dt
JOIN orders o ON dt.order_id = o.id
ORDER BY dt.created_at DESC
LIMIT 5;
```

## ⚠️ Common Issues

### Issue: "Network Error" or "Cannot connect to server"

**Solutions:**
1. Verify backend is running: `netstat -an | findstr :8080`
2. Check API URL in `ShivDhabaCustomer/src/config/api.js`
3. Update IP address if using physical device
4. Check firewall settings

### Issue: "403 Forbidden" when accessing location

**Cause:** Order doesn't belong to the customer

**Solution:** Use an order that belongs to the logged-in customer

### Issue: Location not updating

**Possible causes:**
1. Delivery boy hasn't updated location yet
2. Order doesn't have delivery boy assigned
3. Polling interval hasn't elapsed (10 seconds)

**Solutions:**
1. Update location via delivery app first
2. Check order has delivery boy assigned
3. Wait 10 seconds for next poll

## 📚 More Information

For detailed testing scenarios, see:
- `LOCATION_TRACKING_TEST_GUIDE.md` - Comprehensive testing guide
- `LOCATION_TRACKING_BACKEND_IMPLEMENTATION.md` - Implementation details
- `LOCATION_TRACKING_IMPLEMENTATION_SUMMARY.md` - Feature summary




