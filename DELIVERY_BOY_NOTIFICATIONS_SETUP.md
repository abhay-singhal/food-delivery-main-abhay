# Delivery Boy Push Notifications Setup

## Overview
Delivery boys receive push notifications when new orders become available, but only if they are logged in and marked as "on duty".

## How It Works

### Backend Flow
1. When an order status changes to `READY`, the backend calls `OrderAssignmentService.notifyAvailableDeliveryPartners()`
2. The service finds all delivery partners who are:
   - `isOnDuty = true` (logged in)
   - `isAvailable = true` (not currently assigned to an order)
   - Have an FCM token registered
3. Push notifications are sent to all eligible delivery partners

### Frontend Flow
1. **Login**: When a delivery boy logs in:
   - Requests notification permissions
   - Gets FCM token
   - Registers FCM token with backend
   - Sets `isOnDuty = true`

2. **Notification Received**: When a notification arrives:
   - Shows alert with order details
   - Refreshes available orders list
   - Allows delivery boy to view and accept the order

3. **Logout**: When a delivery boy logs out:
   - Sets `isOnDuty = false`
   - Cleans up notification listeners

## Implementation Details

### Files Created/Modified

#### 1. `delivery-app/src/services/notificationService.js`
- Handles FCM token registration
- Manages notification permissions
- Updates delivery boy status (on duty/off duty)
- Sets up notification listeners

#### 2. `delivery-app/src/store/slices/authSlice.js`
- Initializes notifications on login
- Cleans up notifications on logout

#### 3. `delivery-app/src/screens/AvailableOrdersScreen.js`
- Sets up notification listeners
- Handles incoming notifications
- Refreshes orders list when notification received

#### 4. `delivery-app/index.js`
- Registers background message handler for FCM

#### 5. `delivery-app/android/app/src/main/AndroidManifest.xml`
- Added Firebase Messaging service
- Added required permissions

### API Endpoints Used

1. **PUT `/api/v1/delivery/fcm-token`**
   - Updates FCM token for the logged-in delivery boy
   - Called automatically on login

2. **PUT `/api/v1/delivery/status`**
   - Updates `isOnDuty` and `isAvailable` status
   - Called on login (`isOnDuty = true`) and logout (`isOnDuty = false`)

## Testing

### Prerequisites
1. Firebase Cloud Messaging must be configured in the backend
2. `google-services.json` must be added to `delivery-app/android/app/`
3. Delivery boy must be logged in

### Test Steps

1. **Login as Delivery Boy**
   - Open delivery app
   - Login with delivery boy credentials
   - Check console logs for:
     - `✅ Notification permission granted`
     - `📱 FCM Token: ...`
     - `✅ FCM token registered successfully`
     - `✅ Delivery boy on duty`

2. **Create a New Order**
   - Use customer app to place an order
   - Admin should mark order as `READY` (or use SQL to update status)

3. **Receive Notification**
   - Delivery boy should receive push notification
   - Notification should show: "New Order Available - Order #XXX - ₹XXX.XX - Address"
   - Tapping notification should refresh orders list

4. **Verify Backend Logs**
   - Check backend logs for:
     - `Notifying X delivery partners about order Y`
     - `Notifications sent to X delivery partners for order Y`

### SQL Query to Test
```sql
-- Update an order to READY status to trigger notifications
UPDATE orders 
SET status = 'READY'
WHERE id = YOUR_ORDER_ID 
AND delivery_boy_id IS NULL;
```

## Troubleshooting

### Notifications Not Received

1. **Check FCM Token Registration**
   - Check console logs for FCM token
   - Verify token is saved in database:
     ```sql
     SELECT id, mobile_number, fcm_token 
     FROM users 
     WHERE role = 'DELIVERY_BOY';
     ```

2. **Check Delivery Boy Status**
   - Verify `isOnDuty = true`:
     ```sql
     SELECT u.id, u.mobile_number, dbd.is_on_duty, dbd.is_available
     FROM users u
     JOIN delivery_boy_details dbd ON u.id = dbd.user_id
     WHERE u.role = 'DELIVERY_BOY';
     ```

3. **Check Firebase Configuration**
   - Verify `google-services.json` is in `delivery-app/android/app/`
   - Check Firebase console for message delivery status

4. **Check Notification Permissions**
   - Android: Settings > Apps > Delivery Boy > Notifications
   - Ensure notifications are enabled

### Common Issues

**Issue**: "FCM token is null or empty"
- **Solution**: Ensure notification permissions are granted and Firebase is properly configured

**Issue**: "No available delivery partners"
- **Solution**: Ensure delivery boy has `isOnDuty = true` and `isAvailable = true`

**Issue**: Notifications received but orders not showing
- **Solution**: Check if orders are in `PLACED`, `ACCEPTED`, `PREPARING`, or `READY` status and `delivery_boy_id IS NULL`

## Notes

- Notifications are only sent to delivery boys who are:
  - Logged in (`isOnDuty = true`)
  - Available (`isAvailable = true`)
  - Not assigned to any active order
  - Have a valid FCM token

- When a delivery boy accepts an order, they become unavailable and won't receive new order notifications until they complete the delivery

- Notifications are sent when order status changes to `READY`, not when order is first placed







