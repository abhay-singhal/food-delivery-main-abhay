# Location Tracking Service Setup Guide

This guide explains how to set up and use the location tracking service for the food delivery app.

## Overview

The location tracking system allows:
- **Delivery drivers** to share their real-time location with customers
- **Customers** to see their delivery driver's location on a map
- **Admins** to view all active delivery drivers on a map

## Architecture

- **Android Foreground Service**: Runs continuously to track location even when app is in background
- **Firebase Firestore**: Stores and syncs location data in real-time
- **React Native**: Provides UI and manages location updates

## Prerequisites

1. Firebase project with Firestore enabled
2. Android device/emulator with location services enabled
3. Google Play Services installed on device

## Setup Steps

### 1. Install Dependencies

```bash
cd ShivDhabaCustomer
npm install
```

The following packages are required:
- `@react-native-firebase/firestore` - For Firestore database
- `@react-native-firebase/app` - Firebase core
- `react-native-maps` - For map display
- `@react-native-community/geolocation` - Location utilities

### 2. Firebase Configuration

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Ensure Firestore is enabled in Firebase Console

### 3. Firebase Security Rules

Deploy the security rules from `firestore.rules` to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or manually copy the rules from `firestore.rules` to Firebase Console > Firestore > Rules

### 4. Android Permissions

Permissions are already configured in `AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION` (Android 10+)
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`
- `POST_NOTIFICATIONS` (Android 13+)

### 5. Build and Run

```bash
npm run android
```

## Usage

### For Delivery Drivers

1. Navigate to the delivery tracking screen:
```javascript
navigation.navigate('DeliveryLocationTracking', { orderId: 'ORDER123' });
```

2. Grant location permissions when prompted
3. Tap "Start Tracking" to begin sharing location
4. Location will be automatically shared with the customer
5. Tap "Stop Tracking" when delivery is complete

### For Customers

1. Navigate to order tracking screen:
```javascript
navigation.navigate('OrderTracking', { orderId: 'ORDER123' });
```

2. The screen will automatically show:
   - Delivery address marker (green)
   - Driver location marker (orange) - updates in real-time
   - Route line connecting driver to delivery address
   - Distance to delivery location

### For Admins

1. Navigate to admin driver tracking screen:
```javascript
navigation.navigate('AdminDriverTracking');
```

2. View all active drivers on the map
3. See driver details including:
   - Driver ID
   - Current order
   - Location coordinates
   - Speed (if moving)
   - Last update time

## Firestore Data Structure

### `orders/{orderId}`
```javascript
{
  driverId: "driver123",
  driverLocation: {
    latitude: 28.9845,
    longitude: 77.7064,
    accuracy: 10,
    speed: 25.5,
    heading: 90,
    timestamp: Timestamp
  },
  lastLocationUpdate: Timestamp
}
```

### `driverLocations/{driverId}`
```javascript
{
  driverId: "driver123",
  orderId: "order123",
  active: true,
  latitude: 28.9845,
  longitude: 77.7064,
  accuracy: 10,
  speed: 25.5,
  heading: 90,
  timestamp: Timestamp,
  updatedAt: Timestamp
}
```

## API Reference

### LocationService

```javascript
import locationService from './src/services/locationService';

// Request permissions
await locationService.requestPermissions();

// Check permissions
const permissions = await locationService.checkPermissions();

// Start tracking
await locationService.startTracking(orderId, driverId);

// Stop tracking
await locationService.stopTracking();

// Listen to location updates
const subscription = locationService.addLocationListener((location) => {
  console.log('Location:', location);
});

// Remove listener
subscription.remove();
```

### FirestoreService

```javascript
import firestoreService from './src/services/firestoreService';

// Update driver location
await firestoreService.updateDriverLocation(driverId, orderId, location);

// Subscribe to driver location for an order
const unsubscribe = firestoreService.subscribeToDriverLocation(orderId, (location) => {
  console.log('Driver location:', location);
});

// Subscribe to all driver locations (admin)
const unsubscribe = firestoreService.subscribeToAllDriverLocations((drivers) => {
  console.log('All drivers:', drivers);
});

// Set driver inactive
await firestoreService.setDriverInactive(driverId);
```

## Troubleshooting

### Location not updating

1. Check if permissions are granted:
```javascript
const permissions = await locationService.checkPermissions();
console.log(permissions);
```

2. Check if foreground service is running (check notification)
3. Verify Firebase connection
4. Check device location settings

### Permission denied

- Android 10+: Background location requires special permission
- Go to Settings > Apps > Your App > Permissions
- Enable "Allow all the time" for location

### Map not showing

1. Verify Google Maps API key is configured
2. Check `react-native-maps` is properly installed
3. For Android, ensure Google Play Services is installed

### Firestore errors

1. Verify `google-services.json` is in correct location
2. Check Firebase project configuration
3. Verify security rules are deployed
4. Check user authentication status

## Performance Considerations

- Location updates are throttled to every 10 seconds or 10 meters
- Firestore writes are batched to reduce costs
- Background location tracking uses foreground service to comply with Android restrictions

## Security Notes

- Location data is only shared with:
  - Customer (for their own orders)
  - Delivery driver (for their assigned orders)
  - Admin (for all active drivers)
- Security rules enforce these restrictions
- Location data is automatically cleaned up when delivery completes

## Testing

### Test on Physical Device

1. Enable Developer Options
2. Enable Mock Locations (for testing)
3. Grant all permissions
4. Test location updates

### Test Location Updates

```javascript
// In delivery app
await locationService.startTracking('test-order', 'test-driver');

// In customer app
firestoreService.subscribeToDriverLocation('test-order', (location) => {
  console.log('Received location:', location);
});
```

## Next Steps

1. Integrate with order management system
2. Add ETA calculations based on distance
3. Add geofencing for delivery completion
4. Add location history for analytics
5. Optimize battery usage

## Support

For issues or questions, check:
- Firebase Console for Firestore errors
- Android Logcat for native service errors
- React Native debugger for JS errors


