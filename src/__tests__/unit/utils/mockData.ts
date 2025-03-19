import { Config, StripeProduct, StripePrice } from '../../../types.js';

/**
 * Sample config data for testing
 */
export const mockConfig: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Basic Plan',
      description: 'Basic subscription tier',
      key: 'basic_plan',
      highlight: false,
      features: ['Limited access', '5 projects', 'Email support'],
      metadata: {
        order: '1',
      },
    } as StripeProduct,
    {
      provider: 'stripe',
      name: 'Pro Plan',
      description: 'Professional subscription tier',
      key: 'pro_plan',
      highlight: true,
      features: ['Full access', 'Unlimited projects', 'Priority support'],
      metadata: {
        order: '2', 
        recommended: 'true',
      },
    } as StripeProduct,
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Basic Monthly',
      nickname: 'Basic Monthly',
      key: 'basic_monthly',
      productKey: 'basic_plan',
      unitAmount: 1999,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
      },
      metadata: {
        popular: 'true',
      },
      active: true,
    } as StripePrice,
    {
      provider: 'stripe',
      name: 'Basic Annual',
      nickname: 'Basic Annual',
      key: 'basic_annual',
      productKey: 'basic_plan',
      unitAmount: 19999,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'year',
        intervalCount: 1,
      },
      metadata: {
        discount: '15%',
      },
      active: true,
    } as StripePrice,
    {
      provider: 'stripe',
      name: 'Pro Monthly',
      nickname: 'Pro Monthly',
      key: 'pro_monthly',
      productKey: 'pro_plan',
      unitAmount: 4999,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
      },
      metadata: {
        popular: 'true',
      },
      active: true,
    } as StripePrice,
  ],
};

/**
 * Sample Stripe data for testing
 */
export const mockStripeData = {
  products: [
    {
      id: 'prod_123456',
      name: 'Basic Plan',
      description: 'Basic subscription tier',
      active: true,
      metadata: {
        key: 'basic_plan',
        features: JSON.stringify(['Limited access', '5 projects', 'Email support']),
        highlight: 'false',
        order: '1',
      },
    },
    {
      id: 'prod_789012',
      name: 'Pro Plan',
      description: 'Professional subscription tier',
      active: true,
      metadata: {
        key: 'pro_plan',
        features: JSON.stringify(['Full access', 'Unlimited projects', 'Priority support']),
        highlight: 'true',
        order: '2',
        recommended: 'true',
      },
    },
  ],
  prices: [
    {
      id: 'price_123456',
      nickname: 'Basic Monthly',
      product: 'prod_123456',
      unit_amount: 1999,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      active: true,
      metadata: {
        key: 'basic_monthly',
        popular: 'true',
      },
    },
    {
      id: 'price_234567',
      nickname: 'Basic Annual',
      product: 'prod_123456',
      unit_amount: 19999,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      active: true,
      metadata: {
        key: 'basic_annual',
        discount: '15%',
      },
    },
  ],
};


/**
 * Generate unique test configs to avoid collisions
 */
export function generateUniqueTestConfig(): Config {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const uniqueId = `${timestamp}_${randomSuffix}`;
  
  return {
    products: [
      {
        provider: 'stripe',
        name: `Test Product ${uniqueId}`,
        description: 'A test product',
        key: `test_product_${uniqueId}`,
        features: ['Feature 1', 'Feature 2'],
        highlight: false,
        metadata: {
          testId: uniqueId,
          isTest: 'true',
        },
      } as StripeProduct,
    ],
    prices: [
      {
        provider: 'stripe',
        name: `Test Price ${uniqueId}`,
        nickname: `Test Price ${uniqueId}`,
        key: `test_price_${uniqueId}`,
        productKey: `test_product_${uniqueId}`,
        unitAmount: 1999,
        currency: 'usd',
        type: 'recurring',
        recurring: {
          interval: 'month',
          intervalCount: 1,
        },
        metadata: {
          testId: uniqueId,
          isTest: 'true',
        },
        active: true,
      } as StripePrice,
    ],
  };
}