import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {deliveryBoyService} from '../../services/deliveryBoyService';

export const fetchDeliveryBoys = createAsyncThunk(
  'deliveryBoy/fetchDeliveryBoys',
  async (_, {rejectWithValue}) => {
    try {
      const response = await deliveryBoyService.getAllDeliveryBoys();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch delivery boys'
      );
    }
  }
);

export const createDeliveryBoy = createAsyncThunk(
  'deliveryBoy/createDeliveryBoy',
  async (deliveryBoy, {rejectWithValue}) => {
    try {
      const response = await deliveryBoyService.createDeliveryBoy(deliveryBoy);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create delivery boy'
      );
    }
  }
);

export const updateDeliveryBoy = createAsyncThunk(
  'deliveryBoy/updateDeliveryBoy',
  async ({id, updates}, {rejectWithValue}) => {
    try {
      const response = await deliveryBoyService.updateDeliveryBoy(id, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update delivery boy'
      );
    }
  }
);

export const updateDeliveryBoyStatus = createAsyncThunk(
  'deliveryBoy/updateDeliveryBoyStatus',
  async ({id, isActive, isAvailable, isOnDuty}, {rejectWithValue}) => {
    try {
      const response = await deliveryBoyService.updateDeliveryBoyStatus(
        id,
        isActive,
        isAvailable,
        isOnDuty
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update delivery boy status'
      );
    }
  }
);

const deliveryBoySlice = createSlice({
  name: 'deliveryBoy',
  initialState: {
    deliveryBoys: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryBoys.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDeliveryBoys.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deliveryBoys = action.payload;
      })
      .addCase(fetchDeliveryBoys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createDeliveryBoy.fulfilled, (state, action) => {
        state.deliveryBoys.push(action.payload);
      })
      .addCase(updateDeliveryBoy.fulfilled, (state, action) => {
        const index = state.deliveryBoys.findIndex(
          (db) => db.id === action.payload.id
        );
        if (index !== -1) {
          state.deliveryBoys[index] = action.payload;
        }
      })
      .addCase(updateDeliveryBoyStatus.fulfilled, (state, action) => {
        const index = state.deliveryBoys.findIndex(
          (db) => db.id === action.payload.id
        );
        if (index !== -1) {
          state.deliveryBoys[index] = {
            ...state.deliveryBoys[index],
            ...action.payload,
          };
        }
      });
  },
});

export const {clearError} = deliveryBoySlice.actions;
export default deliveryBoySlice.reducer;

