---
layout: default
title: Adding Custom Providers
parent: Guides
parent_page: index.md
nav_order: 6
---

# Adding Custom Providers

Prices as Code comes with built-in support for Stripe as a billing provider. However, you can extend it by adding custom providers to integrate with other billing systems or implement specialized pricing logic.

## Why Create a Custom Provider?

You might want to create a custom provider if you:

- Use a billing system not natively supported by Prices as Code
- Have an internal billing system
- Need to integrate with a marketplace or reseller platform
- Want to implement specialized pricing logic specific to your business
- Need to connect to multiple billing systems simultaneously

## Provider Interface

A provider in Prices as Code is an implementation of the `Provider` interface:

```typescript
export interface Provider {
  // Provider identification
  readonly name: string;
  readonly id: string;
  
  // Core functionality
  initialize(options: any): Promise<void>;
  createProduct(product: Product): Promise<string>;
  updateProduct(productId: string, product: Product): Promise<void>;
  createPrice(price: Price, productId: string): Promise<string>;
  updatePrice(priceId: string, price: Price): Promise<void>;
  
  // Optional functionality
  fetchAllProducts?(): Promise<Product[]>;
  fetchAllPrices?(): Promise<Price[]>;
  archiveProduct?(productId: string): Promise<void>;
  archivePrice?(priceId: string): Promise<void>;
  validateConfig?(config: Config): Promise<ValidationResult>;
}
```

## Basic Custom Provider Example

Here's a basic example of creating a custom provider for an internal billing system:

```typescript
import { Provider, Product, Price, Config, ValidationResult } from 'prices-as-code';
import { InternalBillingAPI } from './your-internal-api';

class InternalBillingProvider implements Provider {
  // Provider identification
  readonly name = 'internal';
  readonly id = 'internal-billing';
  
  private api: InternalBillingAPI;
  private apiKey: string;
  
  // Initialize the provider with options
  async initialize(options: { apiKey: string; environment?: string }): Promise<void> {
    this.apiKey = options.apiKey;
    const environment = options.environment || 'production';
    this.api = new InternalBillingAPI(this.apiKey, environment);
    await this.api.authenticate();
  }
  
  // Create a new product
  async createProduct(product: Product): Promise<string> {
    const response = await this.api.createProduct({
      name: product.name,
      description: product.description,
      features: product.features,
      metadata: product.metadata
    });
    return response.productId;
  }
  
  // Update an existing product
  async updateProduct(productId: string, product: Product): Promise<void> {
    await this.api.updateProduct(productId, {
      name: product.name,
      description: product.description,
      features: product.features,
      metadata: product.metadata
    });
  }
  
  // Create a new price
  async createPrice(price: Price, productId: string): Promise<string> {
    const response = await this.api.createPrice({
      productId,
      name: price.name,
      nickname: price.nickname,
      unitAmount: price.unitAmount,
      currency: price.currency,
      type: price.type,
      recurring: price.recurring,
      metadata: price.metadata
    });
    return response.priceId;
  }
  
  // Update an existing price
  async updatePrice(priceId: string, price: Price): Promise<void> {
    await this.api.updatePrice(priceId, {
      name: price.name,
      nickname: price.nickname,
      // Most billing systems don't allow updating the amount after creation
      // unitAmount: price.unitAmount, 
      metadata: price.metadata
    });
  }
  
  // Fetch all products from the provider
  async fetchAllProducts(): Promise<Product[]> {
    const products = await this.api.getAllProducts();
    return products.map(p => ({
      provider: this.name,
      name: p.name,
      description: p.description,
      features: p.features || [],
      metadata: p.metadata || {},
      id: p.id
    }));
  }
  
  // Fetch all prices from the provider
  async fetchAllPrices(): Promise<Price[]> {
    const prices = await this.api.getAllPrices();
    return prices.map(p => ({
      provider: this.name,
      name: p.name,
      nickname: p.nickname || p.name,
      unitAmount: p.unitAmount,
      currency: p.currency,
      type: p.type,
      recurring: p.recurring,
      productKey: p.productId,
      metadata: p.metadata || {},
      id: p.id
    }));
  }
  
  // Archive (or disable) a product
  async archiveProduct(productId: string): Promise<void> {
    await this.api.disableProduct(productId);
  }
  
  // Archive (or disable) a price
  async archivePrice(priceId: string): Promise<void> {
    await this.api.disablePrice(priceId);
  }
  
  // Optional: Validate configuration before applying changes
  async validateConfig(config: Config): Promise<ValidationResult> {
    const warnings = [];
    const errors = [];
    
    // Check for internal business rules
    for (const product of config.products) {
      if (product.provider !== this.name) continue;
      
      // Example validation: Product names must be unique
      const existingProducts = await this.api.findProductsByName(product.name);
      if (existingProducts.length > 0 && !product.id) {
        errors.push(`Product name '${product.name}' already exists`);
      }
    }
    
    // Return validation results
    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }
}

export default InternalBillingProvider;
```

## Registering Your Custom Provider

Once you've created your custom provider, you need to register it with Prices as Code:

