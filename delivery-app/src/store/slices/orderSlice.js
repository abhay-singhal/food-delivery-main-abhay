import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {orderService} from '../../services/orderService';

const initialState = {
  availableOrders: [], // Unassigned orders (for accepting)
  pickUpOrders: [], // Orders assigned but not yet active (READY status, assigned to delivery partner)
  activeOrder: null, // Currently active order (OUT_FOR_DELIVERY status) - only one at a time
  orderHistory: [], // Completed orders (DELIVERED status)
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

// Fetch pick-up orders (assigned but not yet active - status READY)
export const fetchPickUpOrders = createAsyncThunk(
  'order/fetchPickUpOrders',
  async (_, {rejectWithValue}) => {
    try {
      const response = await orderService.getMyOrders();
      const orders = response.data?.data || response.data || [];
      // Filter orders that are assigned to this delivery partner and status is READY (waiting to be picked up)
      // Orders are already filtered by backend to only show orders assigned to current user
      return orders.filter(order => order.status === 'READY');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch pick-up orders');
    }
  }
);

// Fetch active order (status OUT_FOR_DELIVERY - only one at a time)
export const fetchActiveOrder = createAsyncThunk(
  'order/fetchActiveOrder',
  async (_, {rejectWithValue}) => {
    try {
      const response = await orderService.getMyOrders();
      const orders = response.data?.data || response.data || [];
      // Find the order with status OUT_FOR_DELIVERY (should be only one)
      const activeOrder = orders.find(order => order.status === 'OUT_FOR_DELIVERY');
      return activeOrder || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch active order');
    }
  }
);

// Fetch order history (status DELIVERED)
export const fetchOrderHistory = createAsyncThunk(
  'order/fetchOrderHistory',
  async (_, {rejectWithValue}) => {
    try {
      const response = await orderService.getMyOrders();
      const orders = response.data?.data || response.data || [];
      // Filter orders with status DELIVERED
      return orders.filter(order => order.status === 'DELIVERED');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch order history');
    }
  }
);

// Start order (move from READY to OUT_FOR_DELIVERY)
export const startOrder = createAsyncThunk(
  'order/startOrder',
  async (orderId, {rejectWithValue, getState}) => {
    try {
      const state = getState();
      // Check if there's already an active order
      if (state.order.activeOrder) {
        return rejectWithValue('You already have an active order. Please complete it first.');
      }
      const response = await orderService.startOrder(orderId);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to start order');
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
      .addCase(acceptOrder.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const order = action.payload;
        // Remove from available orders
        state.availableOrders = state.availableOrders.filter(o => o.id !== order.id);
        // Add to pick-up orders if status is READY (should always be READY after accept)
        if (order.status === 'READY') {
          // Check if not already in pick-up orders
          if (!state.pickUpOrders.find(o => o.id === order.id)) {
            state.pickUpOrders = [...state.pickUpOrders, order];
          }
        }
        // Update myOrders
        if (!state.myOrders.find(o => o.id === order.id)) {
          state.myOrders = [...state.myOrders, order];
        }
      })
      .addCase(acceptOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        // Ensure payload is always an array
        state.myOrders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPickUpOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPickUpOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pickUpOrders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPickUpOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchActiveOrder.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Enforce only one active order at a time
        state.activeOrder = action.payload;
      })
      .addCase(fetchActiveOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderHistory.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderHistory = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(startOrder.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const order = action.payload;
        // Remove from pick-up orders
        state.pickUpOrders = state.pickUpOrders.filter(o => o.id !== order.id);
        // Set as active order (enforce only one active order)
        state.activeOrder = order;
        // Update myOrders
        state.myOrders = state.myOrders.map(o => o.id === order.id ? order : o);
      })
      .addCase(startOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markDelivered.fulfilled, (state, action) => {
        const order = action.payload;
        // Update myOrders
        state.myOrders = state.myOrders.map(o => o.id === order.id ? order : o);
        // Remove from active order and add to history
        if (state.activeOrder?.id === order.id) {
          state.activeOrder = null;
          // Add to history if not already there
          if (!state.orderHistory.find(o => o.id === order.id)) {
            state.orderHistory = [order, ...state.orderHistory];
          }
        }
        // Remove from pick-up orders if it was there
        state.pickUpOrders = state.pickUpOrders.filter(o => o.id !== order.id);
      });
  },
});

export default orderSlice.reducer;

