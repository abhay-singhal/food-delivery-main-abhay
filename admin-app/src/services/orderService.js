import api from '../config/api';

export const orderService = {
  getAllOrders: async (status = null) => {
    const params = status ? {status} : {};
    const response = await api.get('/admin/orders', {params});
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  acceptOrder: async (orderId) => {
    const response = await api.post(`/admin/orders/${orderId}/accept`);
    return response.data;
  },

  rejectOrder: async (orderId) => {
    const response = await api.post(`/admin/orders/${orderId}/reject`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.post(`/admin/orders/${orderId}/status`, null, {
      params: {status},
    });
    return response.data;
  },

  assignOrderToDeliveryBoy: async (orderId, deliveryBoyId) => {
    const response = await api.put(`/admin/orders/${orderId}/assign`, null, {
      params: {deliveryBoyId},
    });
    return response.data;
  },
};

