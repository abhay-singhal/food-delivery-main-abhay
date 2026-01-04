# Quick Location Tracking Test

## 🚀 Fastest Way to Test Location Tracking

### Step 1: Get Required Information

1. **Order ID** - From customer app after placing order
2. **Delivery Boy Token** - From delivery boy login API response

### Step 2: Run Simple Test Script

```powershell
# Single location update
.\test-location-simple.ps1 -OrderId 123 -Token "YOUR_TOKEN"

# With custom coordinates
.\test-location-simple.ps1 -OrderId 123 -Token "YOUR_TOKEN" -Latitude 28.7041 -Longitude 77.1025
```

### Step 3: View in Customer App

- Open order tracking screen
- Location should appear within 10 seconds

---

## 🎬 Simulate Moving Delivery Boy

```powershell
# Run simulation script (5 minutes by default)
.\test-location-tracking.ps1 -OrderId 123 -Token "YOUR_TOKEN"

# Custom duration (2 minutes)
.\test-location-tracking.ps1 -OrderId 123 -Token "YOUR_TOKEN" -Duration 120
```

The script will:
- Start from one location
- Move to destination over specified duration
- Update location every 5 seconds
- Show progress in console

---

## 📍 Example: Delhi Coordinates

```powershell
# Connaught Place area
$lat = 28.7041
$lng = 77.1025

# Update location
.\test-location-simple.ps1 -OrderId 123 -Token "YOUR_TOKEN" -Latitude $lat -Longitude $lng
```

---

## 🔑 Getting the Token

**Option 1: From API Response**
- Login as delivery boy via API
- Copy token from response

**Option 2: From App**
- Use React Native debugger
- Check AsyncStorage: `accessToken`
- Or check API call in Network tab

---

**That's it! Run the script and check your customer app! 🎉**




