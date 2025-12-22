import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {authService} from '../../services/authService';

export const login = createAsyncThunk(
  'auth/login',
  async ({username, password}, {rejectWithValue}) => {
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Login failed');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, {rejectWithValue}) => {
    try {
      const user = await authService.getStoredUser();
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated && user) {
        return user;
      }
      return rejectWithValue('Not authenticated');
    } catch (error) {
      return rejectWithValue('Not authenticated');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
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
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const {clearError} = authSlice.actions;
export default authSlice.reducer;


