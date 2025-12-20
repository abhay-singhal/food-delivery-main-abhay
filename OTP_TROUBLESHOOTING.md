# OTP Troubleshooting Guide

If OTP sending is failing, follow these steps:

## 1. Check Backend Server Status

Verify your backend is running:
```bash
# Check if backend is running on port 8080
curl http://localhost:8080/api/v1/auth/otp/send -X POST -H "Content-Type: application/json" -d "{\"mobileNumber\":\"1234567890\"}"
```

Or test in browser/Postman:
- URL: `http://192.168.29.104:8080/api/v1/auth/otp/send`
- Method: POST
- Body: `{"mobileNumber": "1234567890"}`

## 2. Verify IP Address

The app is configured to use: `http://192.168.29.104:8080/api/v1`

**To find your current IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Update `ShivDhabaCustomer/src/config/api.js` with your current IP

**For Android Emulator:**
- Use `http://10.0.2.2:8080/api/v1` instead

## 3. Check Network Connectivity

**From your phone/emulator:**
- Ensure phone and computer are on the same WiFi network
- Try accessing `http://192.168.29.104:8080` in phone's browser
- If it doesn't load, there's a network issue

## 4. Check Windows Firewall

Windows Firewall might be blocking port 8080:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Add inbound rule for port 8080 (TCP)

Or temporarily disable firewall to test.

## 5. Check Backend Logs

When you send OTP, check backend console. You should see:
```
OTP for 1234567890: 123456
```

If you don't see this, the request isn't reaching the backend.

## 6. Check Redis (Optional)

Backend uses Redis for OTP storage, but falls back to in-memory if Redis is unavailable.

**To check Redis:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

**If Redis is not running:**
- Backend will use in-memory storage (works fine for development)
- OTPs will be lost on server restart

## 7. Common Error Messages

### "Network error: Please check your internet connection"
- Backend server is not running
- Wrong IP address
- Firewall blocking connection
- Phone and computer on different networks

### "Server error: 500"
- Backend error - check backend logs
- Database connection issue
- Redis connection issue (if configured)

### "Invalid request"
- Mobile number format issue
- Request body format incorrect

## 8. Test Steps

1. **Start Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   # Or use your start script
   ```

2. **Verify Backend is Running:**
   - Check console for "Started ShivDhabaFoodDeliveryApplication"
   - Test endpoint in browser/Postman

3. **Update IP in App:**
   - Edit `ShivDhabaCustomer/src/config/api.js`
   - Set correct IP address

4. **Restart Metro Bundler:**
   ```bash
   cd ShivDhabaCustomer
   npx react-native start --reset-cache
   ```

5. **Rebuild App:**
   ```bash
   npx react-native run-android
   ```

6. **Test OTP:**
   - Enter 10-digit mobile number
   - Click "Send OTP"
   - Check backend console for OTP
   - Enter OTP in app

## 9. Debug Mode

Enable detailed logging:
- Check React Native debugger console
- Check backend console logs
- Check network tab in React Native debugger

## 10. Quick Fixes

**If using Android Emulator:**
```javascript
// In api.js, change to:
const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
```

**If using Physical Device:**
```javascript
// In api.js, use your computer's IP:
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8080/api/v1';
```

**To find your IP:**
- Windows: Run `ipconfig` in CMD
- Look for "IPv4 Address" under your active network adapter

## Still Not Working?

1. Check backend is actually running and accessible
2. Verify IP address matches your current network
3. Check firewall settings
4. Try using `localhost` if testing on emulator
5. Check backend logs for errors
6. Verify database is running (MySQL)
7. Check Redis status (if configured)

