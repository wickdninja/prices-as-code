---
layout: default
title: Getting Started
parent: Guides
nav_order: 1
---

# Getting Started with Prices as Code

This guide will walk you through setting up Prices as Code and creating your first pricing configuration.

## Installation

Install the package using npm:

```bash
npm install prices-as-code
```

Or with yarn:

```bash
yarn add prices-as-code
```

Or with pnpm:

```bash
pnpm add prices-as-code
```

## Setup Environment Variables

Create a `.env` file in your project root with your API key:

```
# .env file
STRIPE_SECRET_KEY=sk_test_your_stripe_key
```

## Create a Configuration File

### TypeScript Configuration (Recommended)

Create a `pricing.ts` file:

```typescript
import { Config } from 'prices-as-code';

const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Basic Plan',
      description: 'For individuals and small teams',
      features: ['5 projects', '10GB storage', 'Email support'],
      highlight: false,
      metadata: {
        displayOrder: 1
      }
    },
    {
      provider: 'stripe',
      name: 'Pro Plan',
      description: 'For growing businesses',
      features: ['Unlimited projects', '100GB storage', 'Priority support'],
      highlight: true,
      metadata: {
        displayOrder: 2
      }
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Basic Monthly',
      nickname: 'Basic Monthly',
      unitAmount: 999, // $9.99
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'basic_plan',
      metadata: {
        displayName: 'Basic Monthly'
      }
    },
    {
      provider: 'stripe',
      name: 'Pro Monthly',
      nickname: 'Pro Monthly',
      unitAmount: 1999, // $19.99
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'pro_plan',
      metadata: {
        displayName: 'Pro Monthly'
      }
    }
  ]
};

export default config;
```

### YAML Configuration (Alternative)

Creating a `prices.yml` file:

```yaml
products:
  - provider: stripe
    name: Basic Plan
    description: For individuals and small teams
    features:
      - 5 projects
      - 10GB storage
      - Email support
    highlight: false
    metadata:
      displayOrder: 1
  - provider: stripe
    name: Pro Plan
    description: For growing businesses
    features:
      - Unlimited projects
      - 100GB storage
      - Priority support
    highlight: true
    metadata:
      displayOrder: 2

prices:
  - provider: stripe
    name: Basic Monthly
    nickname: Basic Monthly
    unitAmount: 999
    currency: usd
    type: recurring
    recurring:
      interval: month
      intervalCount: 1
    productKey: basic_plan
    metadata:
      displayName: Basic Monthly
  - provider: stripe
    name: Pro Monthly
    nickname: Pro Monthly
    unitAmount: 1999
    currency: usd
    type: recurring
    recurring:
      interval: month
      intervalCount: 1
    productKey: pro_plan
    metadata:
      displayName: Pro Monthly
```

## Running the Synchronization

### Using the CLI

Sync your configuration using the command-line interface:

```bash
npx prices-as-code pricing.ts
```

Or for YAML:

```bash
npx prices-as-code prices.yml
```

### Using the JavaScript API

You can also use the JavaScript API in your own scripts:

```typescript
import { pac } from 'prices-as-code';

async function syncPricing() {
  try {
    const result = await pac({
      configPath: './pricing.ts',
      providers: [
        {
          provider: 'stripe',
          options: {
            secretKey: process.env.STRIPE_SECRET_KEY,
          }
        }
      ]
    });
    
    console.log('Sync result:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

syncPricing();
```

## Next Steps

- Check out [Configuration File Format](configuration-file.md) to learn more about config options
- Set up [CI/CD Integration](ci-cd.md) to automate your pricing updates
- Learn about [Custom Pricing Logic](custom-pricing.md) for more complex scenarios