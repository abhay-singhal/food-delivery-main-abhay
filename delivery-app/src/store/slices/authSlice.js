import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {authService} from '../../services/authService';
import notificationService from '../../services/notificationService';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (mobileNumber, {rejectWithValue}) => {
    try {
      const response = await authService.sendOtp(mobileNumber);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({mobileNumber, otp}, {rejectWithValue}) => {
    try {
      const response = await authService.verifyOtp(mobileNumber, otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Invalid OTP');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  // Cleanup notifications when delivery boy logs out
  try {
    await notificationService.cleanup();
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreSession: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(sendOtp.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        
        // Initialize notifications when delivery boy logs in (async, don't await)
        notificationService.initialize().catch(error => {
          console.error('Error initializing notifications:', error);
        });
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;

