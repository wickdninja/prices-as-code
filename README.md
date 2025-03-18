# Stripe-PaC (Prices as Code)

Define your Stripe products and prices as YAML code, similar to Infrastructure as Code (IaC), but for Stripe pricing.

## Features

- Define your Stripe products and prices in YAML format
- Synchronize your pricing configuration with Stripe
- Automatically handle updating existing products and creating new prices
- Track changes to your pricing structure in version control
- Use metadata-based keys for stable references

## Installation

```bash
npm install stripe-pac
```

## Usage

### 1. Create a YAML Configuration File

Create a `prices.yml` file in your project:

```yaml
products:
  - name: Free Plan
    description: Basic features for individuals
    metadata:
      key: free
      features:
        - Core feature 1
        - Core feature 2
      highlight: false

  - name: Pro Plan
    description: Advanced features for professionals
    metadata:
      key: pro
      features:
        - Core feature 1
        - Core feature 2
        - Pro feature 1
        - Pro feature 2
      highlight: true

prices:
  - nickname: Free Monthly
    unit_amount: 0
    currency: usd
    type: recurring
    active: true
    product_well_known_id: free
    recurring:
      interval: month
      interval_count: 1
    metadata:
      plan_code: free_monthly
      tier: free

  - nickname: Pro Monthly
    unit_amount: 1999
    currency: usd
    type: recurring
    active: true
    product_well_known_id: pro
    recurring:
      interval: month
      interval_count: 1
    metadata:
      plan_code: pro_monthly
      tier: pro
```

### 2. Use the Library in Your Code

```javascript
import { stripePaC } from 'stripe-pac';

async function syncPricing() {
  try {
    // Make sure STRIPE_SECRET_KEY is in your .env file
    const result = await stripePaC({
      configPath: './prices.yml', // Path to your YAML config
    });
    
    console.log('Sync completed!');
    console.log(`Updated products: ${result.config.products.length}`);
    console.log(`Updated prices: ${result.config.prices.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

syncPricing();
```

### 3. Using the CLI Tool

You can also use the included CLI tool:

```bash
# Using npx
npx stripe-pac ./prices.yml

# Or if installed globally
stripe-pac ./prices.yml

# Specify an environment file
stripe-pac ./prices.yml --env=.env.production
```

## Configuration

### Products

Properties for products:

- `name`: The name of the product
- `description`: A description of the product
- `metadata`: Additional data to associate with the product
  - `key`: A unique identifier for the product (generated from name if not provided)
  - `features`: List of features (can be an array or JSON string)
  - `highlight`: Whether to highlight this product (boolean or string)

### Prices

Properties for prices:

- `nickname`: The display name of the price
- `unit_amount`: The price amount in cents
- `currency`: The three-letter ISO currency code
- `type`: Either `'one_time'` or `'recurring'`
- `active`: Whether the price is active
- `product_well_known_id`: The key of the product this price belongs to
- `recurring`: For recurring prices
  - `interval`: Billing frequency (`'day'`, `'week'`, `'month'` or `'year'`)
  - `interval_count`: Number of intervals between billings
- `metadata`: Additional data to associate with the price
  - `key`: A unique identifier for the price (generated from plan_code if not provided)
  - `plan_code`: A code for the plan (recommended)
  - Any other metadata you want to store

## License

MIT