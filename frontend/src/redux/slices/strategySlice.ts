/**
 * Redux Slice for Race Strategy State Management
 * 
 * Manages active strategy, calculation state, adjustments, and UI state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  RaceStrategy,
  StrategyOutput,
  StrategyAdjustment,
  StrategyState,
} from '@types/raceStrategy';

const initialState: StrategyState = {
  activeStrategy: null,
  scenarios: null,
  isCalculating: false,
  error: null,
  adjustments: [],
  lastRecalcAt: null,
};

export const strategySlice = createSlice({
  name: 'strategy',
  initialState,
  reducers: {
    // Set active strategy
    setActiveStrategy: (state, action: PayloadAction<RaceStrategy>) => {
      state.activeStrategy = action.payload;
      state.error = null;
    },

    // Update strategy scenarios (calculation results)
    setScenarios: (state, action: PayloadAction<StrategyOutput>) => {
      state.scenarios = action.payload;
      state.isCalculating = false;
      state.error = null;
      state.lastRecalcAt = Date.now();
    },

    // Set calculation in progress
    setCalculating: (state, action: PayloadAction<boolean>) => {
      state.isCalculating = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isCalculating = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Add adjustment
    addAdjustment: (state, action: PayloadAction<StrategyAdjustment>) => {
      state.adjustments.push(action.payload);
      
      // Track deviation for potential recalc
      if (state.activeStrategy) {
        const deviated =
          Math.abs(action.payload.fuelUsedVsForecast) > 0.5; // >0.5L deviation
        if (deviated) {
          state.error = `Warning: consumption differs from forecast by ${Math.abs(
            action.payload.fuelUsedVsForecast
          ).toFixed(1)}L`;
        }
      }
    },

    // Update active scenario (which of best/likely/worst user wants to execute)
    setActiveScenario: (
      state,
      action: PayloadAction<'best' | 'likely' | 'worst'>
    ) => {
      if (state.activeStrategy) {
        state.activeStrategy.activeScenario = action.payload;
      }
    },

    // Clear strategy (new race)
    clearStrategy: (state) => {
      state.activeStrategy = null;
      state.scenarios = null;
      state.adjustments = [];
      state.error = null;
      state.isCalculating = false;
      state.lastRecalcAt = null;
    },

    // Update strategy status
    setStrategyStatus: (
      state,
      action: PayloadAction<
        'planning' | 'active' | 'executed' | 'completed'
      >
    ) => {
      if (state.activeStrategy) {
        state.activeStrategy.status = action.payload;
        state.activeStrategy.updatedAt = Date.now();
      }
    },

    // Clear adjustments
    clearAdjustments: (state) => {
      state.adjustments = [];
    },
  },
});

export const {
  setActiveStrategy,
  setScenarios,
  setCalculating,
  setError,
  clearError,
  addAdjustment,
  setActiveScenario,
  clearStrategy,
  setStrategyStatus,
  clearAdjustments,
} = strategySlice.actions;

export default strategySlice.reducer;
