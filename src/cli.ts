#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import pac from './index.js';
import { ProviderOptions, PaCOptions } from './types.js';

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.includes('--help') || args.includes('-h');
const command = args[0] === 'pull' ? 'pull' : 'sync'; // Default is sync, explicitly support pull
const configPathArg = args.find(arg => !arg.startsWith('--') && arg !== 'pull');
const envFileArg = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
const stripeKeyArg = args.find(arg => arg.startsWith('--stripe-key='))?.split('=')[1];
const writeBackArg = args.includes('--write-back');
// Parse the format argument
const formatArg = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'yaml';
// Validate and convert to the correct type
const outputFormat = (formatArg === 'yaml' || formatArg === 'json' || formatArg === 'ts') 
  ? formatArg 
  : 'yaml';

// Display help information
function showHelp(): void {
  console.log(`
  🏷️  Prices as Code (PaC) - Define your product pricing schemas with type-safe definitions

  Usage: prices-as-code [command] [options] [config-file]

  Commands:
    sync             Synchronize your pricing schema with provider (default)
    pull             Pull pricing from provider into a local config file
    validate         Validate your pricing schema without making changes
    diff             Show differences between local config and provider

  Options:
    -h, --help       Show this help message
    --env=<path>     Path to .env file with environment variables
    --stripe-key=<key> Stripe API key (overrides env var)
    --write-back     Write provider IDs back to your config file (default: off)
    --format=<format> Output format for 'pull' command (yaml, json, ts) (default: yaml)
    --dry-run        Show changes without executing them
    --verbose        Show detailed logging information

  Examples:
    prices-as-code prices.yml                       # Sync pricing to provider
    prices-as-code pull prices.yml                  # Pull pricing from provider
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
    // For pull command, we'll create or overwrite the file
    if (command === 'sync' && !fs.existsSync(resolvedConfigPath)) {
      console.error(`❌ Error: Configuration file not found: ${resolvedConfigPath}`);
      console.log('Run "prices-as-code --help" for usage information');
      process.exit(1);
    }
    
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
    
    // Recurly support has been removed from public API
    
    const options = {
      configPath: resolvedConfigPath,
      providers: providers.length > 0 ? providers : undefined,
      writeBack: writeBackArg
    };
    
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
    
    if (command === 'pull') {
      // For pull command, use pull function
      // Create properly typed pull options
      const pullOptions: Partial<PaCOptions> = {
        configPath: resolvedConfigPath,
        providers: providers.length > 0 ? providers : undefined,
        // Add format option with proper type assertion
        format: outputFormat as 'yaml' | 'json' | 'ts',
        writeBack: false // Not applicable for pull
      };
      await pac.pull(pullOptions);
    } else {
      // For sync command, use pricesAsCode
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