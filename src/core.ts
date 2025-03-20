import {
  Config,
  ConfigSchema,
  PaCOptions,
  SyncResult,
  ProviderOptions,
  PullResult,
  Product,
  Price
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
    writeBack: options?.writeBack ?? false,
    format: options?.format ?? 'yaml'
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
 * Pull catalog from providers and generate a configuration file
 */
export async function pullFromProviders(
  options: PaCOptions
): Promise<PullResult> {
  console.log('🔄 Starting pull operation from providers...');
  
  try {
    // Initialize providers
    const { providers } = initializeProviders(options.providers);
    let allProducts: Product[] = [];
    let allPrices: Price[] = [];
    
    // Pull from each provider
    for (const [providerName, provider] of Object.entries(providers)) {
      console.log(`📥 Pulling data from ${providerName}...`);
      
      // Fetch products first
      const products = await provider.fetchProducts();
      console.log(`📋 Fetched ${products.length} products from ${providerName}`);
      allProducts = [...allProducts, ...products];
      
      // Fetch prices next
      const prices = await provider.fetchPrices();
      console.log(`💰 Fetched ${prices.length} prices from ${providerName}`);
      allPrices = [...allPrices, ...prices];
    }
    
    // Create config
    const config = {
      products: allProducts,
      prices: allPrices
    };
    
    // Validate with Zod schema
    const validatedConfig = ConfigSchema.parse(config);
    
    // Write to file if configPath is provided
    if (options.configPath) {
      // Determine file extension based on format option
      const originalPath = options.configPath;
      const format = options.format || 'yaml';
      
      // If the provided path doesn't match the desired format, adjust it
      const extension = path.extname(originalPath).toLowerCase();
      let outputPath = originalPath;
      
      if (format === 'yaml' && !extension.match(/\.ya?ml$/)) {
        outputPath = originalPath.replace(/\.[^.]+$/, '') + '.yml';
      } else if (format === 'json' && extension !== '.json') {
        outputPath = originalPath.replace(/\.[^.]+$/, '') + '.json';
      } else if (format === 'ts' && extension !== '.ts') {
        outputPath = originalPath.replace(/\.[^.]+$/, '') + '.ts';
      }
      
      // If the path was changed, inform the user
      if (outputPath !== originalPath) {
        console.log(`ℹ️ Adjusting output file to match requested format: ${outputPath}`);
      }
      
      // Write to file
      await writeConfigToFile(outputPath, validatedConfig);
      console.log(`✅ Configuration saved to ${outputPath}`);
      
      return {
        config: validatedConfig,
        configPath: outputPath
      };
    }
    
    return {
      config: validatedConfig,
      configPath: options.configPath || ''
    };
  } catch (error) {
    console.error('❌ Error during pull operation:', error);
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