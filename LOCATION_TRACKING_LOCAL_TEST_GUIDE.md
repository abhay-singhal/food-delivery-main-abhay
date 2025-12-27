# Location Tracking - Local Testing Guide

This guide explains how to test location tracking locally by simulating a delivery boy moving from one location to another.

## 🎯 Quick Test Setup

### Step 1: Prepare Test Data

1. **Create a Test Order**
   - Login as a customer in the app
   - Place a test order
   - Note the Order ID

2. **Assign Delivery Boy**
   - Login as delivery boy in delivery app
   - Accept the order
   - Note the delivery boy authentication token

### Step 2: Get Authentication Token

**For Delivery Boy:**
```powershell
# After logging in as delivery boy, the token is stored in AsyncStorage
# Or use the API response from login endpoint
# Token format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**To get token from app:**
- Use React Native debugger
- Or check AsyncStorage in the app
- Or use login API response

### Step 3: Run Location Simulation Script

I've created a PowerShell script that simulates a delivery boy moving:

```powershell
.\test-location-tracking.ps1 -OrderId <ORDER_ID> -Token <DELIVERY_BOY_TOKEN>
```

**Example:**
```powershell
.\test-location-tracking.ps1 -OrderId 123 -Token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -Duration 300
```

**Parameters:**
- `-OrderId` (required): The order ID to update location for
- `-Token` (required): Delivery boy authentication token (Bearer token)
- `-Duration` (optional): Simulation duration in seconds (default: 300 = 5 minutes)
- `-BaseUrl` (optional): API base URL (default: http://localhost:8080/api/v1)

### Step 4: View in Customer App

1. **Open Customer App**
2. **Navigate to Order Tracking Screen** for the test order
3. **Watch the map** - you should see:
   - Delivery boy marker moving
   - Location updates every 5 seconds
   - Route line from current position to delivery address

---

## 🔧 Manual Testing with cURL

You can also manually update location using cURL or PowerShell:

### Single Location Update

```powershell
$orderId = "123"
$token = "YOUR_DELIVERY_BOY_TOKEN"
$lat = 28.7041
$lng = 77.1025

