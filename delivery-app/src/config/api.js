import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

// API Configuration - Same as customer app
const API_CONFIG = {
  EMULATOR: 'http://10.0.2.2:8080/api/v1',
  PHYSICAL_DEVICE: 'http://192.168.1.19:8080/api/v1',
  LOCALHOST: 'http://localhost:8080/api/v1',
};

const CURRENT_CONFIG = __DEV__ ? 'PHYSICAL_DEVICE' : 'PHYSICAL_DEVICE';

const getApiBaseUrl = () => {
  if (CURRENT_CONFIG && API_CONFIG[CURRENT_CONFIG]) {
    return API_CONFIG[CURRENT_CONFIG];
  }
  if (Platform.OS === 'ios') {
    return API_CONFIG.LOCALHOST;
  }
  return API_CONFIG.EMULATOR;
};

const API_BASE_URL = getApiBaseUrl();

console.log('📱 Delivery App API Configuration:');
console.log('  Platform:', Platform.OS);
console.log('  Selected Config:', CURRENT_CONFIG);
console.log('  API Base URL:', API_BASE_URL);

export {API_BASE_URL, API_CONFIG};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const {authService} = require('../services/authService');
        const refreshed = await authService.refreshAccessToken();
        if (refreshed && refreshed.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        const {authService} = require('../services/authService');
        await authService.logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

