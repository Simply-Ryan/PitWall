/**
 * Strategy Optimizer
 * 
 * ML-based optimization for pit sequences using:
 * - Historical data analysis
 * - Genetic algorithm for sequence optimization
 * - Simulated annealing for fine-tuning
 */

export interface OptimizationResult {
  originalPitSequence: number[]; // Original pit laps
  optimizedPitSequence: number[]; // Optimized pit laps
  estimatedTimeSaved: number; // seconds
  confidenceScore: number; // 0-100
  reasoning: string[];
}

export interface HistoricalRaceData {
  raceData: Array<{
    trackName: string;
    fuelConsumption: number;
    tireWear: number;
    pitstops: number[];
    finalTime: number;
    weatherCondition: string;
  }>;
}

export class StrategyOptimizer {
  private historicalData: HistoricalRaceData;
  private populationSize: number = 20;
  private generationCount: number = 50;
  private mutationRate: number = 0.1;

  constructor(historicalData?: HistoricalRaceData) {
    this.historicalData = historicalData || { raceData: [] };
  }

  /**
   * Optimize pit sequence using genetic algorithm
   */
  optimizePitSequence(
    currentSequence: number[],
    totalLaps: number,
    constraints: {
      fuelCapacity: number;
      fuelPerLap: number;
      tireLife: number;
      safetyMargin: number;
    },
  ): OptimizationResult {
    const population = this.initializePopulation(
      currentSequence,
      totalLaps,
      constraints,
    );

    let bestSolution = population[0];
    let bestFitness = this.calculateFitness(bestSolution, constraints);

    const reasoning: string[] = [];

    // Genetic algorithm loop
    for (let gen = 0; gen < this.generationCount; gen++) {
      const nextPopulation = [];

      // Elitism: keep best 2
      nextPopulation.push(bestSolution);

      // Generate new population
      while (nextPopulation.length < this.populationSize) {
        const parent1 = this.selectParent(population, constraints);
        const parent2 = this.selectParent(population, constraints);

        let child: number[];
        if (Math.random() < 0.7) {
          child = this.crossover(parent1, parent2);
        } else {
          child = [...parent1];
        }

        if (Math.random() < this.mutationRate) {
          child = this.mutate(child, totalLaps, constraints);
        }

        // Only add if valid
        if (this.isValidSequence(child, constraints)) {
          nextPopulation.push(child);
        }
      }

      population.length = 0;
      population.push(...nextPopulation.slice(0, this.populationSize));

      // Find best in this generation
      for (const solution of population) {
        const fitness = this.calculateFitness(solution, constraints);
        if (fitness > bestFitness) {
          bestFitness = fitness;
          bestSolution = solution;
          reasoning.push(`Generation ${gen}: Found better sequence with fitness ${fitness.toFixed(2)}`);
        }
      }
    }

    // Simulated annealing for fine-tuning
    bestSolution = this.simulatedAnnealing(bestSolution, totalLaps, constraints);

    // Calculate time saved
    const timeSaved = this.estimateTimeSavings(currentSequence, bestSolution);
    const confidenceScore = Math.min(100, bestFitness * 10);

    return {
      originalPitSequence: currentSequence,
      optimizedPitSequence: bestSolution,
      estimatedTimeSaved: timeSaved,
      confidenceScore,
      reasoning,
    };
  }

  /**
   * Initialize population with valid pit sequences
   */
  private initializePopulation(
    currentSequence: number[],
    totalLaps: number,
    constraints: any,
  ): number[][] {
    const population: number[][] = [];

    // Add current sequence as baseline
    population.push([...currentSequence]);

    // Generate random valid sequences
    while (population.length < this.populationSize) {
      const sequence = this.generateRandomSequence(totalLaps, constraints);
      if (this.isValidSequence(sequence, constraints)) {
        population.push(sequence);
      }
    }

    return population;
  }

  /**
   * Generate random pit sequence
   */
  private generateRandomSequence(totalLaps: number, constraints: any): number[] {
    const sequence: number[] = [];
    let currentFuel = constraints.fuelCapacity;
    let currentLap = 1;

    while (currentLap < totalLaps) {
      const lapsRemaining = totalLaps - currentLap;
      const lapsUntilEmpty =
        (currentFuel - constraints.safetyMargin) / constraints.fuelPerLap;

      if (lapsUntilEmpty < lapsRemaining * 0.7) {
        // Need to pit soon
        const pitLap = currentLap + Math.floor(lapsUntilEmpty * 0.8);
        sequence.push(pitLap);
        currentFuel = constraints.fuelCapacity;
        currentLap = pitLap + 1;
      } else {
        break;
      }
    }

    return sequence.length > 0 ? sequence : [Math.floor(totalLaps / 2)];
  }

