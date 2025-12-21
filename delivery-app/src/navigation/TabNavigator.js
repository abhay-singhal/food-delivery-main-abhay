import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PickUpOrdersScreen from '../screens/PickUpOrdersScreen';
import ActiveOrderScreen from '../screens/ActiveOrderScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="PickUpOrders"
      backBehavior="history"
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
      })}>
      <Tab.Screen
        name="PickUpOrders"
        component={PickUpOrdersScreen}
        options={{
          tabBarLabel: 'Pick-Up',
          tabBarIcon: ({color, size}) => (
            <Icon name="shopping-cart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ActiveOrder"
        component={ActiveOrderScreen}
        options={{
          tabBarLabel: 'Active',
          tabBarIcon: ({color, size}) => (
            <Icon name="local-shipping" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({color, size}) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

