# Location Tracking Integration Guide

Quick guide on how to integrate location tracking into your existing app flow.

## Quick Integration Examples

### 1. For Delivery Driver App

When a driver accepts an order, navigate to the tracking screen:

```javascript
// In your order acceptance handler
import {NavigationActions} from '@react-navigation/native';

const handleAcceptOrder = async (orderId) => {
  // Your existing order acceptance logic
  await acceptOrder(orderId);
  
  // Navigate to location tracking screen
  navigation.navigate('DeliveryLocationTracking', {
    orderId: orderId,
  });
};
```

### 2. For Customer App

When customer views their order, show tracking:

```javascript
// In your order list/details screen
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';

const handleViewOrder = (orderId) => {
  navigation.navigate('OrderTracking', {
    orderId: orderId,
  });
};

// Or add a "Track Order" button
<TouchableOpacity onPress={() => handleViewOrder(order.id)}>
  <Text>Track Order</Text>
</TouchableOpacity>
```

### 3. For Admin Dashboard

Add a button to view all drivers:

```javascript
// In your admin dashboard
import AdminDriverTrackingScreen from './src/screens/AdminDriverTrackingScreen';

const handleViewAllDrivers = () => {
  navigation.navigate('AdminDriverTracking');
};

// Add button
<TouchableOpacity onPress={handleViewAllDrivers}>
  <Icon name="map" />
  <Text>View All Drivers</Text>
</TouchableOpacity>
```

## Complete Integration Example

### Delivery Driver Flow

```javascript
// 1. Driver accepts order
const acceptOrder = async (orderId) => {
  try {
    // Update order status
    await updateOrderStatus(orderId, 'ACCEPTED');
    
    // Start location tracking
    navigation.navigate('DeliveryLocationTracking', {
      orderId: orderId,
    });
  } catch (error) {
    console.error('Error accepting order:', error);
  }
};

// 2. When delivery is complete
const completeDelivery = async (orderId) => {
  try {
    // Update order status
    await updateOrderStatus(orderId, 'DELIVERED');
    
    // Stop location tracking (handled in DeliveryLocationTrackingScreen)
    // The screen will automatically stop tracking when "Stop Tracking" is pressed
  } catch (error) {
    console.error('Error completing delivery:', error);
  }
};
```

### Customer Flow

```javascript
// In your order list component
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import orderService from './src/services/orderService';

const OrderListScreen = ({navigation}) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const myOrders = await orderService.getMyOrders();
    setOrders(myOrders);
  };

  const renderOrderItem = ({item}) => (
    <View style={styles.orderCard}>
      <Text>Order #{item.orderNumber}</Text>
      <Text>Status: {item.status}</Text>
      
      {/* Show track button for orders out for delivery */}
      {item.status === 'OUT_FOR_DELIVERY' && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('OrderTracking', {orderId: item.id})}>
          <Text>Track Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      data={orders}
      renderItem={renderOrderItem}
      keyExtractor={item => item.id.toString()}
    />
  );
};
```

### Admin Flow

```javascript
// In your admin dashboard
import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminDashboard = ({navigation}) => {
  return (
    <View>
      {/* Other admin features */}
      
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('AdminDriverTracking')}>
        <Icon name="map" size={24} />
        <Text>View All Drivers</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Conditional Rendering Based on User Role

```javascript
import {useSelector} from 'react-redux';
import authService from './src/services/authService';

const ProfileScreen = ({navigation}) => {
  const user = useSelector(state => state.auth.user);
  
  // Or get from AsyncStorage
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    const user = await authService.getStoredUser();
    setCurrentUser(user);
  };

  return (
    <View>
      {/* Show admin link if user is admin */}
      {currentUser?.role === 'ADMIN' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminDriverTracking')}>
          <Text>View All Drivers</Text>
        </TouchableOpacity>
      )}
      
      {/* Show delivery tracking if user is delivery boy */}
      {currentUser?.role === 'DELIVERY_BOY' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('DeliveryLocationTracking', {
            orderId: currentOrderId,
          })}>
          <Text>Start Location Tracking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

## Auto-start Tracking on Order Assignment

```javascript
// In your order management service
import locationService from './src/services/locationService';
import firestoreService from './src/services/firestoreService';

const assignOrderToDriver = async (orderId, driverId) => {
  try {
    // Assign order to driver (your existing logic)
    await updateOrderDriver(orderId, driverId);
    
    // Auto-start location tracking if driver is logged in
    const currentUser = await authService.getStoredUser();
    if (currentUser?.id === driverId && currentUser?.role === 'DELIVERY_BOY') {
      // Check permissions first
      const permissions = await locationService.checkPermissions();
      if (permissions.allGranted) {
        await locationService.startTracking(orderId, driverId);
      }
    }
  } catch (error) {
    console.error('Error assigning order:', error);
  }
};
```

## Handle Order Status Changes

```javascript
// Listen to order status changes and auto-navigate
import firestoreService from './src/services/firestoreService';

useEffect(() => {
  if (!orderId) return;
  
  const unsubscribe = firestoreService.subscribeToDriverLocation(
    orderId,
    (location, error) => {
      if (location && !isTrackingScreen) {
        // Optionally navigate to tracking screen when driver starts moving
        // navigation.navigate('OrderTracking', {orderId});
      }
    }
  );
  
  return () => unsubscribe();
}, [orderId]);
```

## Error Handling

```javascript
import {Alert} from 'react-native';
import locationService from './src/services/locationService';

const startTrackingWithErrorHandling = async (orderId, driverId) => {
  try {
    // Check permissions
    const permissions = await locationService.checkPermissions();
    
    if (!permissions.allGranted) {
      Alert.alert(
        'Permissions Required',
        'Location tracking requires location permissions. Please grant them in settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Settings',
            onPress: () => {
              // Open app settings
              Linking.openSettings();
            },
          },
        ]
      );
      return;
    }
    
    // Start tracking
    await locationService.startTracking(orderId, driverId);
    
  } catch (error) {
    Alert.alert('Error', `Failed to start tracking: ${error.message}`);
  }
};
```

## Best Practices

1. **Always check permissions before starting tracking**
2. **Handle errors gracefully with user-friendly messages**
3. **Stop tracking when order is delivered**
4. **Clean up listeners on component unmount**
5. **Show loading states while initializing**
6. **Provide clear UI feedback for tracking status**

## Testing Integration

1. **Test driver flow**:
   - Accept order → Should navigate to tracking screen
   - Start tracking → Should see location updates
   - Complete delivery → Should stop tracking

2. **Test customer flow**:
   - View order → Should see tracking screen
   - Driver location → Should update in real-time
   - Map → Should show both locations

3. **Test admin flow**:
   - View all drivers → Should see all active drivers
   - Map → Should show all driver markers
   - Updates → Should update in real-time

## Troubleshooting

If location tracking doesn't work:

1. Check Firebase configuration
2. Verify permissions are granted
3. Check Android Logcat for errors
4. Verify Firestore rules are deployed
5. Ensure user is authenticated
6. Check internet connection

For more details, see `LOCATION_TRACKING_SETUP.md`


