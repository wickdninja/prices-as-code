#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import pac from './index.js';
import { ProviderOptions } from './types.js';

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.includes('--help') || args.includes('-h');
const configPathArg = args.find(arg => !arg.startsWith('--'));
const envFileArg = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
const stripeKeyArg = args.find(arg => arg.startsWith('--stripe-key='))?.split('=')[1];
const writeBackArg = args.includes('--write-back');

// Display help information
function showHelp(): void {
  console.log(`
  🏷️  Prices as Code (PaC) - Define your product pricing schemas with type-safe definitions

  Usage: prices-as-code [options] [config-file]

  Commands:
    sync             Synchronize your pricing schema with provider (default)
    validate         Validate your pricing schema without making changes
    import           Import pricing from provider to local config
    diff             Show differences between local config and provider

  Options:
    -h, --help       Show this help message
    --env=<path>     Path to .env file with environment variables
    --stripe-key=<key> Stripe API key (overrides env var)
    --write-back     Write provider IDs back to your config file (default: off)
    --dry-run        Show changes without executing them
    --verbose        Show detailed logging information

  Examples:
    prices-as-code prices.yml
    prices-as-code pricing.ts --env=.env.production
    prices-as-code --help

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
    
    // Check if the config file exists
    if (!fs.existsSync(resolvedConfigPath)) {
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
    
    await pac(options);
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