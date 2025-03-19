import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

// Try to load test-specific env variables first
const testEnvPath = join(process.cwd(), '.env.test');
if (existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath });
} else {
  // Fall back to default .env file
  dotenv.config();
}

// Log which environment we're using for debugging
console.log(`Using environment: ${process.env.NODE_ENV || 'development'}`);

// Validate required environment variables
const requiredEnvVars = {
  stripe: 'STRIPE_SECRET_KEY',
  // Add other providers as needed
};

// Check which providers we can test
export const availableProviders = Object.entries(requiredEnvVars).reduce(
  (acc, [provider, envVar]) => {
    acc[provider] = !!process.env[envVar];
    return acc;
  },
  {} as Record<string, boolean>
);

// Log available providers
console.log('Available providers for testing:', 
  Object.entries(availableProviders)
    .filter(([_, available]) => available)
    .map(([provider]) => provider)
    .join(', ') || 'None - tests will be skipped'
);