import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider} from 'react-redux';
import {store} from './src/store/store';
import SplashScreen from './src/screens/SplashScreen';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import NameInputScreen from './src/screens/NameInputScreen';
import AdminDriverTrackingScreen from './src/screens/AdminDriverTrackingScreen';
import DeliveryLocationTrackingScreen from './src/screens/DeliveryLocationTrackingScreen';
import LocationPickerScreen from './src/screens/LocationPickerScreen';
import MenuItemDetailScreen from './src/screens/MenuItemDetailScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import PaymentScreen from './src/screens/PaymentScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="NameInput" component={NameInputScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="AdminDriverTracking" component={AdminDriverTrackingScreen} />
          <Stack.Screen name="DeliveryLocationTracking" component={DeliveryLocationTrackingScreen} />
          <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;






