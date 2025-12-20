# Backend Connection Fix Guide

## ✅ What I Fixed

1. **Updated IP Address**: Changed from `192.168.29.104` to `192.168.1.19` (your current IP)
2. **Created Smart API Config**: Easy switching between emulator and physical device
3. **Added Better Logging**: Shows which config is being used

## 🔧 Current Configuration

- **API Base URL**: `http://192.168.1.19:8080/api/v1`
- **Your Current IP**: `192.168.1.19` (found via ipconfig)

## ⚠️ Backend Not Reachable

The backend server is **not currently running** or **not accessible**. Follow these steps:

### Step 1: Start Backend Server

```bash
cd backend
mvn spring-boot:run
```

Or use the startup script:
```bash
cd backend
.\start-backend.ps1
```

**Wait for this message:**
```
Started ShivDhabaFoodDeliveryApplication in X.XXX seconds
```

### Step 2: Verify Backend is Running

Test in browser or PowerShell:
```powershell
# Test menu endpoint
Invoke-WebRequest -Uri 'http://192.168.1.19:8080/api/v1/public/menu' -Method GET

# Test OTP endpoint
Invoke-WebRequest -Uri 'http://192.168.1.19:8080/api/v1/auth/otp/send' -Method POST -Headers @{ 'Content-Type'='application/json' } -Body '{"mobileNumber":"9999999999"}'
```

### Step 3: Check Windows Firewall

If backend is running but not accessible:

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Select **TCP**, enter port **8080** → **Next**
6. Select **Allow the connection** → **Next**
7. Check all profiles → **Next**
8. Name it "Backend Port 8080" → **Finish**

Or temporarily disable firewall to test.

### Step 4: Verify Network

**For Physical Device:**
- Phone and computer must be on **same WiFi network**
- Test in phone browser: `http://192.168.1.19:8080/api/v1/public/menu`
- If it doesn't load, there's a network/firewall issue

**For Android Emulator:**
- Change config in `api.js`:
  ```javascript
  const CURRENT_CONFIG = 'EMULATOR';
  ```
- This uses `http://10.0.2.2:8080/api/v1`

### Step 5: Restart App

After starting backend:

1. **Restart Metro Bundler:**
   ```bash
   cd ShivDhabaCustomer
   npx react-native start --reset-cache
   ```

2. **Rebuild App:**
   ```bash
   npx react-native run-android
   ```

## 📱 Switching Between Configurations

In `ShivDhabaCustomer/src/config/api.js`:

```javascript
// For Android Emulator
const CURRENT_CONFIG = 'EMULATOR';

// For Physical Device
const CURRENT_CONFIG = 'PHYSICAL_DEVICE';

// For iOS Simulator
const CURRENT_CONFIG = 'LOCALHOST';
```

## 🔍 Troubleshooting

### Error: "Network Error"
- ✅ Backend not running → Start backend
- ✅ Wrong IP address → Update IP in config
- ✅ Firewall blocking → Allow port 8080
- ✅ Different networks → Connect to same WiFi

### Error: "Connection refused"
- Backend is running but not bound to `0.0.0.0`
- Check `backend/src/main/resources/application.properties`:
  ```
  server.address=0.0.0.0
  ```

### Error: "Timeout"
- Backend might be slow to start
- Check backend logs for errors
- Verify database is running (MySQL)

## ✅ Quick Checklist

- [ ] Backend server is running (`mvn spring-boot:run`)
- [ ] Backend shows "Started..." message
- [ ] IP address matches current network (`192.168.1.19`)
- [ ] Config set correctly (`PHYSICAL_DEVICE` or `EMULATOR`)
- [ ] Windows Firewall allows port 8080
- [ ] Phone/emulator and computer on same network
- [ ] Metro bundler restarted with `--reset-cache`
- [ ] App rebuilt and installed

## 🎯 Test Endpoints

Once backend is running, test these:

1. **Menu**: `http://192.168.1.19:8080/api/v1/public/menu`
2. **Send OTP**: `POST http://192.168.1.19:8080/api/v1/auth/otp/send`
   ```json
   {"mobileNumber": "9999999999"}
   ```

If these work in browser/Postman, they'll work in the app!

