#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import pac from './index.js';
import { ProviderOptions, PaCOptions, GenerateOptions } from './types.js';

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.includes('--help') || args.includes('-h');
// Detect commands
const isPull = args[0] === 'pull';
const isGenerate = args[0] === 'generate';
const command = isPull ? 'pull' : isGenerate ? 'generate' : 'sync'; // Default is sync

// Config path is the first non-flag, non-command argument
const configPathArg = args.find(arg => !arg.startsWith('--') && 
  arg !== 'pull' && arg !== 'generate' && arg !== 'sync');

// Environment options
const envFileArg = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
const stripeKeyArg = args.find(arg => arg.startsWith('--stripe-key='))?.split('=')[1];
const writeBackArg = args.includes('--write-back');

// Parse the format argument
const formatArg = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'yaml';
// Validate and convert to the correct type
const outputFormat = (formatArg === 'yaml' || formatArg === 'json' || formatArg === 'ts') 
  ? formatArg 
  : 'yaml';

// Generate command specific arguments
const tierArg = args.find(arg => arg.startsWith('--tiers='))?.split('=')[1];
const currencyArg = args.find(arg => arg.startsWith('--currency='))?.split('=')[1];
const intervalArg = args.find(arg => arg.startsWith('--intervals='))?.split('=')[1];
const noMetadataArg = args.includes('--no-metadata');
const noFeaturesArg = args.includes('--no-features');

// Display help information
function showHelp(): void {
  console.log(`
  🏷️  Prices as Code (PaC) - Define your product pricing schemas with type-safe definitions

  Usage: prices-as-code [command] [options] [config-file]

  Commands:
    sync             Synchronize your pricing schema with provider (default)
    pull             Pull pricing from provider into a local config file
    generate         Generate a template pricing structure
    validate         Validate your pricing schema without making changes
    diff             Show differences between local config and provider

  Options:
    -h, --help       Show this help message
    --env=<path>     Path to .env file with environment variables
    --stripe-key=<key> Stripe API key (overrides env var)
    --write-back     Write provider IDs back to your config file (default: off)
    --format=<format> Output format for 'pull' and 'generate' commands (yaml, json, ts) (default: yaml)
    --dry-run        Show changes without executing them
    --verbose        Show detailed logging information

  Generate Options:
    --tiers=<tiers>  Comma-separated list of product tiers (default: basic,pro,enterprise)
    --currency=<cur> ISO currency code (default: usd)
    --intervals=<int> Comma-separated list of intervals (default: month,year)
    --no-metadata    Don't include metadata in generated file
    --no-features    Don't include feature lists in generated products

  Examples:
    prices-as-code prices.yml                       # Sync pricing to provider
    prices-as-code pull prices.yml                  # Pull pricing from provider
    prices-as-code generate prices.yml              # Generate template pricing
    prices-as-code generate --tiers=free,basic,pro prices.yml  # Custom tiers
    prices-as-code pricing.ts --env=.env.production # With custom env file
    prices-as-code pull --format=ts pricing.ts      # Pull as TypeScript
    prices-as-code --help                           # Show help

  Documentation: https://wickdninja.github.io/prices-as-code/
  `);
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    // Show help if requested
    if (helpArg) {
      showHelp();
      return;
    }

    // Validate that a config file is provided and exists
    if (!configPathArg) {
      console.error('❌ Error: No configuration file specified');
      console.log('Run "prices-as-code --help" for usage information');
      process.exit(1);
    }

    const resolvedConfigPath = path.resolve(process.cwd(), configPathArg);
    
    // For sync command, config file must exist
    // For pull and generate commands, we'll create or overwrite the file
    if (command === 'sync' && !fs.existsSync(resolvedConfigPath)) {
      console.error(`❌ Error: Configuration file not found: ${resolvedConfigPath}`);
      console.log('Run "prices-as-code --help" for usage information');
      process.exit(1);
    }
    
    // If env file specified, set it in Node env
    if (envFileArg) {
      const envPath = path.resolve(process.cwd(), envFileArg);
      // Check if env file exists
      if (!fs.existsSync(envPath)) {
        console.error(`❌ Error: Environment file not found: ${envPath}`);
        process.exit(1);
      }
      process.env.DOTENV_CONFIG_PATH = envPath;
      console.log(`🔧 Using environment file: ${envFileArg}`);
    }
    
    // Handle generate command
    if (command === 'generate') {
      // Parse tier argument if provided
      const productTiers = tierArg ? 
        tierArg.split(',').map(tier => tier.trim().toLowerCase()) : 
        undefined;
      
      // Parse interval argument if provided
      const intervals = intervalArg ? 
        intervalArg.split(',').map(interval => interval.trim().toLowerCase()) as ('month' | 'year')[] : 
        undefined;
      
      // Create generate options
      const generateOptions: Partial<GenerateOptions> = {
        configPath: resolvedConfigPath,
        format: outputFormat as 'yaml' | 'json' | 'ts',
        provider: 'stripe', // Only stripe supported currently
        productTiers,
        intervals,
        currency: currencyArg ? currencyArg.toLowerCase() : undefined,
        includeMetadata: !noMetadataArg,
        includeFeatures: !noFeaturesArg
      };
      
      // Generate template
      await pac.generate(generateOptions);
      
    } else if (command === 'pull') {
      // Set up provider options
      const providers: ProviderOptions[] = [];
      
      // Add providers from command line args
      if (stripeKeyArg) {
        providers.push({
          provider: 'stripe',
          options: {
            secretKey: stripeKeyArg
          }
        });
      }
      
      // Create properly typed pull options
      const pullOptions: Partial<PaCOptions> = {
        configPath: resolvedConfigPath,
        providers: providers.length > 0 ? providers : undefined,
        format: outputFormat as 'yaml' | 'json' | 'ts',
        writeBack: false // Not applicable for pull
      };
      await pac.pull(pullOptions);
      
    } else {
      // For sync command, use pricesAsCode
      const providers: ProviderOptions[] = [];
      
      // Add providers from command line args
      if (stripeKeyArg) {
        providers.push({
          provider: 'stripe',
          options: {
            secretKey: stripeKeyArg
          }
        });
      }
      
      const options = {
        configPath: resolvedConfigPath,
        providers: providers.length > 0 ? providers : undefined,
        writeBack: writeBackArg
      };
      
      await pac(options);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    // Show help hint for common errors
    if (error instanceof Error && 
        (error.message.includes('Cannot find module') || 
         error.message.includes('not found'))) {
      console.log('Run "prices-as-code --help" for usage information');
    }
    process.exit(1);
  }
}

main();