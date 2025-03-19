import { PaCOptions, SyncResult } from './types.js';
import { pricesAsCode } from './core.js';

/**
 * Prices as Code (PaC) - Main entry point
 * Synchronize products and prices defined in TypeScript or YAML to multiple providers
 */
export async function pac(options: Partial<PaCOptions> = {}): Promise<SyncResult> {
  return pricesAsCode(options);
}

// Export types and utilities
export * from './types.js';
export * from './loader.js';
export * from './core.js';
export * from './providers/index.js';

// Default export
export default pac;