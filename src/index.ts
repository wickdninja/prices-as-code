import path from 'path';
import dotenv from 'dotenv';
import { StripePacOptions, SyncResult } from './types';
import { loadYamlConfig, saveYamlConfig } from './loader';
import { initializeStripe, syncStripe } from './core';

/**
 * StripePaC - Prices as Code for Stripe
 * Synchronize products and prices defined in YAML to Stripe
 */
export async function stripePaC(options: StripePacOptions = {}): Promise<SyncResult> {
  try {
    // Initialize environment if needed
    if (!options.stripeSecretKey) {
      const envPath = path.resolve(process.cwd(), '.env');
      console.log(`🔧 Loading environment from ${envPath}`);
      dotenv.config({ path: envPath });
    }

    // Initialize Stripe client
    const stripe = initializeStripe(options);

    // Load configuration from YAML
    const configPath = options.configPath || path.resolve(process.cwd(), 'prices.yml');
    console.log(`📝 Loading configuration from ${configPath}`);
    const config = loadYamlConfig(configPath);

    // Sync to Stripe
    const result = await syncStripe(stripe, config);

    // Save updated configuration with Stripe IDs if needed
    if (result.configUpdated) {
      saveYamlConfig(configPath, result.config);
    }

    console.log(
      "✨ Stripe sync completed successfully",
      result.configUpdated ? "with updates" : "without updates"
    );
    
    return result;
  } catch (error) {
    console.error("❌ Synchronization failed:", error);
    throw error;
  }
}

// Export types and utilities
export * from './types';
export * from './loader';
export * from './core';

// Default export
export default stripePaC;