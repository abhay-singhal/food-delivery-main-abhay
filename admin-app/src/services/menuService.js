import api from '../config/api';

export const menuService = {
  getCategories: async () => {
    const response = await api.get('/admin/menu/categories');
    return response.data;
  },

  createCategory: async (category) => {
    const response = await api.post('/admin/menu/categories', category);
    return response.data;
  },

  getMenuItems: async () => {
    const response = await api.get('/admin/menu/items');
    return response.data;
  },

  createMenuItem: async (item) => {
    const response = await api.post('/admin/menu/items', item);
    return response.data;
  },

  updateMenuItem: async (itemId, item) => {
    const response = await api.put(`/admin/menu/items/${itemId}`, item);
    return response.data;
  },

  deleteMenuItem: async (itemId) => {
    const response = await api.delete(`/admin/menu/items/${itemId}`);
    return response.data;
  },

  updateMenuItemStatus: async (itemId, status) => {
    const response = await api.put(`/admin/menu/items/${itemId}/status`, null, {
      params: {status},
    });
    return response.data;
  },
};


