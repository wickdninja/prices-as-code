---
layout: default
title: Custom Pricing Logic
parent: Guides
parent_page: index.md
nav_order: 5
---

# Custom Pricing Logic

While the standard pricing configurations cover many use cases, you might need more complex pricing structures. This guide explains how to implement custom pricing logic with Prices as Code.

## Beyond Simple Pricing

Simple pricing models like flat-rate subscriptions are straightforward to implement. However, many businesses require more sophisticated approaches:

- Tiered pricing based on usage
- Volume discounts
- Add-ons and upsells
- Custom pricing for specific customers
- Usage-based pricing with multiple dimensions

Prices as Code provides several ways to handle these scenarios.

## Tiered and Volume Pricing

### Tiered Pricing

With tiered pricing, different rates apply to different usage levels. For example, $10 for 1-100 units, $8 for 101-1000 units, etc.

```typescript
const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'API Access',
      description: 'Pay for what you use',
      // Product configuration...
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'API Requests Tiered',
      unitAmount: 0, // Zero base price
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
        usageType: 'metered',
        aggregateUsage: 'sum'
      },
      productKey: 'api_access',
      tiers: [
        {
          upTo: 1000,
          unitAmount: 10, // $0.10 per unit for first 1000
          flatAmount: 0   // No flat fee
        },
        {
          upTo: 10000,
          unitAmount: 5,  // $0.05 per unit for 1001-10000
          flatAmount: 0
        },
        {
          upTo: 'inf',   // Everything above 10000
          unitAmount: 1,  // $0.01 per unit
          flatAmount: 0
        }
      ]
    }
  ]
};
```

### Volume Pricing

With volume pricing, a single rate applies to all usage based on the total volume:

```typescript
const config: Config = {
  // Products configuration...
  prices: [
    {
      provider: 'stripe',
      name: 'Storage Volume Pricing',
      unitAmount: 0,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'cloud_storage',
      tiers: [
        {
          upTo: 100,       // GB of storage
          unitAmount: 50,  // $0.50 per GB
          flatAmount: 0
        },
        {
          upTo: 1000,
          unitAmount: 40,  // $0.40 per GB for all usage if between 101-1000 GB
          flatAmount: 0
        },
        {
          upTo: 'inf',
          unitAmount: 30,  // $0.30 per GB for all usage if over 1000 GB
          flatAmount: 0
        }
      ],
      volumeBasedTiers: true  // This enables volume-based pricing
    }
  ]
};
```

## Subscription Add-ons

Add-ons allow customers to enhance their base subscription:

```typescript
const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Team Plan',
      description: 'Base collaboration plan',
      // Product configuration...
    },
    {
      provider: 'stripe',
      name: 'Priority Support',
      description: 'Get faster response times',
      metadata: {
        addon: true,
        addonFor: ['team_plan', 'enterprise_plan']
      }
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Team Plan Monthly',
      unitAmount: 4900,
      currency: 'usd',
      // Price configuration...
      productKey: 'team_plan'
    },
    {
      provider: 'stripe',
      name: 'Priority Support Add-on',
      unitAmount: 1900,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'priority_support',
      metadata: {
        addon: true,
        displayName: 'Priority Support'
      }
    }
  ]
};
```

## Per-Seat Pricing

For products that charge based on the number of users or seats:

```typescript
const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Collaboration Suite',
      description: 'Team collaboration tools',
      // Product configuration...
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Per Seat Monthly',
      unitAmount: 1900, // $19 per seat
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
        usageType: 'licensed' // This makes it per-seat
      },
      productKey: 'collaboration_suite',
      metadata: {
        perSeat: true,
        minimumSeats: 5,
        displayName: 'Per User/Month'
      }
    }
  ]
};
```

## Multi-Dimension Pricing

Some products need to charge based on multiple dimensions of usage:

