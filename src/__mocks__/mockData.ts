import { Config, Product, Price } from '../types.js';

export const mockProducts = [
  {
    id: 'prod_existing123',
    name: 'Basic Plan',
    description: 'Our starter tier',
    metadata: {
      key: 'basic',
      features: JSON.stringify(['Feature 1', 'Feature 2']),
      highlight: 'false'
    }
  },
  {
    id: 'prod_existing456',
    name: 'Pro Plan',
    description: 'For professionals',
    metadata: {
      key: 'pro',
      features: JSON.stringify(['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']),
      highlight: 'true'
    }
  }
];

export const mockPrices = [
  {
    id: 'price_existing123',
    nickname: 'Basic Monthly',
    unit_amount: 999,
    currency: 'usd',
    recurring: {
      interval: 'month'
    },
    product: 'prod_existing123',
    metadata: {
      key: 'basic_monthly',
      plan_code: 'BM001'
    }
  },
  {
    id: 'price_existing456',
    nickname: 'Pro Monthly',
    unit_amount: 1999,
    currency: 'usd',
    recurring: {
      interval: 'month'
    },
    product: 'prod_existing456',
    metadata: {
      key: 'pro_monthly',
      plan_code: 'PM001'
    }
  },
  {
    id: 'price_existing789',
    nickname: 'Pro Yearly',
    unit_amount: 19990,
    currency: 'usd',
    recurring: {
      interval: 'year'
    },
    product: 'prod_existing456',
    metadata: {
      key: 'pro_yearly',
      plan_code: 'PY001'
    }
  }
];

export const mockConfig: Config = {
  products: [
    {
      name: 'Basic Plan',
      description: 'Our starter tier',
      provider: 'stripe',
      metadata: {
        key: 'basic',
        features: ['Feature 1', 'Feature 2'],
        highlight: false
      }
    },
    {
      name: 'Pro Plan',
      description: 'For professionals',
      provider: 'stripe',
      metadata: {
        key: 'pro',
        features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
        highlight: true
      }
    }
  ],
  prices: [
    {
      nickname: 'Basic Monthly',
      name: 'Basic Monthly',
      unitAmount: 999,
      currency: 'usd',
      type: 'recurring',
      provider: 'stripe',
      active: true,
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'basic',
      metadata: {
        key: 'basic_monthly',
        plan_code: 'BM001'
      }
    },
    {
      nickname: 'Pro Monthly',
      name: 'Pro Monthly',
      unitAmount: 1999,
      currency: 'usd',
      type: 'recurring',
      provider: 'stripe',
      active: true,
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'pro',
      metadata: {
        key: 'pro_monthly',
        plan_code: 'PM001'
      }
    },
    {
      nickname: 'Pro Yearly',
      name: 'Pro Yearly',
      unitAmount: 19990,
      currency: 'usd',
      type: 'recurring',
      provider: 'stripe',
      active: true,
      recurring: {
        interval: 'year',
        intervalCount: 1
      },
      productKey: 'pro',
      metadata: {
        key: 'pro_yearly',
        plan_code: 'PY001'
      }
    }
  ]
};