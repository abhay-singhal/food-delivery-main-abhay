import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMenu} from '../store/slices/menuSlice';
import {loadCart} from '../store/slices/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {restoreSession} from '../store/slices/authSlice';
import {authService} from '../services/authService';

const SplashScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {isLoading} = useSelector(state => state.menu);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check and refresh token if needed (30-day persistent login)
      const isAuth = await authService.isAuthenticated();

      if (isAuth) {
        // Restore auth session
        const userStr = await AsyncStorage.getItem('user');
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (userStr && accessToken) {
          const user = JSON.parse(userStr);
          dispatch(restoreSession({
            user,
            accessToken,
            refreshToken,
          }));
          
          // Check if user has a name
          if (!user?.fullName || user.fullName.trim() === '') {
            // User doesn't have a name, navigate to name input
            setTimeout(() => {
              navigation.replace('NameInput');
            }, 2000);
            return;
          }
        }
      } else {
        // Token expired or invalid, clear session
        console.log('Session expired or invalid, user needs to login');
      }

      // Load cart from storage
      const cartStr = await AsyncStorage.getItem('@cart_items');
      if (cartStr) {
        dispatch(loadCart(JSON.parse(cartStr)));
      }

      // Fetch menu
      await dispatch(fetchMenu());

      // Navigate to Menu after 2 seconds
      setTimeout(() => {
        navigation.replace('Menu');
      }, 2000);
    } catch (error) {
      console.error('Initialization error:', error);
      navigation.replace('Menu');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shiv Dhaba</Text>
      <Text style={styles.subtitle}>Food Delivery</Text>
      <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;