  /**
   * Calculate fitness score (0-1)
   */
  private calculateFitness(sequence: number[], constraints: any): number {
    let fitness = 1.0;

    // Penalize too many pit stops
    fitness *= Math.pow(0.95, sequence.length);

    // Reward balanced spacing
    const spacing = this.calculateSpacing(sequence);
    const avgSpacing = sequence.length > 0 ? spacing / sequence.length : 0;
    fitness *= 1.0 / (1.0 + Math.abs(avgSpacing - 30));

    // Reward safety margins
    let minMargin = Infinity;
    let currentFuel = constraints.fuelCapacity;
    let currentLap = 1;

    for (const pitLap of sequence) {
      const fuelUsed = (pitLap - currentLap) * constraints.fuelPerLap;
      const margin = currentFuel - fuelUsed;
      minMargin = Math.min(minMargin, margin);
      currentFuel = constraints.fuelCapacity - fuelUsed;
      currentLap = pitLap + 1;
    }

    if (minMargin >= constraints.safetyMargin) {
      fitness *= 1.2;
    } else if (minMargin < 0) {
      fitness *= 0.1;
    }

    return Math.max(0, Math.min(1, fitness));
  }

  /**
   * Calculate spacing between pit stops
   */
  private calculateSpacing(sequence: number[]): number {
    if (sequence.length < 2) return 0;
    let totalSpacing = 0;
    for (let i = 1; i < sequence.length; i++) {
      totalSpacing += sequence[i] - sequence[i - 1];
    }
    return totalSpacing;
  }

  /**
   * Crossover: combine two pit sequences
   */
  private crossover(parent1: number[], parent2: number[]): number[] {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    return [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
  }

  /**
   * Mutate: randomly adjust pit sequence
   */
  private mutate(sequence: number[], totalLaps: number, constraints: any): number[] {
    const mutated = [...sequence];
    const mutationType = Math.random();

    if (mutationType < 0.4 && mutated.length > 1) {
      // Remove a pit stop
      mutated.splice(Math.floor(Math.random() * mutated.length), 1);
    } else if (mutationType < 0.7) {
      // Shift a pit stop by ±5 laps
      const idx = Math.floor(Math.random() * mutated.length);
      const shift = Math.floor((Math.random() - 0.5) * 10);
      const newLap = Math.max(1, Math.min(totalLaps - 1, mutated[idx] + shift));
      mutated[idx] = newLap;
      mutated.sort((a, b) => a - b);
    } else {
      // Add a pit stop
      const newPitLap = Math.floor(Math.random() * totalLaps);
      mutated.push(newPitLap);
      mutated.sort((a, b) => a - b);
    }

    return mutated;
  }

  /**
   * Select parent using tournament selection
   */
  private selectParent(population: number[][], constraints: any): number[] {
    const tournamentSize = Math.min(3, population.length);
    let best = population[0];
    let bestFitness = this.calculateFitness(best, constraints);

    for (let i = 1; i < tournamentSize; i++) {
      const candidate =
        population[Math.floor(Math.random() * population.length)];
      const fitness = this.calculateFitness(candidate, constraints);
      if (fitness > bestFitness) {
        best = candidate;
        bestFitness = fitness;
      }
    }

    return best;
  }

  /**
   * Simulated annealing for fine-tuning
   */
  private simulatedAnnealing(
    sequence: number[],
    totalLaps: number,
    constraints: any,
  ): number[] {
    let current = [...sequence];
    let best = [...current];
    let bestFitness = this.calculateFitness(best, constraints);
    let temperature = 1.0;

    for (let i = 0; i < 100; i++) {
      const neighbor = this.mutate(current, totalLaps, constraints);
      const currentFitness = this.calculateFitness(current, constraints);
      const neighborFitness = this.calculateFitness(neighbor, constraints);

      if (neighborFitness > currentFitness) {
        current = neighbor;
      } else if (Math.random() < Math.exp((neighborFitness - currentFitness) / temperature)) {
        current = neighbor;
      }

      if (neighborFitness > bestFitness) {
        best = neighbor;
        bestFitness = neighborFitness;
      }

      temperature *= 0.95;
    }

    return best;
  }

  /**
   * Validate pit sequence
   */
  private isValidSequence(sequence: number[], constraints: any): boolean {
    if (sequence.length === 0) return true;

    // Check fuel feasibility
    let currentFuel = constraints.fuelCapacity;
    let currentLap = 1;

    for (const pitLap of sequence) {
      if (pitLap <= currentLap) return false;
      const fuelNeeded = (pitLap - currentLap) * constraints.fuelPerLap;
      if (fuelNeeded > currentFuel) return false;

      currentFuel = constraints.fuelCapacity;
      currentLap = pitLap + 1;
    }

    return true;
  }

  /**
   * Estimate time savings
   */
  private estimateTimeSavings(original: number[], optimized: number[]): number {
    const stopDifference = optimized.length - original.length;
    const secondsPerStop = 45; // Average pit stop time
    return stopDifference * secondsPerStop;
  }
}
