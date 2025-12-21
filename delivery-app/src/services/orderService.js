import api from '../config/api';

export const orderService = {
  getAvailableOrders: async () => {
    console.log('📦 Fetching available orders from /delivery/orders/available');
    const response = await api.get('/delivery/orders/available');
    console.log('📦 API Response:', JSON.stringify(response.data, null, 2));
    console.log('📦 Orders array:', response.data?.data);
    return response.data;
  },

  acceptOrder: async (orderId) => {
    const response = await api.post(`/delivery/orders/${orderId}/accept`);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/delivery/orders/my-orders');
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/customer/orders/${orderId}`);
    return response.data;
  },

  markDelivered: async (orderId) => {
    const response = await api.post(`/delivery/orders/${orderId}/deliver`);
    return response.data;
  },

  updateLocation: async (orderId, latitude, longitude, address) => {
    const response = await api.post(`/delivery/orders/${orderId}/update-location`, null, {
      params: { latitude, longitude, address },
    });
    return response.data;
  },

  startOrder: async (orderId) => {
    // This endpoint changes order status from READY to OUT_FOR_DELIVERY
    // If backend doesn't have this endpoint, we'll need to add it
    const response = await api.post(`/delivery/orders/${orderId}/start`);
    return response.data;
  },
};

