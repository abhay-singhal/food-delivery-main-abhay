import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  sendOtp: async (mobileNumber) => {
    const response = await api.post('/auth/otp/send', { mobileNumber });
    return response.data;
  },

  verifyOtp: async (mobileNumber, otp) => {
    const response = await api.post('/auth/otp/verify/delivery', {
      mobileNumber,
      otp,
    });
    
    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await api.post('/auth/refresh', { refreshToken });
      if (response.data.success) {
        const { accessToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        return { accessToken };
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  getAuthTokens: async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const userStr = await AsyncStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { accessToken, refreshToken, user };
  },

  /**
   * Check if token is expired or if it's past midnight (12:00 AM)
   * Delivery boys should be logged out at midnight
   */
  isTokenExpiredOrPastMidnight: (token) => {
    if (!token) return true;
    
    try {
      // Decode JWT token (without verification, just to get expiration)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Check if token is expired
      if (now >= exp) {
        console.log('🕛 Token is expired');
        return true;
      }
      
      // Check if it's past midnight (12:00 AM)
      const currentDate = new Date();
      const midnight = new Date(currentDate);
      midnight.setHours(24, 0, 0, 0); // Set to midnight (12:00 AM)
      
      if (now >= midnight.getTime()) {
        console.log('🕛 It is past midnight - delivery boy should be logged out');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If we can't parse, consider it expired
    }
  },

};

// Add startMidnightLogoutCheck function after object is defined
authService.startMidnightLogoutCheck = function(onLogout) {
  const checkInterval = setInterval(async () => {
    const {accessToken} = await authService.getAuthTokens();
    if (accessToken && authService.isTokenExpiredOrPastMidnight(accessToken)) {
      console.log('🕛 Auto-logging out delivery boy at midnight');
      await authService.logout();
      if (onLogout) {
        onLogout();
      }
      clearInterval(checkInterval);
    }
  }, 60000); // Check every minute
  
  return checkInterval; // Return interval ID so it can be cleared
};

