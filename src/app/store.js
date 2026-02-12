import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer from '../features/auth/authSlice'
import { apiSlice } from '../features/api/apiSlice'
import { dashboardApi } from '../features/dashboard/dashboardApi'
import { reportsApi } from '../features/reports/reportsApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, dashboardApi.middleware, reportsApi.middleware),
})

setupListeners(store.dispatch)
