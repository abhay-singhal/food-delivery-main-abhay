import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to decode JWT token (without verification)
// React Native compatible base64 decoding
const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // React Native compatible base64 decode using btoa polyfill
    // For React Native, we can use a simple base64 decode
    let decoded;
    try {
      // Try using global Buffer if available (Metro bundler provides it)
      if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(base64, 'base64').toString('utf-8');
      } else {
        // Fallback: manual base64 decode for React Native
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = '';
        let i = 0;
        while (i < base64.length) {
          const encoded1 = chars.indexOf(base64.charAt(i++));
          const encoded2 = chars.indexOf(base64.charAt(i++));
          const encoded3 = chars.indexOf(base64.charAt(i++));
          const encoded4 = chars.indexOf(base64.charAt(i++));
          const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
          str += String.fromCharCode((bitmap >> 16) & 255);
          if (encoded3 !== 64) str += String.fromCharCode((bitmap >> 8) & 255);
          if (encoded4 !== 64) str += String.fromCharCode(bitmap & 255);
        }
        decoded = str;
      }
      return JSON.parse(decoded);
    } catch (parseError) {
      console.error('Error parsing JWT payload:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Check if token is expired or will expire soon (within 1 hour)
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    // Consider expired if expires within 1 hour
    return expirationTime - currentTime < oneHour;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const authService = {
  sendOtp: async (mobileNumber) => {
    const response = await api.post('/auth/otp/send', { mobileNumber });
    return response.data;
  },

  verifyOtp: async (mobileNumber, otp) => {
    const response = await api.post('/auth/otp/verify/customer', {
      mobileNumber,
      otp,
    });
    
    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      // Store login timestamp for 30-day tracking
      await AsyncStorage.setItem('loginTimestamp', Date.now().toString());
    }
    
    return response.data;
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Check if refresh token is expired
      if (isTokenExpired(refreshToken)) {
        // Refresh token expired, user needs to login again
        await authService.logout();
        throw new Error('Session expired. Please login again.');
      }

      const response = await api.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (response.data && response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        } else {
          // If no new refresh token, keep the old one
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        return { accessToken, refreshToken: newRefreshToken || refreshToken };
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      if (error.response?.status === 401 || error.message.includes('expired')) {
        await authService.logout();
      }
      throw error;
    }
  },

  checkAndRefreshToken: async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');

    // Check if 30 days have passed since login
    if (loginTimestamp) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const timeSinceLogin = Date.now() - parseInt(loginTimestamp, 10);
      if (timeSinceLogin > thirtyDays) {
        // 30 days passed, logout user
        await authService.logout();
        return false;
      }
    }

    // Check if access token is expired or about to expire
    if (accessToken && isTokenExpired(accessToken)) {
      // Try to refresh if refresh token exists and is valid
      if (refreshToken && !isTokenExpired(refreshToken)) {
        try {
          await authService.refreshAccessToken();
          return true;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          return false;
        }
      } else {
        // Refresh token also expired or missing
        await authService.logout();
        return false;
      }
    }

    return true; // Token is valid
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'user',
      'loginTimestamp',
    ]);
  },

  getStoredUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');

    if (!accessToken || !refreshToken) {
      return false;
    }

    // Check if 30 days have passed
    if (loginTimestamp) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const timeSinceLogin = Date.now() - parseInt(loginTimestamp, 10);
      if (timeSinceLogin > thirtyDays) {
        await authService.logout();
        return false;
      }
    }

    // Check token expiration
    if (isTokenExpired(accessToken)) {
      if (!isTokenExpired(refreshToken)) {
        // Try to refresh
        try {
          await authService.refreshAccessToken();
          return true;
        } catch (error) {
          return false;
        }
      }
      return false;
    }

    return true;
  },

  updateFcmToken: async (fcmToken) => {
    const response = await api.put('/customer/fcm-token', null, {
      params: { fcmToken },
    });
    return response.data;
  },
};


