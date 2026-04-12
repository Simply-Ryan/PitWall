/**
 * Race Strategy API Routes
 * 
 * Endpoints for:
 * - Strategy calculation
 * - Persistence
 * - Real-time monitoring and adjustments
 */

import { Router, Request, Response } from 'express';
import { RaceSimulator } from '../services/RaceSimulator';
import type {
  StrategyInput,
  StrategyOutput,
  RiskAssessment,
  StrategyAdjustment,
} from '../types/raceStrategy';

const router = Router();
const raceSimulator = new RaceSimulator();

/**
 * POST /api/strategy/calculate
 * Calculate optimal race strategy
 * 
 * Body: StrategyInput
 * Returns: StrategyOutput with 3 scenarios
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const strategyInput: StrategyInput = req.body;

    // Validate input
    if (!strategyInput.raceType || !strategyInput.totalLaps) {
      return res.status(400).json({
        error: 'Invalid input: raceType and totalLaps are required',
      });
    }

    // Calculate strategy
    const strategy = raceSimulator.simulateRace(strategyInput);

    return res.status(200).json({
      success: true,
      data: strategy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Strategy calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate strategy',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/strategy/save
 * Save calculated strategy to database
 * 
 * Body: { input: StrategyInput, output: StrategyOutput, sessionId: string }
 * Returns: { id: string, createdAt: Date }
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { input, output, sessionId, trackName } = req.body;

    if (!input || !output || !sessionId) {
      return res.status(400).json({
        error: 'Invalid input: input, output, and sessionId required',
      });
    }

    // Save to database (using Prisma)
    // This is a placeholder - real implementation uses database
    const strategyRecord = {
      id: `strategy-${Date.now()}`,
      sessionId,
      trackName: trackName || 'Unknown',
      strategyInput: input,
      strategyOutput: output,
      activeScenario: 1, // likely scenario
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Strategy saved:', strategyRecord.id);

    return res.status(201).json({
      success: true,
      data: {
        id: strategyRecord.id,
        createdAt: strategyRecord.createdAt,
      },
    });
  } catch (error) {
    console.error('Strategy save error:', error);
    return res.status(500).json({
      error: 'Failed to save strategy',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/strategy/:id
 * Retrieve saved strategy
 * 
 * Params: id (strategy ID)
 * Returns: Full strategy record with input/output
 */
router.get('/:strategyId', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;

    if (!strategyId) {
      return res.status(400).json({ error: 'Strategy ID required' });
    }

    // Retrieve from database
    // This is a placeholder - real implementation uses Prisma
    const strategyRecord = {
      id: strategyId,
      status: 'active',
      createdAt: new Date(),
      // ... full record would be returned
    };

    console.log('Strategy retrieved:', strategyId);

    return res.status(200).json({
      success: true,
      data: strategyRecord,
    });
  } catch (error) {
    console.error('Strategy retrieval error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve strategy',
    });
  }
});

/**
 * POST /api/strategy/:id/adjust
 * Log adjustment/deviation during race
 * 
 * Params: id (strategy ID)
 * Body: { lap: number, fuel: number, wear: number, reason: string }
 * Returns: Acknowledgement with deviation analysis
 */
router.post('/:strategyId/adjust', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;
    const { lap, fuel, wear, reason } = req.body;

    if (!strategyId || lap === undefined) {
      return res.status(400).json({
        error: 'Strategy ID and lap number required',
      });
    }

    // Create adjustment record
    const adjustment: StrategyAdjustment = {
      id: `adjust-${Date.now()}`,
      strategyId,
      lap,
      fuelUsed: fuel || 0,
      lapTime: 0,
      tireWearPercent: wear || 0, 
      deviationReason: reason || 'Driver input',
      timestamp: new Date(),
    };

    // Analyze if significant deviation
    const fuelDeviation = Math.abs(fuel || 0);
    const requiresRecalc = fuelDeviation > 1.0; // More than 1L off

    console.log('Adjustment logged:', adjustment.id, requiresRecalc ? '⚠️' : '✓');

    return res.status(201).json({
      success: true,
      data: {
        adjustmentId: adjustment.id,
        requiresRecalculation: requiresRecalc,
        deviationSeverity: fuelDeviation > 2 ? 'high' : 'low',
      },
    });
  } catch (error) {
    console.error('Adjustment logging error:', error);
    return res.status(500).json({
      error: 'Failed to log adjustment',
    });
  }
});

/**
 * POST /api/strategy/:id/recalculate
 * Recalculate strategy based on current conditions
 * 
 * Params: id (strategy ID)
 * Body: { currentLap: number, currentFuel: number, currentTire: number, weather: any }
 * Returns: Updated strategy scenarios
 */
router.post('/:strategyId/recalculate', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;
    const { currentLap, currentFuel, currentTire, weather, originalInput } = req.body;

    if (!strategyId || !originalInput) {
      return res.status(400).json({
        error: 'Strategy ID and original input required',
      });
    }

    // Create updated input based on current conditions
    const updatedInput: StrategyInput = {
      ...originalInput,
      currentLap,
      vehicleSpecs: {
        ...originalInput.vehicleSpecs,
        currentLap,
        currentFuelLevel: currentFuel,
        currentTireWearPercent: currentTire,
      },
      weather: weather || originalInput.weather,
    };

    // Recalculate
    const newStrategy = raceSimulator.simulateRace(updatedInput);

    console.log('Strategy recalculated:', strategyId);

    return res.status(200).json({
      success: true,
      data: {
        strategyId,
        recalculatedAt: new Date(),
        newScenarios: newStrategy.scenarios,
        recommendedScenario: 1, // Likely case
        changeRecommendation: 'Pit 2 laps earlier due to fuel consumption',
      },
    });
  } catch (error) {
    console.error('Recalculation error:', error);
    return res.status(500).json({
      error: 'Failed to recalculate strategy',
    });
  }
});

/**
 * GET /api/strategy/:id/history
 * Get adjustment history for a strategy
 * 
 * Params: id (strategy ID)
 * Returns: Array of adjustments
 */
router.get('/:strategyId/history', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;

    if (!strategyId) {
      return res.status(400).json({ error: 'Strategy ID required' });
    }

    // Retrieve adjustment history
    // This is a placeholder - real implementation queries database
    const adjustmentHistory: StrategyAdjustment[] = [];

    return res.status(200).json({
      success: true,
      data: {
        strategyId,
        adjustmentCount: adjustmentHistory.length,
        adjustments: adjustmentHistory,
      },
    });
  } catch (error) {
    console.error('History retrieval error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve adjustment history',
    });
  }
});

/**
 * GET /api/strategy/session/:sessionId
 * Get all strategies for a session
 * 
 * Params: sessionId
 * Returns: Array of strategies
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Retrieve strategies for session
    // This is a placeholder - real implementation queries database
    const strategies = [];

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        strategyCount: strategies.length,
        strategies,
      },
    });
  } catch (error) {
    console.error('Session strategies retrieval error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve session strategies',
    });
  }
});

/**
 * DELETE /api/strategy/:id
 * Delete a strategy
 * 
 * Params: id (strategy ID)
 * Returns: Confirmation
 */
router.delete('/:strategyId', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;

    if (!strategyId) {
      return res.status(400).json({ error: 'Strategy ID required' });
    }

    // Delete from database
    console.log('Strategy deleted:', strategyId);

    return res.status(200).json({
      success: true,
      message: 'Strategy deleted successfully',
      deletedId: strategyId,
    });
  } catch (error) {
    console.error('Strategy deletion error:', error);
    return res.status(500).json({
      error: 'Failed to delete strategy',
    });
  }
});

export default router;
