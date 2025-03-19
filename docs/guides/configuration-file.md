---
layout: default
title: Configuration File Format
parent: Guides
nav_order: 2
---

# Configuration File Format

Prices as Code supports multiple configuration file formats to define your pricing structure. Choose the format that best fits your workflow and preferences.

## Supported Formats

### TypeScript (.ts)

Using TypeScript provides type safety and IDE completion, making it easier to avoid configuration errors.

```typescript
import { Config } from 'prices-as-code';

const config: Config = {
  products: [
    // Products configuration
  ],
  prices: [
    // Prices configuration
  ]
};

export default config;
```

### JavaScript (.js)

JavaScript configuration works similarly to TypeScript but without static typing.

```javascript
const config = {
  products: [
    // Products configuration
  ],
  prices: [
    // Prices configuration
  ]
};

module.exports = config;
```

### YAML (.yml, .yaml)

YAML provides a clean, readable format that's easy to edit and review.

```yaml
products:
  - provider: stripe
    name: Basic Plan
    # More product configuration

prices:
  - provider: stripe
    name: Basic Monthly
    # More price configuration
```

### JSON (.json)

JSON format is supported for environments where that's the preferred format.

```json
{
  "products": [
    {
      "provider": "stripe",
      "name": "Basic Plan",
      "description": "For individuals and small teams"
    }
  ],
  "prices": [
    {
      "provider": "stripe",
      "name": "Basic Monthly",
      "unitAmount": 999
    }
  ]
}
```

## Configuration Schema

### Products

The `products` array contains the definition of your product offerings:

| Property | Type | Description |
|----------|------|-------------|
| `provider` | string | The billing provider (e.g., 'stripe') |
| `name` | string | Product name |
| `description` | string | Product description |
| `features` | string[] | List of features included in this product |
| `highlight` | boolean | Whether to highlight this product in UI |
| `metadata` | object | Additional data associated with this product |

### Prices

The `prices` array contains the pricing details for your products:

| Property | Type | Description |
|----------|------|-------------|
| `provider` | string | The billing provider (e.g., 'stripe') |
| `name` | string | Price name |
| `nickname` | string | Short name for the price |
| `unitAmount` | number | Amount in smallest currency unit (e.g., cents) |
| `currency` | string | Three-letter currency code (e.g., 'usd') |
| `type` | string | Price type ('recurring' or 'one_time') |
| `recurring` | object | Recurring settings (for subscription prices) |
| `productKey` | string | Reference to the related product |
| `metadata` | object | Additional data associated with this price |

### Recurring Settings

For subscription prices, the `recurring` object includes:

| Property | Type | Description |
|----------|------|-------------|
| `interval` | string | Billing interval ('day', 'week', 'month', 'year') |
| `intervalCount` | number | Number of intervals between billings |
| `usageType` | string | (Optional) How usage is calculated ('metered' or 'licensed') |
| `aggregateUsage` | string | (Optional) How metered usage is aggregated |

## Environment Variables

Environment variables can be referenced in your configuration files using the `${ENV_VAR}` syntax in YAML/JSON, or `process.env.ENV_VAR` in JavaScript/TypeScript.

## Next Steps

- Learn about [Working with Metadata](metadata.html) for extended functionality
- See how to implement [Custom Pricing Logic](custom-pricing.html) for complex scenarios
- Explore the [Command Line Interface](cli.html) for more options