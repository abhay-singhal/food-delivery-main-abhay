import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {orderService} from '../../services/orderService';

const initialState = {
  availableOrders: [],
  myOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

export const fetchAvailableOrders = createAsyncThunk(
  'order/fetchAvailableOrders',
  async (_, {rejectWithValue}) => {
    try {
      const response = await orderService.getAvailableOrders();
      // Backend returns ApiResponse { success, message, data: [orders] }
      // response.data is the ApiResponse, response.data.data is the array
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  }
);

export const acceptOrder = createAsyncThunk(
  'order/acceptOrder',
  async (orderId, {rejectWithValue}) => {
    try {
      const response = await orderService.acceptOrder(orderId);
      // Backend returns ApiResponse { success, message, data: order }
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to accept order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMyOrders',
  async (_, {rejectWithValue}) => {
    try {
      const response = await orderService.getMyOrders();
      // Backend returns ApiResponse { success, message, data: [orders] }
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  }
);

export const markDelivered = createAsyncThunk(
  'order/markDelivered',
  async (orderId, {rejectWithValue}) => {
    try {
      const response = await orderService.markDelivered(orderId);
      // Backend returns ApiResponse { success, message, data: order }
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark as delivered');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAvailableOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        // Ensure payload is always an array
        state.availableOrders = Array.isArray(action.payload) ? action.payload : [];
        console.log('✅ Available orders set:', state.availableOrders.length);
      })
      .addCase(fetchAvailableOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        state.availableOrders = state.availableOrders.filter(order => order.id !== action.payload.id);
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        // Ensure payload is always an array
        state.myOrders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(markDelivered.fulfilled, (state, action) => {
        const order = action.payload;
        state.myOrders = state.myOrders.map(o => o.id === order.id ? order : o);
        if (state.currentOrder?.id === order.id) {
          state.currentOrder = order;
        }
      });
  },
});

export default orderSlice.reducer;

