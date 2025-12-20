# Delivery Boy Midnight Logout Feature

## Overview
Delivery boys are automatically logged out at midnight (12:00 AM) every day. This ensures that delivery partners start fresh each day and prevents sessions from carrying over to the next day.

## Implementation Details

### Backend Changes

#### 1. JWT Token Generation (`JwtUtil.java`)
- Added `generateAccessTokenUntilMidnight()` method that calculates token expiration to midnight (12:00 AM)
- Added `generateRefreshTokenUntilMidnight()` method for refresh tokens
- Tokens expire exactly at midnight, regardless of when the delivery boy logs in

#### 2. Authentication Service (`AuthService.java`)
- Modified `verifyOtp()` to use midnight expiration for delivery boys
- Modified `refreshToken()` to use midnight expiration when refreshing tokens for delivery boys
- Regular users (customers, admins) continue to use standard token expiration

### Frontend Changes

#### 1. Auth Service (`authService.js`)
- Added `isTokenExpiredOrPastMidnight()` method to check if token is expired or past midnight
- Added `startMidnightLogoutCheck()` method that runs a periodic check (every minute) to auto-logout at midnight

#### 2. Splash Screen (`SplashScreen.js`)
- Added check on app startup to verify if token is expired or past midnight
- Automatically logs out delivery boy if it's past midnight

#### 3. Available Orders Screen (`AvailableOrdersScreen.js`)
- Starts a periodic check when the screen is mounted
- Automatically logs out and shows alert when midnight is reached
- Cleans up the interval when component unmounts

## How It Works

1. **Login**: When a delivery boy logs in, the backend generates tokens that expire at midnight (12:00 AM)
2. **Token Expiration**: The JWT token contains an expiration timestamp set to midnight
3. **Periodic Check**: The app checks every minute if it's past midnight
4. **Auto-Logout**: When midnight is reached, the app automatically logs out the delivery boy and shows an alert

## Example Flow

### Scenario: Delivery boy logs in at 2:00 PM
- Token expires at: 12:00 AM (midnight) - 10 hours later
- Delivery boy can work until midnight
- At 12:00 AM, app automatically logs out

### Scenario: Delivery boy logs in at 11:30 PM
- Token expires at: 12:00 AM (midnight) - 30 minutes later
- Delivery boy can work until midnight
- At 12:00 AM, app automatically logs out

### Scenario: Delivery boy logs in at 12:30 AM (after midnight)
- Token expires at: 12:00 AM next day (midnight) - 23.5 hours later
- Delivery boy can work until next midnight

## Testing

### Manual Testing
1. Log in as a delivery boy
2. Check the token expiration in the JWT payload (should be midnight)
3. Wait until midnight or manually set device time to 12:01 AM
4. App should automatically log out and show alert

### SQL Query to Check Token Expiration
```sql
-- Note: Token expiration is stored in JWT, not in database
-- You can decode the JWT token to see the expiration time
```

## Configuration

No additional configuration needed. The feature is automatically enabled for all delivery boys.

## Notes

- **Regular Users**: Customers and admins are NOT affected by this feature
- **Token Refresh**: When a delivery boy refreshes their token, the new token also expires at midnight
- **Time Zone**: Uses the server's local time zone for midnight calculation
- **App Restart**: If the app is restarted after midnight, the splash screen will detect expired token and log out

