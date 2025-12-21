import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import menuReducer from './slices/menuSlice';
import orderReducer from './slices/orderSlice';
import deliveryBoyReducer from './slices/deliveryBoySlice';
import dashboardReducer from './slices/dashboardSlice';
import configReducer from './slices/configSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    order: orderReducer,
    deliveryBoy: deliveryBoyReducer,
    dashboard: dashboardReducer,
    config: configReducer,
  },
});

