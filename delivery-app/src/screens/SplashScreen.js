import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {restoreSession} from '../store/slices/authSlice';
import {authService} from '../services/authService';

const SplashScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {isAuthenticated} = useSelector(state => state.auth);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated !== null) {
      navigation.replace(isAuthenticated ? 'MainTabs' : 'Login');
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const {accessToken, refreshToken, user} = await authService.getAuthTokens();
      
      // Check if token is expired or past midnight (delivery boys log out at 12 AM)
      if (accessToken && refreshToken && user) {
        const isExpired = authService.isTokenExpiredOrPastMidnight(accessToken);
        if (isExpired) {
          console.log('🕛 Token expired or past midnight - logging out delivery boy');
          await authService.logout();
          navigation.replace('Login');
          return;
        }
        dispatch(restoreSession({accessToken, refreshToken, user}));
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shiv Dhaba</Text>
      <Text style={styles.subtitle}>Delivery Boy App</Text>
      <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;

