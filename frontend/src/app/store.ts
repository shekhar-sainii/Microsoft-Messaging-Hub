import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        auth: authReducer,
        // RTK Query base reducer
        [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
