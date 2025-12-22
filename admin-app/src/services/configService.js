import api from '../config/api';

export const configService = {
  getConfig: async () => {
    const response = await api.get('/admin/config');
    return response.data;
  },

  updateConfig: async (key, value, description = null) => {
    const params = {key, value};
    if (description) params.description = description;
    
    const response = await api.post('/admin/config', null, {params});
    return response.data;
  },
};


