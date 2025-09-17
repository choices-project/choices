/**
 * Differential Privacy Module
 * 
 * This module provides differential privacy functionality.
 */

export type DifferentialPrivacyConfig = {
  epsilon: number; // Privacy parameter
  delta: number;   // Failure probability
  sensitivity: number; // Global sensitivity
}

export type NoisyResult = {
  value: number;
  noise: number;
  privacy: DifferentialPrivacyConfig;
}

export class DifferentialPrivacyManager {
  private config: DifferentialPrivacyConfig;

  constructor(config: DifferentialPrivacyConfig) {
    this.config = config;
  }

  /**
   * Add Laplace noise to a numeric value
   */
  addLaplaceNoise(value: number): NoisyResult {
    const scale = this.config.sensitivity / this.config.epsilon;
    const noise = this.laplaceRandom(scale);
    
    return {
      value: value + noise,
      noise,
      privacy: this.config
    };
  }

  /**
   * Add Gaussian noise to a numeric value
   */
  addGaussianNoise(value: number): NoisyResult {
    const sigma = Math.sqrt(2 * Math.log(1.25 / this.config.delta)) * this.config.sensitivity / this.config.epsilon;
    const noise = this.gaussianRandom(0, sigma);
    
    return {
      value: value + noise,
      noise,
      privacy: this.config
    };
  }

  /**
   * Generate a random number from Laplace distribution
   */
  private laplaceRandom(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Generate a random number from Gaussian distribution (Box-Muller transform)
   */
  private gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  /**
   * Calculate privacy budget remaining
   */
  calculatePrivacyBudget(usedEpsilon: number): number {
    return Math.max(0, this.config.epsilon - usedEpsilon);
  }

  /**
   * Check if a query is within privacy budget
   */
  isWithinBudget(queryEpsilon: number): boolean {
    return queryEpsilon <= this.config.epsilon;
  }
}

// Default configurations for different privacy levels
export const PRIVACY_CONFIGS = {
  LOW: {
    epsilon: 1.0,
    delta: 1e-5,
    sensitivity: 1.0
  },
  MEDIUM: {
    epsilon: 0.5,
    delta: 1e-6,
    sensitivity: 1.0
  },
  HIGH: {
    epsilon: 0.1,
    delta: 1e-7,
    sensitivity: 1.0
  }
} as const;

// Utility functions
export function createDifferentialPrivacyManager(level: keyof typeof PRIVACY_CONFIGS): DifferentialPrivacyManager {
  return new DifferentialPrivacyManager(PRIVACY_CONFIGS[level]);
}

export function addNoiseToCount(count: number, config: DifferentialPrivacyConfig): NoisyResult {
  const manager = new DifferentialPrivacyManager(config);
  return manager.addLaplaceNoise(count);
}

export function addNoiseToAverage(average: number, count: number, config: DifferentialPrivacyConfig): NoisyResult {
  // For averages, we need to consider the sensitivity based on the count
  const adjustedConfig = {
    ...config,
    sensitivity: config.sensitivity / count
  };
  const manager = new DifferentialPrivacyManager(adjustedConfig);
  return manager.addGaussianNoise(average);
}

// Privacy Budget Manager class
export class PrivacyBudgetManager {
  private budget: number;
  private used: number;

  constructor(initialBudget: number = 1.0) {
    this.budget = initialBudget;
    this.used = 0;
  }

  getBudget(): number {
    return this.budget - this.used;
  }

  useBudget(amount: number): boolean {
    if (this.used + amount <= this.budget) {
      this.used += amount;
      return true;
    }
    return false;
  }

  reset(): void {
    this.used = 0;
  }
}

// Private Analytics class
export class PrivateAnalytics {
  private privacyManager: DifferentialPrivacyManager;

  constructor(config: DifferentialPrivacyConfig = PRIVACY_CONFIGS.MEDIUM) {
    this.privacyManager = new DifferentialPrivacyManager(config);
  }

  getPrivateCount(count: number): NoisyResult {
    return this.privacyManager.addLaplaceNoise(count);
  }

  getPrivateAverage(average: number, count: number): NoisyResult {
    return addNoiseToAverage(average, count, this.privacyManager['config']);
  }
}

// Export default instances
export const privacyBudgetManager = new PrivacyBudgetManager();
export const privateAnalytics = new PrivateAnalytics();


