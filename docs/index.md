---
layout: default
title: Home
nav_order: 1
description: "Define your product pricing schemas with type-safe definitions"
permalink: /
---

<div class="hero">
  <img src="https://raw.githubusercontent.com/wickdninja/assets/refs/heads/main/PaC.webp" alt="Prices as Code" width="300" />
  <h1>Prices as Code</h1>
  <p>Define your product pricing schemas with type-safe definitions and synchronize them across multiple providers.</p>
  <a href="guides/getting-started.html" class="btn">Get Started</a>
  <a href="https://github.com/wickdninja/prices-as-code" class="btn btn-secondary">View on GitHub</a>
</div>

{: .note }
Prices as Code is a TypeScript library that makes it easy to manage product pricing with Stripe and allows for extending to custom providers.

<div class="features">
  <div class="feature">
    <h3>Type-Safe</h3>
    <p>Use TypeScript and Zod schemas to define your pricing models with full type safety.</p>
  </div>
  <div class="feature">
    <h3>Multi-Provider</h3>
    <p>Support for Stripe with an extensible architecture allowing for custom providers.</p>
  </div>
  <div class="feature">
    <h3>Declarative</h3>
    <p>Define your products and prices in code, sync them to providers automatically.</p>
  </div>
  <div class="feature">
    <h3>Idempotent</h3>
    <p>Run it multiple times, only changes what's needed. Perfect for CI/CD pipelines.</p>
  </div>
  <div class="feature">
    <h3>Metadata Support</h3>
    <p>Add custom metadata to your products and prices for enhanced flexibility.</p>
  </div>
</div>

## Quick Installation

```bash
npm install prices-as-code
```

or

```bash
yarn add prices-as-code
```

## Example Configuration

```typescript
import { Config } from 'prices-as-code';

const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Basic Plan',
      description: 'For individuals and small teams',
      features: ['5 projects', '10GB storage', 'Email support']
    },
    {
      provider: 'stripe',
      name: 'Pro Plan',
      description: 'For growing businesses',
      features: ['Unlimited projects', '100GB storage', 'Priority support']
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Basic Monthly',
      unitAmount: 999, // $9.99
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month'
      },
      productKey: 'basic_plan'
    }
  ]
};
```

## Why Prices as Code?

Managing pricing across multiple billing providers is complex and error-prone. Prices as Code provides a unified way to:

1. **Centralize Pricing Logic**: Define pricing once, deploy everywhere
2. **Ensure Consistency**: Maintain the same pricing information across systems
3. **Reduce Errors**: Catch pricing mistakes before they happen with type safety
4. **Simplify Workflow**: Integrate pricing management into your CI/CD pipeline

## Explore the Documentation

<div class="grid">
  <div class="card">
    <div class="card-header">Guides</div>
    <div class="card-body">
      <p>Step-by-step guides to get you started with Prices as Code</p>
      <a href="guides/index.html">View Guides</a>
    </div>
  </div>
  <div class="card">
    <div class="card-header">API Reference</div>
    <div class="card-body">
      <p>Detailed API documentation for developers</p>
      <a href="api/index.html">View API</a>
    </div>
  </div>
  <div class="card">
    <div class="card-header">Providers</div>
    <div class="card-body">
      <p>Information about supported billing providers</p>
      <a href="providers/index.html">View Providers</a>
    </div>
  </div>
</div>

## Supported Providers

Currently, Prices as Code supports this billing provider:

- [Stripe](providers/stripe.html)

Looking for more providers? Check out [Adding Custom Providers](guides/custom-providers.html).

{: .warning }
Prices as Code is currently in active development. APIs may change in future versions.

## License

This project is licensed under the [MIT License](https://github.com/wickdninja/prices-as-code/blob/main/LICENSE).