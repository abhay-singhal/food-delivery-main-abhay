import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

// API Configuration
// ============================================
// Choose your setup:
// 1. Android Emulator: Use 'EMULATOR'
// 2. Physical Device: Use your computer's IP address (find with: ipconfig)
// 3. iOS Simulator: Use 'LOCALHOST'

const API_CONFIG = {
  // For Android Emulator
  EMULATOR: 'http://10.0.2.2:8080/api/v1',
  
  // For Physical Device - UPDATE THIS WITH YOUR COMPUTER'S IP
  // Find your IP: Run 'ipconfig' in CMD, look for IPv4 Address
  PHYSICAL_DEVICE: 'http://192.168.1.19:8080/api/v1', // Updated with current IP
  
  // For iOS Simulator
  LOCALHOST: 'http://localhost:8080/api/v1',
};

// ============================================
// SELECT YOUR CONFIGURATION HERE:
// ============================================
// Change this to: 'EMULATOR', 'PHYSICAL_DEVICE', or 'LOCALHOST'
// For Android Emulator: 'EMULATOR'
// For Physical Device: 'PHYSICAL_DEVICE'
const CURRENT_CONFIG = __DEV__ ? 'PHYSICAL_DEVICE' : 'PHYSICAL_DEVICE'; // Auto-select based on dev mode

// Auto-select based on platform (fallback)
const getApiBaseUrl = () => {
  // If manually set, use that
  if (CURRENT_CONFIG && API_CONFIG[CURRENT_CONFIG]) {
    return API_CONFIG[CURRENT_CONFIG];
  }
  
  // Auto-detect based on platform
  if (Platform.OS === 'ios') {
    return API_CONFIG.LOCALHOST;
  }
  
  // Default to emulator for Android
  return API_CONFIG.EMULATOR;
};

const API_BASE_URL = getApiBaseUrl();

console.log('📱 API Configuration:');
console.log('  Platform:', Platform.OS);
console.log('  Selected Config:', CURRENT_CONFIG);
console.log('  API Base URL:', API_BASE_URL);
console.log('  Backend should be running at:', API_BASE_URL.replace('/api/v1', ''));

export {API_BASE_URL, API_CONFIG};

const api = axios.create({      //
  baseURL: API_BASE_URL, 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error logging for network issues
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const fullUrl = `${error.config?.baseURL}${error.config?.url}`;
      console.error('🚨 Network Error Details:');
      console.error('  - URL:', fullUrl);
      console.error('  - Base URL:', error.config?.baseURL);
      console.error('  - Error Code:', error.code);
      console.error('  - Error Message:', error.message);
      console.error('  - Troubleshooting:');
      console.error('    1. Verify backend is running on', API_BASE_URL.replace('/api/v1', ''));
      console.error('    2. Check if device and computer are on same WiFi network');
      console.error('    3. Verify Windows Firewall allows port 8080');
      console.error('    4. Test in browser:', fullUrl);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Import authService dynamically to avoid circular dependency
        const {authService} = require('../services/authService');
        const refreshed = await authService.refreshAccessToken();
        
        if (refreshed && refreshed.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Only clear tokens if refresh token is also expired
        if (refreshError.message?.includes('expired') || refreshError.response?.status === 401) {
          const {authService} = require('../services/authService');
          await authService.logout();
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

