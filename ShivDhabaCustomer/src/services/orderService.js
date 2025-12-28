import api from '../config/api';

export const orderService = {
  placeOrder: async (orderData) => {
    const response = await api.post('/customer/orders', orderData);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/customer/orders');
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/customer/orders/${orderId}`);
    return response.data;
  },

  getDeliveryBoyLocation: async (orderId) => {
    const response = await api.get(`/customer/orders/${orderId}/delivery-boy-location`);
    return response.data;
  },

  getRestaurantLocation: async () => {
    const response = await api.get('/customer/restaurant/location');
    return response.data;
  },
};


