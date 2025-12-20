import api from '../config/api';

export const paymentService = {
  createRazorpayOrder: async (orderId) => {
    const response = await api.post(`/customer/orders/${orderId}/payment/razorpay/create`);
    return response.data;
  },

  verifyPayment: async (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    // Backend expects query parameters
    const params = new URLSearchParams({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    
    const response = await api.post(
      `/customer/orders/${orderId}/payment/razorpay/verify?${params.toString()}`,
      null
    );
    
    // Backend returns ApiResponse: {success: true, message: "...", data: PaymentResponse}
    // Return the entire ApiResponse
    return response.data;
  },
};


