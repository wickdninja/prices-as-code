#!/usr/bin/env node
import path from 'path';
import pac from './index.js';
import { ProviderOptions } from './types.js';

// Parse command line arguments
const args = process.argv.slice(2);
const configPathArg = args.find(arg => !arg.startsWith('--'));
const envFileArg = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
const stripeKeyArg = args.find(arg => arg.startsWith('--stripe-key='))?.split('=')[1];

async function main() {
  try {
    const configPath = configPathArg 
      ? path.resolve(process.cwd(), configPathArg)
      : undefined;
    
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
      configPath,
      providers: providers.length > 0 ? providers : undefined
    };
    
    // If env file specified, set it in Node env
    if (envFileArg) {
      process.env.DOTENV_CONFIG_PATH = path.resolve(process.cwd(), envFileArg);
      console.log(`🔧 Using environment file: ${envFileArg}`);
    }
    
    await pac(options);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();