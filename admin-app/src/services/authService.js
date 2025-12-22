import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/admin/login', {
      username,
      password,
    });
    
    if (response.data.success) {
      const {accessToken, refreshToken, user} = response.data.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  getStoredUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },
};


