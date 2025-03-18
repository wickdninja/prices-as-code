import { stripePaC } from '../lib/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert file URL to path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function example() {
  try {
    // Path to the sample YAML configuration
    const configPath = path.join(__dirname, 'prices.yml');
    
    // Run the synchronization
    const result = await stripePaC({
      configPath,
      // Alternatively, you can provide the Stripe key directly:
      // stripeSecretKey: 'your_stripe_secret_key'
    });
    
    console.log('Sync completed!');
    console.log(`Updated products: ${result.config.products.length}`);
    console.log(`Updated prices: ${result.config.prices.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

example();