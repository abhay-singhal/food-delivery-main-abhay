import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {authService} from '../../services/authService';

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
      console.error('Send OTP Error:', error);
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return rejectWithValue('Network error: Please check your internet connection and ensure the backend server is running');
      }
      // Handle HTTP errors
      if (error.response) {
        const message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        return rejectWithValue(message);
      }
      // Handle other errors
      return rejectWithValue(error.message || 'Failed to send OTP. Please try again.');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({mobileNumber, otp}, {rejectWithValue}) => {
    try {
      const response = await authService.verifyOtp(mobileNumber, otp);
      // Return the inner data object (user, accessToken, refreshToken)
      return response.data || response;
    } catch (error) {
      console.error('Verify OTP Error:', error);
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return rejectWithValue('Network error: Please check your internet connection and ensure the backend server is running');
      }
      // Handle HTTP errors
      if (error.response) {
        const message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        return rejectWithValue(message);
      }
      // Handle other errors
      return rejectWithValue(error.message || 'Invalid OTP. Please try again.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    restoreSession: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Send OTP
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
      // Verify OTP
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
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const {clearError, restoreSession, updateUser} = authSlice.actions;
export default authSlice.reducer;