```typescript
const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Developer Platform',
      description: 'Complete development environment',
      // Product configuration...
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Base Platform Fee',
      unitAmount: 9900,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'developer_platform',
      metadata: {
        priceType: 'base',
        displayName: 'Base Platform Fee'
      }
    },
    {
      provider: 'stripe',
      name: 'Compute Usage',
      unitAmount: 0,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
        usageType: 'metered',
        aggregateUsage: 'sum'
      },
      productKey: 'developer_platform',
      tiers: [
        // Compute pricing tiers
      ],
      metadata: {
        dimension: 'compute',
        unit: 'compute-hours',
        displayName: 'Compute Usage'
      }
    },
    {
      provider: 'stripe',
      name: 'Storage Usage',
      unitAmount: 0,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1,
        usageType: 'metered',
        aggregateUsage: 'max'
      },
      productKey: 'developer_platform',
      tiers: [
        // Storage pricing tiers
      ],
      metadata: {
        dimension: 'storage',
        unit: 'GB',
        displayName: 'Storage Usage'
      }
    }
  ]
};
```

## Custom Price Calculation Logic

For the most complex pricing models, you can implement custom pricing calculation functions:

```typescript
import { Config, PriceCalculator } from 'prices-as-code';

// Custom price calculator
const enterprisePricing: PriceCalculator = {
  calculatePrice: (basePrice, quantity, customer) => {
    // Access customer-specific discount tiers
    const discountTier = customer.metadata.discountTier || 'standard';
    const discounts = {
      standard: 0,
      silver: 0.1,    // 10% discount
      gold: 0.15,     // 15% discount
      platinum: 0.25  // 25% discount
    };
    
    // Calculate volume discount
    let volumeDiscount = 0;
    if (quantity > 100) volumeDiscount = 0.05;
    if (quantity > 500) volumeDiscount = 0.1;
    
    // Apply discounts
    const tierDiscount = discounts[discountTier] || 0;
    const totalDiscount = tierDiscount + volumeDiscount;
    
    // Calculate final price with discount capped at 40%
    const maxDiscount = 0.4;
    const appliedDiscount = Math.min(totalDiscount, maxDiscount);
    
    return basePrice * quantity * (1 - appliedDiscount);
  }
};

// Attach the custom calculator to your price
const config: Config = {
  // Products configuration...
  prices: [
    {
      provider: 'stripe',
      name: 'Enterprise License',
      unitAmount: 99900, // Base price $999
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'year',
        intervalCount: 1
      },
      productKey: 'enterprise_software',
      customCalculator: enterprisePricing,
      metadata: {
        customPricing: true,
        negotiable: true
      }
    }
  ]
};
```

## Working with Trial Periods

You can configure trial periods for your subscription prices:

```typescript
const config: Config = {
  // Products configuration...
  prices: [
    {
      provider: 'stripe',
      name: 'Pro Plan with Trial',
      unitAmount: 4900,
      currency: 'usd',
      type: 'recurring',
      recurring: {
        interval: 'month',
        intervalCount: 1
      },
      productKey: 'pro_plan',
      trial: {
        days: 14,
        requiresPaymentMethod: false
      },
      metadata: {
        displayName: 'Pro Monthly (14-day free trial)'
      }
    }
  ]
};
```

## Data Models for Complex Pricing

For very complex pricing models, you might need to store additional data in your application database:

```typescript
// Example schema for customer-specific pricing
interface CustomerPricing {
  customerId: string;
  effectiveDate: Date;
  expirationDate?: Date;
  baseDiscount: number;
  volumeDiscounts: {
    threshold: number;
    discount: number;
  }[];
  customPrices: {
    priceId: string;
    unitAmount: number;
  }[];
  specialTerms: string;
}
```

## Integration with Your Application

To implement complex pricing in your application:

1. **Define base prices in Prices as Code**
2. **Use webhooks to track usage**
3. **Implement custom logic in your backend**
4. **Store customer-specific terms in your database**
5. **Apply custom pricing during checkout/subscription creation**

## Next Steps

- Learn about [Adding Custom Providers](custom-providers.html) to implement specialized pricing logic
- Explore [Working with Metadata](metadata.html) for extending your pricing functionality
- See how to integrate your pricing with [CI/CD](ci-cd.html) for automated updates