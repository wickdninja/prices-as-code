import {
  Config,
  ConfigSchema,
  PaCOptions,
  SyncResult,
  ProviderOptions
} from './types.js';
import { readConfigFromFile, writeConfigToFile } from './loader.js';
import { initializeProviders } from './providers/index.js';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Load environment variables and validate options
 */
export function loadEnvironment(options?: Partial<PaCOptions>): PaCOptions {
  // Load .env file
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  
  // Default config path
  const configPath = options?.configPath || path.resolve(process.cwd(), 'pricing.ts');
  
  // Auto-detect providers from environment if not specified
  const providers: ProviderOptions[] = options?.providers || [];
  
  if (providers.length === 0) {
    // Try to detect Stripe configuration
    if (process.env.STRIPE_SECRET_KEY) {
      providers.push({
        provider: 'stripe',
        options: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          apiVersion: process.env.STRIPE_API_VERSION
        }
      });
    }
    
    // Recurly support removed from public API
  }
  
  return {
    configPath,
    providers,
    writeBack: options?.writeBack ?? false
  };
}

/**
 * Group configuration by provider
 */
export function groupByProvider(config: Config): Record<string, Config> {
  const result: Record<string, Config> = {};
  
  // Get unique providers from products and prices
  const providers = new Set([
    ...config.products.map(p => p.provider),
    ...config.prices.map(p => p.provider)
  ]);
  
  // Create config for each provider
  for (const provider of providers) {
    result[provider] = {
      products: config.products.filter(p => p.provider === provider),
      prices: config.prices.filter(p => p.provider === provider)
    };
  }
  
  return result;
}

/**
 * Synchronize products and prices with providers
 */
export async function syncProviders(
  config: Config,
  options: PaCOptions
): Promise<SyncResult> {
  console.log('🚀 Starting synchronization with providers...');
  
  try {
    // Initialize providers
    const { providers } = initializeProviders(options.providers);
    let configUpdated = false;
    let updatedProducts = [...config.products];
    let updatedPrices = [...config.prices];
    
    // Sync with each provider
    for (const [providerName, provider] of Object.entries(providers)) {
      console.log(`📌 Syncing with ${providerName}...`);
      
      // Sync products first
      updatedProducts = await provider.syncProducts(updatedProducts);
      
      // Sync prices next
      updatedPrices = await provider.syncPrices(updatedPrices);
      
      // Check if anything was updated
      const productsChanged = JSON.stringify(updatedProducts) !== JSON.stringify(config.products);
      const pricesChanged = JSON.stringify(updatedPrices) !== JSON.stringify(config.prices);
      
      if (productsChanged || pricesChanged) {
        configUpdated = true;
      }
    }
    
    // Create updated config
    const updatedConfig = {
      products: updatedProducts,
      prices: updatedPrices
    };
    
    return {
      config: updatedConfig,
      configUpdated
    };
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    throw error;
  }
}

/**
 * Main entry point for the Prices as Code tool
 */
export async function pricesAsCode(options: Partial<PaCOptions> = {}): Promise<SyncResult> {
  try {
    // Load environment and options
    const resolvedOptions = loadEnvironment(options);
    
    // Validate providers
    if (resolvedOptions.providers.length === 0) {
      throw new Error('No providers configured. Please check environment variables or provide provider options.');
    }
    
    console.log(`📝 Loading configuration from ${resolvedOptions.configPath}`);
    
    // Load configuration
    const config = await readConfigFromFile(resolvedOptions.configPath || '');
    
    // Validate config with Zod
    try {
      const validatedConfig = ConfigSchema.parse(config);
      
      // Sync with providers
      const result = await syncProviders(validatedConfig, resolvedOptions);
      
      // Save updated configuration if needed and writeBack is enabled
      if (result.configUpdated && resolvedOptions.writeBack) {
        await writeConfigToFile(resolvedOptions.configPath || '', result.config);
        console.log('💾 Updated configuration written back to file');
      } else if (result.configUpdated) {
        console.log('ℹ️ Configuration has updates that were not written back to file (PUSH mode)');
      }
      
      console.log(
        '✨ Synchronization completed successfully',
        result.configUpdated ? 'with updates' : 'without updates'
      );
      
      return result;
    } catch (validationError: unknown) {
      // Provide a more user-friendly error message for validation errors
      if (validationError && 
          typeof validationError === 'object' && 
          'name' in validationError && 
          validationError.name === 'ZodError' &&
          'issues' in validationError) {
        
        // Safely access Zod error properties
        const zodError = validationError as { issues: Array<{ code: string; message: string; path: (string | number)[] }> };
        const issues = zodError.issues || [];
        
        if (issues.length > 0) {
          // Check for common patterns in validation errors
          if (issues.some(issue => 
            issue.code === 'invalid_union_discriminator' && 
            typeof issue.message === 'string' &&
            issue.message.includes('Expected \'stripe\''))) {
            throw new Error(
              `Configuration validation failed: Your products and prices are missing the 'provider' field. ` +
              `Each product and price must have a 'provider' field set to 'stripe'. ` +
              `Please update your configuration file to include this field.`
            );
          }
          
          // Generic validation error with cleaner formatting
          const errors = issues.map(issue => {
            // Format the path in a more readable way
            const path = issue.path.join('.');
            return `- ${path}: ${issue.message}`;
          }).join('\n');
          
          throw new Error(`Configuration validation failed:\n${errors}`);
        }
      }
      
      // Re-throw the original error if we couldn't format it
      throw validationError;
    }
  } catch (error) {
    console.error('❌ Synchronization failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}