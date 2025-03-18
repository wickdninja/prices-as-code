#!/usr/bin/env node
import path from 'path';
import stripePaC from './index';

// Parse command line arguments
const args = process.argv.slice(2);
const configPathArg = args.find(arg => !arg.startsWith('--'));
const envFileArg = args.find(arg => arg.startsWith('--env='))?.split('=')[1];

async function main() {
  try {
    const configPath = configPathArg 
      ? path.resolve(process.cwd(), configPathArg)
      : undefined;
    
    const options = {
      configPath,
    };
    
    // If env file specified, set it in Node env
    if (envFileArg) {
      process.env.DOTENV_CONFIG_PATH = path.resolve(process.cwd(), envFileArg);
      console.log(`🔧 Using environment file: ${envFileArg}`);
    }
    
    await stripePaC(options);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();