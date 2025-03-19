---
layout: default
title: Stripe
parent: Providers
nav_order: 1
---

# Stripe Provider

The Stripe provider allows you to synchronize products and prices with [Stripe](https://stripe.com/), a popular payment processing platform.

## Configuration

### Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_your_key

# Optional
STRIPE_API_VERSION=2025-02-24
```

### Provider Options

```typescript
import { pac } from 'prices-as-code';

await pac({
  providers: [
    {
      provider: 'stripe',
      options: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        apiVersion: '2025-02-24' // optional
      }
    }
  ]
});
```

## Product Configuration

Stripe-specific product configuration:

```typescript
import { Config } from 'prices-as-code';

const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Premium Plan',
      description: 'Our best plan with all features',
      features: ['Feature 1', 'Feature 2', 'Feature 3'], // Optional list of features
      highlight: true, // Optional flag for UI highlighting
      metadata: {
        displayOrder: 3,
        customField: 'value'
      }
    }
  ],
  // ... prices configuration
};
```

### Stripe Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | Must be `'stripe'` |
| `name` | `string` | Product name |
| `description` | `string` | Optional product description |
| `features` | `string[]` | Optional array of product features |
| `highlight` | `boolean` | Optional UI highlight flag |
| `key` | `string` | Optional well-known ID for reference |
| `metadata` | `object` | Optional key-value metadata |

## Price Configuration

Stripe-specific price configuration:

```typescript
import { Config } from 'prices-as-code';

const config: Config = {
  products: [/* ... */],
  prices: [
    {
      provider: 'stripe',
      name: 'Premium Monthly',
      nickname: 'Premium Monthly', // Stripe-specific field
      unitAmount: 4999, // $49.99
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
        usageType: 'licensed', // Optional
        trialPeriodDays: 14 // Optional
      },
      productKey: 'premium_plan', // Reference to product
      taxBehavior: 'exclusive', // Optional
      billingScheme: 'per_unit', // Optional
      metadata: {
        displayName: 'Premium Monthly'
      }
    }
  ]
};
```

### Stripe Price Fields

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | Must be `'stripe'` |
| `name` | `string` | Price name |
| `nickname` | `string` | Stripe-specific display name |
| `unitAmount` | `number` | Price amount in cents |
| `currency` | `string` | Three-letter ISO currency code |
| `type` | `string` | Either `'one_time'` or `'recurring'` |
| `recurring` | `object` | Required for recurring prices |
| `recurring.interval` | `string` | One of `'day'`, `'week'`, `'month'`, or `'year'` |
| `recurring.intervalCount` | `number` | Number of intervals between charges |
| `recurring.usageType` | `string` | Optional, either `'licensed'` or `'metered'` |
| `recurring.aggregateUsage` | `string` | Optional, one of `'sum'`, `'last_during_period'`, `'last_ever'`, or `'max'` |
| `recurring.trialPeriodDays` | `number` | Optional trial period in days |
| `productKey` | `string` | Reference to the product's key |
| `taxBehavior` | `string` | Optional, one of `'inclusive'`, `'exclusive'`, or `'unspecified'` |
| `billingScheme` | `string` | Optional, either `'per_unit'` or `'tiered'` |
| `metadata` | `object` | Optional key-value metadata |