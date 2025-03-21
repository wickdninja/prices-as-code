import { generate } from './index.js';

async function testGenerate() {
  try {
    console.log('Testing generate functionality...');
    
    const result = await generate({
      configPath: './generated-pricing.yml',
      format: 'yaml',
      productTiers: ['free', 'basic', 'pro'],
      intervals: ['month', 'year'],
      currency: 'usd',
      includeMetadata: true,
      includeFeatures: true
    });
    
    console.log('Generated template with:', {
      products: result.products.length,
      prices: result.prices.length
    });
    
    console.log('Success! Check the generated-pricing.yml file.');
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

testGenerate();