```typescript
import { pac } from 'prices-as-code';
import InternalBillingProvider from './internal-billing-provider';

// Create an instance of your provider
const internalProvider = new InternalBillingProvider();

// Use it in your sync configuration
async function syncPricing() {
  try {
    const result = await pac({
      configPath: './pricing.ts',
      providers: [
        {
          provider: internalProvider,
          options: {
            apiKey: process.env.INTERNAL_BILLING_API_KEY,
            environment: 'staging'
          }
        },
        // You can also use built-in providers alongside custom ones
        {
          provider: 'stripe',
          options: {
            secretKey: process.env.STRIPE_SECRET_KEY
          }
        }
      ]
    });
    
    console.log('Sync result:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

## Best Practices for Custom Providers

### Error Handling

Implement robust error handling to make debugging easier:

```typescript
async createProduct(product: Product): Promise<string> {
  try {
    const response = await this.api.createProduct({
      name: product.name,
      // Additional properties...
    });
    return response.productId;
  } catch (error) {
    // Add context to the error
    throw new Error(`Failed to create product '${product.name}': ${error.message}`);
  }
}
```

### Logging

Add logging to help trace issues:

```typescript
async initialize(options: any): Promise<void> {
  console.log(`Initializing ${this.name} provider with environment: ${options.environment}`);
  // Initialization code...
  console.log(`${this.name} provider initialized successfully`);
}
```

### Idempotency

Ensure operations are idempotent to avoid duplicates:

```typescript
async createPrice(price: Price, productId: string): Promise<string> {
  // Check if a similar price already exists
  const existingPrices = await this.api.getPricesByProduct(productId);
  const similarPrice = existingPrices.find(p => 
    p.unitAmount === price.unitAmount && 
    p.currency === price.currency &&
    p.recurring?.interval === price.recurring?.interval
  );
  
  // Return existing price ID if found
  if (similarPrice) {
    console.log(`Similar price already exists for ${price.name}, reusing ID: ${similarPrice.id}`);
    return similarPrice.id;
  }
  
  // Otherwise create a new price
  const response = await this.api.createPrice({
    // Price properties...
  });
  return response.priceId;
}
```

## Advanced Custom Provider Topics

### Multi-Provider Support

Implement a provider that syncs to multiple platforms simultaneously:

```typescript
class MultiPlatformProvider implements Provider {
  readonly name = 'multi';
  readonly id = 'multi-platform';
  
  private providers: Provider[] = [];
  
  async initialize(options: { providers: Array<{ provider: Provider; options: any }> }): Promise<void> {
    // Initialize all sub-providers
    for (const { provider, options } of options.providers) {
      await provider.initialize(options);
      this.providers.push(provider);
    }
  }
  
  async createProduct(product: Product): Promise<string> {
    // Create the product on all platforms and store the mapping
    const productIds = {};
    
    for (const provider of this.providers) {
      const id = await provider.createProduct(product);
      productIds[provider.name] = id;
    }
    
    // Return a composite ID or store mapping in your database
    return JSON.stringify(productIds);
  }
  
  // Implement other methods similarly...
}
```

### Specialized Pricing Algorithms

Implement a provider with custom pricing algorithms:

```typescript
class DynamicPricingProvider implements Provider {
  // Basic provider implementation...
  
  async createPrice(price: Price, productId: string): Promise<string> {
    // Apply dynamic pricing algorithm based on metadata
    if (price.metadata?.dynamicPricing) {
      const basePrice = price.unitAmount;
      
      // Implement time-of-day pricing, demand-based pricing, etc.
      if (price.metadata.pricingModel === 'time-of-day') {
        await this.setupTimeOfDayPricing(productId, basePrice, price);
      } else if (price.metadata.pricingModel === 'demand-based') {
        await this.setupDemandBasedPricing(productId, basePrice, price);
      }
      
      // Return a reference ID
      return `dynamic-${productId}-${Date.now()}`;
    }
    
    // Regular price creation logic...
  }
  
  private async setupTimeOfDayPricing(productId: string, basePrice: number, price: Price) {
    // Implementation of time-of-day pricing...
  }
  
  private async setupDemandBasedPricing(productId: string, basePrice: number, price: Price) {
    // Implementation of demand-based pricing...
  }
}
```

## Testing Custom Providers

Create a test suite for your custom provider:

```typescript
import { expect } from 'chai';
import YourCustomProvider from './your-custom-provider';

describe('YourCustomProvider', () => {
  let provider;
  
  beforeEach(async () => {
    provider = new YourCustomProvider();
    await provider.initialize({
      apiKey: 'test-api-key',
      environment: 'test'
    });
  });
  
  it('should create a product', async () => {
    const productId = await provider.createProduct({
      provider: 'your-provider',
      name: 'Test Product',
      description: 'A test product'
    });
    
    expect(productId).to.be.a('string');
    // Additional assertions...
  });
  
  // Additional tests...
});
```

## Next Steps

- Explore [CI/CD Integration](ci-cd.html) to automate your pricing updates
- Learn about [Working with Metadata](metadata.html) for extending functionality
- See how to implement [Custom Pricing Logic](custom-pricing.html) for complex scenarios