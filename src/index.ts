import { PaCOptions, SyncResult, PullResult, Config, GenerateOptions } from './types.js';
import { pricesAsCode, pullFromProviders, loadEnvironment, generateTemplate } from './core.js';

/**
 * Prices as Code (PaC) - Main entry point
 * Synchronize products and prices defined in TypeScript or YAML to multiple providers
 */
export async function pac(options: Partial<PaCOptions> = {}): Promise<SyncResult> {
  return pricesAsCode(options);
}

/**
 * Prices as Code (PaC) - Pull mode entry point
 * Pull products and prices from providers into a local configuration file
 */
export async function pull(options: Partial<PaCOptions> = {}): Promise<PullResult> {
  const resolvedOptions = loadEnvironment(options);
  return pullFromProviders(resolvedOptions);
}

/**
 * Prices as Code (PaC) - Generate mode entry point
 * Generate a template pricing structure
 */
export async function generate(options: Partial<GenerateOptions>): Promise<Config> {
  return generateTemplate(options);
}

// Export types and utilities
export * from './types.js';
export * from './loader.js';
export * from './core.js';
export * from './providers/index.js';

// Extend pac with additional functions
pac.pull = pull;
pac.generate = generate;
pac.pullFromProviders = pullFromProviders;
pac.loadEnvironment = loadEnvironment;
pac.generateTemplate = generateTemplate;

// Default export
export default pac;