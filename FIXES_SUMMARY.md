# Fixes Applied - Place Order Button & 30-Day Login

## ✅ Issues Fixed

### 1. Place Order Button Not Visible

**Problem**: The "Place Order" button was inside a ScrollView and could be scrolled out of view.

**Solution**:
- Moved the button to a fixed footer that's always visible at the bottom
- Changed layout from ScrollView-only to View with ScrollView + Fixed Footer
- Button now stays visible regardless of scroll position

**Files Changed**:
- `ShivDhabaCustomer/src/screens/CheckoutScreen.js`
  - Added `fixedFooter` style with absolute positioning
  - Button is now outside ScrollView, always visible
  - Added proper padding to ScrollView content to prevent overlap

### 2. 30-Day Persistent Login

**Problem**: Users had to login every time they opened the app.

**Solution**:
- Updated backend refresh token expiration to 30 days (2,592,000,000 ms)
- Added token validation and auto-refresh logic
- Store login timestamp to track 30-day period
- Auto-refresh access tokens before expiration
- Validate tokens on app startup

**Files Changed**:

1. **Backend**:
   - `backend/src/main/resources/application.properties`
     - Changed `jwt.refresh-token-expiration` from 7 days to 30 days

2. **Frontend**:
   - `ShivDhabaCustomer/src/services/authService.js`
     - Added `decodeJWT()` function for token validation
     - Added `isTokenExpired()` function to check expiration
     - Added `refreshAccessToken()` function
     - Added `checkAndRefreshToken()` function
     - Added `isAuthenticated()` function
     - Store `loginTimestamp` on login
     - Check 30-day period on authentication

   - `ShivDhabaCustomer/src/screens/SplashScreen.js`
     - Added token validation on app startup
     - Auto-refresh tokens if needed
     - Restore session only if tokens are valid

   - `ShivDhabaCustomer/src/config/api.js`
     - Updated token refresh logic in API interceptor
     - Auto-refresh on 401 errors

## How It Works

### 30-Day Login Flow

1. **On Login**:
   - User logs in with OTP
   - Access token (1 day) and refresh token (30 days) are stored
   - Login timestamp is stored

2. **On App Startup**:
   - Check if 30 days have passed since login
   - If yes → Logout user
   - If no → Check if access token is expired
   - If expired → Try to refresh using refresh token
   - If refresh succeeds → Continue with session
   - If refresh fails → Logout user

3. **During API Calls**:
   - If access token expires (401 error)
   - Automatically refresh using refresh token
   - Retry the original request with new token

4. **Token Expiration**:
   - Access token: 1 day (auto-refreshed)
   - Refresh token: 30 days (user stays logged in)
   - After 30 days: User must login again

## Testing

### Test Place Order Button

1. Add items to cart
2. Go to Checkout screen
3. Fill in delivery address
4. Scroll down - button should remain visible at bottom
5. Click "Place Order" - should work

### Test 30-Day Login

1. Login with OTP
2. Close app completely
3. Reopen app
4. Should remain logged in (no login screen)
5. Should work for 30 days without re-login

## Notes

- Refresh token is automatically renewed when used
- Access token is refreshed automatically before expiration
- After 30 days, user must login again
- All tokens are validated on app startup
- Invalid/expired tokens trigger automatic logout






