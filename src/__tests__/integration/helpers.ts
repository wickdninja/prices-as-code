import { Config, StripePrice } from '../../types.js';

/**
 * Helper to generate a unique test identifier
 */
export const generateTestId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

/**
 * Helper to create a test config with unique identifiers
 */
export const createTestConfig = (provider: 'stripe', unique = true): Config => {
  const uniqueId = unique ? `-${Date.now()}` : '';
  
  return {
    products: [
      {
        provider,
        name: `Test Product${uniqueId}`,
        description: 'A test product for integration tests',
        features: ['Feature 1', 'Feature 2'],
        highlight: false,
        metadata: {
          testId: generateTestId('integration-test-product'),
          isTest: 'true'
        }
      }
    ],
    prices: [
      {
        provider,
        name: `Test Price${uniqueId}`,
        nickname: `Test Price Monthly${uniqueId}`,
        unitAmount: 1999,
        currency: 'usd',
        type: 'recurring',
        recurring: {
          interval: 'month',
          intervalCount: 1
        },
        productKey: 'test_product',
        active: true,
        metadata: {
          testId: generateTestId('integration-test-price'),
          isTest: 'true'
        }
      }
    ]
  };
};

/**
 * Helper to create a tiered pricing test config
 */
export const createTieredPricingConfig = (provider: 'stripe'): Config => {
  const uniqueId = `-${Date.now()}`;
  
  return {
    products: [
      {
        provider,
        name: `API Access Plan${uniqueId}`,
        description: 'Pay-as-you-go API access',
        features: ['Unlimited access', 'Usage-based billing'],
        metadata: {
          testId: generateTestId('integration-test-tiered'),
          isTest: 'true'
        }
      }
    ],
    prices: [
      {
        provider,
        name: `API Requests Tiered${uniqueId}`,
        nickname: `API Requests Tiered${uniqueId}`,
        unitAmount: 0, // Base price is 0
        currency: 'usd',
        type: 'recurring',
        recurring: {
          interval: 'month',
          intervalCount: 1,
          usageType: 'metered',
          aggregateUsage: 'sum'
        },
        productKey: `api_access_plan${uniqueId.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`,
        billingScheme: 'tiered', // Add the billing scheme for tiered pricing
        active: true,
        metadata: {
          testId: generateTestId('integration-test-tiered-price'),
          isTest: 'true'
        }
      } as StripePrice // Use type assertion for the tiered price
    ]
  };
};