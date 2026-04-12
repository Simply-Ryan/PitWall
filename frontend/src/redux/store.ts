import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import telemetryReducer from './slices/telemetrySlice';
import sessionReducer from './slices/sessionSlice';
import uiReducer from './slices/uiSlice';
import fuelStrategyReducer from './slices/fuelStrategySlice';
import strategyReducer from './slices/strategySlice';

/**
 * Redux store configuration
 * 
 * Combines all reducers and configures Redux Toolkit
 * with thunk middleware and default settings
 */
export const store = configureStore({
  reducer: {
    telemetry: telemetryReducer,
    session: sessionReducer,
    ui: uiReducer,
    fuelStrategy: fuelStrategyReducer,
    strategy: strategyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore WebSocket connections in serialization check
        ignoredActions: ['telemetry/connectionEstablished', 'telemetry/connectionClosed'],
        ignoredPaths: ['telemetry.connection'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use throughout app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
