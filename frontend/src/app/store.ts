import { configureStore } from '@reduxjs/toolkit';
import { teamsApi } from './api/teamsApi';
import { messagesApi } from './api/messagesApi';
import { schedulerApi } from './api/schedulerApi';
import { templatesApi } from './api/templatesApi';
import { analyticsApi } from './api/analyticsApi';
import { webhooksApi } from './api/webhooksApi';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        auth: authReducer,
        // RTK Query reducers
        [teamsApi.reducerPath]: teamsApi.reducer,
        [messagesApi.reducerPath]: messagesApi.reducer,
        [schedulerApi.reducerPath]: schedulerApi.reducer,
        [templatesApi.reducerPath]: templatesApi.reducer,
        [analyticsApi.reducerPath]: analyticsApi.reducer,
        [webhooksApi.reducerPath]: webhooksApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            teamsApi.middleware,
            messagesApi.middleware,
            schedulerApi.middleware,
            templatesApi.middleware,
            analyticsApi.middleware,
            webhooksApi.middleware,
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
