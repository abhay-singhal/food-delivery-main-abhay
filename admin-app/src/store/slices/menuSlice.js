import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {menuService} from '../../services/menuService';

export const fetchCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (_, {rejectWithValue}) => {
    try {
      const response = await menuService.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch categories'
      );
    }
  }
);

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (_, {rejectWithValue}) => {
    try {
      const response = await menuService.getMenuItems();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch menu items'
      );
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async (item, {rejectWithValue}) => {
    try {
      const response = await menuService.createMenuItem(item);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create menu item'
      );
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({itemId, item}, {rejectWithValue}) => {
    try {
      const response = await menuService.updateMenuItem(itemId, item);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update menu item'
      );
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async (itemId, {rejectWithValue}) => {
    try {
      await menuService.deleteMenuItem(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete menu item'
      );
    }
  }
);

export const toggleMenuItemStatus = createAsyncThunk(
  'menu/toggleMenuItemStatus',
  async ({itemId, status}, {rejectWithValue}) => {
    try {
      const response = await menuService.updateMenuItemStatus(itemId, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update menu item status'
      );
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    categories: [],
    items: [],
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
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(toggleMenuItemStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const {clearError} = menuSlice.actions;
export default menuSlice.reducer;


