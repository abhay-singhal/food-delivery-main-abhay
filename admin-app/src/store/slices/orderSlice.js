import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {orderService} from '../../services/orderService';

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (status, {rejectWithValue}) => {
    try {
      const response = await orderService.getAllOrders(status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'order/fetchOrder',
  async (orderId, {rejectWithValue}) => {
    try {
      const response = await orderService.getOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order'
      );
    }
  }
);

export const acceptOrder = createAsyncThunk(
  'order/acceptOrder',
  async (orderId, {rejectWithValue}) => {
    try {
      const response = await orderService.acceptOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to accept order'
      );
    }
  }
);

export const rejectOrder = createAsyncThunk(
  'order/rejectOrder',
  async (orderId, {rejectWithValue}) => {
    try {
      const response = await orderService.rejectOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reject order'
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({orderId, status}, {rejectWithValue}) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update order status'
      );
    }
  }
);

export const assignOrderToDeliveryBoy = createAsyncThunk(
  'order/assignOrderToDeliveryBoy',
  async ({orderId, deliveryBoyId}, {rejectWithValue}) => {
    try {
      const response = await orderService.assignOrderToDeliveryBoy(
        orderId,
        deliveryBoyId
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to assign order'
      );
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(rejectOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(assignOrderToDeliveryBoy.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      });
  },
});

export const {clearError, clearCurrentOrder} = orderSlice.actions;
export default orderSlice.reducer;


