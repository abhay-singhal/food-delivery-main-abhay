import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {configService} from '../../services/configService';

export const fetchConfig = createAsyncThunk(
  'config/fetchConfig',
  async (_, {rejectWithValue}) => {
    try {
      const response = await configService.getConfig();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch config'
      );
    }
  }
);

export const updateConfig = createAsyncThunk(
  'config/updateConfig',
  async ({key, value, description}, {rejectWithValue}) => {
    try {
      const response = await configService.updateConfig(key, value, description);
      return {key, value, ...response.data};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update config'
      );
    }
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState: {
    config: {},
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
      .addCase(fetchConfig.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
      })
      .addCase(fetchConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateConfig.fulfilled, (state, action) => {
        state.config[action.payload.key] = action.payload.value;
      });
  },
});

export const {clearError} = configSlice.actions;
export default configSlice.reducer;


