import api from '../config/api';

export const deliveryBoyService = {
  getAllDeliveryBoys: async () => {
    const response = await api.get('/admin/delivery-boys');
    return response.data;
  },

  createDeliveryBoy: async (deliveryBoy) => {
    const response = await api.post('/admin/delivery-boys', deliveryBoy);
    return response.data;
  },

  updateDeliveryBoy: async (id, updates) => {
    const response = await api.put(`/admin/delivery-boys/${id}`, updates);
    return response.data;
  },

  updateDeliveryBoyStatus: async (id, isActive, isAvailable, isOnDuty) => {
    const params = {};
    if (isActive !== undefined) params.isActive = isActive;
    if (isAvailable !== undefined) params.isAvailable = isAvailable;
    if (isOnDuty !== undefined) params.isOnDuty = isOnDuty;
    
    const response = await api.put(`/admin/delivery-boys/${id}/status`, null, {
      params,
    });
    return response.data;
  },
};