$body = @{
    latitude = $lat
    longitude = $lng
    address = "Test location"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/delivery/orders/$orderId/update-location" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

### Multiple Updates (Moving)

```powershell
$orderId = "123"
$token = "YOUR_DELIVERY_BOY_TOKEN"

# Start location
$startLat = 28.7041
$startLng = 77.1025

# End location
$endLat = 28.7100
$endLng = 77.1100

# Number of updates
$steps = 10

for ($i = 0; $i -le $steps; $i++) {
    $lat = $startLat + (($endLat - $startLat) / $steps * $i)
    $lng = $startLng + (($endLng - $startLng) / $steps * $i)
    
    $body = @{
        latitude = [math]::Round($lat, 6)
        longitude = [math]::Round($lng, 6)
        address = "Moving to destination... Step $($i + 1)"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/delivery/orders/$orderId/update-location" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "Updated location: ($lat, $lng)"
    Start-Sleep -Seconds 5
}
```

---

## 📍 Using Real Coordinates

### Find Coordinates for Your Area

1. **Use Google Maps:**
   - Right-click on a location
   - Click on the coordinates to copy them
   - Format: `latitude, longitude`

2. **Use Online Tools:**
   - https://www.latlong.net/
   - https://www.gps-coordinates.net/

### Example Coordinates (Delhi, India)

```powershell
# Restaurant location (start)
$startLat = 28.7041  # Connaught Place area
$startLng = 77.1025

# Customer location (end)
$endLat = 28.6139    # Different area
$endLng = 77.2090

# Edit the script to use these coordinates
```

---

## 🧪 Testing Scenarios

### Scenario 1: Short Distance Movement

```powershell
# Update script coordinates:
$startLat = 28.7041
$startLng = 77.1025
$endLat = 28.7050    # 100m away
$endLng = 77.1030
$Duration = 60       # 1 minute
```

### Scenario 2: Long Distance Movement

```powershell
$startLat = 28.7041
$startLng = 77.1025
$endLat = 28.6139    # 10km away
$endLng = 77.2090
$Duration = 600      # 10 minutes
```

### Scenario 3: Random Movement (Advanced)

For more realistic testing, you can modify the script to add random variations:

```powershell
# Add random variations
$randomLat = (Get-Random -Minimum -0.001 -Maximum 0.001)
$randomLng = (Get-Random -Minimum -0.001 -Maximum 0.001)
$currentLat = $startLat + ($latStep * $i) + $randomLat
$currentLng = $startLng + ($lngStep * $i) + $randomLng
```

---

## 🔍 Verify Location Updates

### Check Database

```sql
-- Check delivery boy current location
SELECT u.full_name, dbd.current_latitude, dbd.current_longitude, dbd.updated_at
FROM delivery_boy_details dbd
JOIN users u ON dbd.user_id = u.id;

-- Check location tracking history
SELECT dt.id, o.order_number, dt.latitude, dt.longitude, dt.created_at
FROM delivery_tracking dt
JOIN orders o ON dt.order_id = o.id
WHERE o.id = <ORDER_ID>
ORDER BY dt.created_at DESC;
```

### Check API Response

```powershell
# Get delivery boy location (as customer)
$orderId = "123"
$customerToken = "YOUR_CUSTOMER_TOKEN"

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/customer/orders/$orderId/delivery-boy-location" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $customerToken"
    }
```

---

## 📱 Testing with Real Device Location (Alternative)

If you want to test with real device GPS:

1. **Use Delivery App:**
   - Login as delivery boy
   - Accept an order
   - Enable location tracking in the app
   - The app will send real GPS coordinates

2. **Use Browser Developer Tools (for web testing):**
   - Open browser console
   - Use Geolocation API to get current location
   - Update via API

---

## 🐛 Troubleshooting

### Issue: "403 Forbidden" or "Order not assigned to you"

**Solution:** 
- Ensure the order is assigned to the delivery boy whose token you're using
- Verify the order ID is correct
- Check the delivery boy ID matches the order assignment

### Issue: Location not updating in customer app

**Possible causes:**
1. Customer app polling interval hasn't elapsed (10 seconds)
2. Order doesn't have delivery boy assigned
3. API endpoint returning error

**Solution:**
- Wait 10-15 seconds after updating location
- Check API response is successful
- Verify order has delivery boy assigned
- Check customer app console logs

### Issue: Script fails with authentication error

**Solution:**
- Verify the token is valid (not expired)
- Check token format: Should start with "eyJ..."
- Re-login as delivery boy to get fresh token
- Ensure token includes "Bearer " prefix in Authorization header

### Issue: Coordinates not showing on map

**Solution:**
- Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- Check map is properly configured with Google Maps API key
- Ensure location permissions are granted in the app
- Verify map region includes the coordinates

---

## ✅ Quick Test Checklist

- [ ] Backend is running on port 8080
- [ ] Test order created and assigned to delivery boy
- [ ] Delivery boy authentication token obtained
- [ ] Script coordinates updated for your test area
- [ ] Customer app open on order tracking screen
- [ ] Script running and sending location updates
- [ ] Map in customer app showing movement

---

## 🎬 Example Full Test Flow

1. **Start Backend:**
   ```powershell
   cd backend
   mvn spring-boot:run
   ```

2. **Create Test Order (Customer App):**
   - Login as customer
   - Place order
   - Note Order ID: 123

3. **Accept Order (Delivery App):**
   - Login as delivery boy
   - Accept order 123
   - Get token from login response

4. **Run Simulation:**
   ```powershell
   .\test-location-tracking.ps1 -OrderId 123 -Token "eyJ..." -Duration 300
   ```

5. **View in Customer App:**
   - Open order tracking for order 123
   - Watch delivery boy marker move on map

---

**Happy Testing! 🚀**

