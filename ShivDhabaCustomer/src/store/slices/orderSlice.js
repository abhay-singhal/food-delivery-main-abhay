import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {orderService} from '../../services/orderService';

const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async (orderData, {rejectWithValue}) => {
    try {
      console.log('Placing order with data:', JSON.stringify(orderData, null, 2));
      const response = await orderService.placeOrder(orderData);
      console.log('Order service response:', JSON.stringify(response, null, 2));
      
      // Backend returns ApiResponse: {success, message, data: {order: {...}}}
      // Return the entire ApiResponse so CheckoutScreen can access result.success, result.data.order, etc.
      return response.data;
    } catch (error) {
      console.error('Place order thunk error:', error);
      console.error('Error response:', error.response?.data);
      
      // Extract detailed error message
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Failed to place order';
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMyOrders',
  async (_, {rejectWithValue}) => {
    try {
      const response = await orderService.getMyOrders();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder: state => {
      state.currentOrder = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(placeOrder.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns: {success: true, message: "...", data: {order: {...}}}
        // Store the order object, not the entire ApiResponse
        const order = action.payload?.data?.order || action.payload?.data || action.payload;
        state.currentOrder = order;
        if (order) {
          state.orders.unshift(order);
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      });
  },
});

export const {setCurrentOrder, clearCurrentOrder} = orderSlice.actions;
export default orderSlice.reducer;


