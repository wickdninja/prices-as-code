# Prices as Code (PaC)

<p align="center">
  <img src="https://raw.githubusercontent.com/wickdninja/assets/refs/heads/main/PaC.webp" alt="Prices as Code" width="400" />
</p>

Define your product pricing schemas with type-safe definitions and synchronize them across multiple providers.

## 🚀 Features

- **Type-Safe**: Use TypeScript and Zod schemas to define your pricing models with full type safety
- **Declarative**: Define your products and prices in code, sync them to providers
- **Idempotent**: Run it multiple times, only changes what's needed
- **Metadata Support**: Add custom metadata to your products and prices
- **YAML or TypeScript**: Define your pricing in either YAML or TypeScript format
- **Extensible**: Easily add support for your own billing providers

## Installation

```bash
npm install prices-as-code
```

## Quick Start

### 1. Create a pricing configuration file (pricing.ts)

```typescript
import { Config } from "prices-as-code";

const config: Config = {
  products: [
    {
      provider: "stripe",
      name: "Basic Plan",
      description: "For individuals and small teams",
      features: ["5 projects", "10GB storage", "Email support"],
      highlight: false,
      metadata: {
        displayOrder: 1,
      },
    },
    {
      provider: "stripe",
      name: "Pro Plan",
      description: "For growing businesses",
      features: ["Unlimited projects", "100GB storage", "Priority support"],
      highlight: true,
      metadata: {
        displayOrder: 2,
      },
    },
  ],
  prices: [
    {
      provider: "stripe",
      name: "Basic Monthly",
      nickname: "Basic Monthly",
      unitAmount: 999, // $9.99
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "month",
        intervalCount: 1,
      },
      productKey: "basic_plan",
      metadata: {
        displayName: "Basic Monthly",
      },
    },
    {
      provider: "stripe",
      name: "Pro Monthly",
      nickname: "Pro Monthly",
      unitAmount: 1999, // $19.99
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "month",
        intervalCount: 1,
      },
      productKey: "pro_plan",
      metadata: {
        displayName: "Pro Monthly",
      },
    },
  ],
};

export default config;
```

### 2. Set up environment variables

```bash
# .env file
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Run the synchronization

```bash
npx prices-as-code pricing.ts
```

## CLI Options

```
prices-as-code [configPath] [options]

Options:
  --env=<path>          Path to .env file
  --stripe-key=<key>    Stripe API key
```

## Supported Providers

### Stripe

The Stripe provider allows you to sync products and prices to your Stripe account.

Required environment variables:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_API_VERSION` (optional): Stripe API version to use


## Programmatic Usage

```typescript
import { pac } from "prices-as-code";

async function syncPricing() {
  try {
    const result = await pac({
      configPath: "./pricing.ts",
      providers: [
        {
          provider: "stripe",
          options: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            apiVersion: "2025-02-24",
          },
        },
      ],
    });

    console.log("Sync result:", result);
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

syncPricing();
```

## Adding Your Own Provider

You can extend the library with your own providers by implementing the `ProviderClient` interface:

```typescript
import { ProviderClient, Product, Price } from "prices-as-code";

export class MyCustomProvider implements ProviderClient {
  constructor(options: any) {
    // Initialize your provider client
  }

  async syncProducts(products: Product[]): Promise<Product[]> {
    // Implement product synchronization
    return products;
  }

  async syncPrices(prices: Price[]): Promise<Price[]> {
    // Implement price synchronization
    return prices;
  }
}
```

## 📖 Documentation

Visit our [documentation website](https://wickdninja.github.io/prices-as-code) for comprehensive guides and API reference.

### Guides

- [Getting Started](https://wickdninja.github.io/prices-as-code/guides/getting-started)
- [Configuration Format](https://wickdninja.github.io/prices-as-code/guides/configuration-file)
- [Command Line Interface](https://wickdninja.github.io/prices-as-code/guides/cli)
- [Custom Providers](https://wickdninja.github.io/prices-as-code/guides/custom-providers)
- [CI/CD Integration](https://wickdninja.github.io/prices-as-code/guides/ci-cd)
- [Working with Metadata](https://wickdninja.github.io/prices-as-code/guides/metadata)
- [Custom Pricing Logic](https://wickdninja.github.io/prices-as-code/guides/custom-pricing)

### API Reference

- [Main API](https://wickdninja.github.io/prices-as-code/api)
- [Stripe Provider](https://wickdninja.github.io/prices-as-code/providers/stripe)

## 🧩 Why Prices as Code?

Managing pricing configurations across multiple systems is challenging. Prices as Code provides:

1. **Single Source of Truth**: Define your pricing once, deploy everywhere
2. **Type Safety**: Catch errors before they happen with TypeScript validation
3. **Version Control**: Track pricing changes alongside your codebase
4. **CI/CD Integration**: Automate pricing updates as part of your deployment pipeline

## 📄 License

MIT
