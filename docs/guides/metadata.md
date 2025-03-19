---
layout: default
title: Working with Metadata
parent: Guides
parent_page: index.md
nav_order: 4
---

# Working with Metadata

Metadata provides a powerful way to extend the functionality of your pricing configuration. This guide explores how to use metadata effectively in Prices as Code.

## What is Metadata?

Metadata is custom data that you can attach to products and prices. While the core properties of products and prices are standardized across providers, metadata allows you to include additional information that might be specific to your application or business logic.

## Adding Metadata to Products and Prices

You can add metadata to both products and prices in your configuration file:

```typescript
// In TypeScript/JavaScript
const config: Config = {
  products: [
    {
      provider: 'stripe',
      name: 'Premium Plan',
      description: 'For demanding users',
      // Metadata field for products
      metadata: {
        displayOrder: 3,
        marketingName: 'Premium Experience',
        recommendedFor: 'power-users',
        featureFlags: ['priority-support', 'advanced-analytics']
      }
    }
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'Premium Annual',
      unitAmount: 29900,
      currency: 'usd',
      // Metadata field for prices
      metadata: {
        displayName: 'Premium Annual Plan',
        promotionEligible: true,
        discountCode: 'PREMIUM20',
        legacyId: '12345'
      }
    }
  ]
};
```

In YAML format:

```yaml
products:
  - provider: stripe
    name: Premium Plan
    description: For demanding users
    metadata:
      displayOrder: 3
      marketingName: Premium Experience
      recommendedFor: power-users
      featureFlags:
        - priority-support
        - advanced-analytics

prices:
  - provider: stripe
    name: Premium Annual
    unitAmount: 29900
    currency: usd
    metadata:
      displayName: Premium Annual Plan
      promotionEligible: true
      discountCode: PREMIUM20
      legacyId: '12345'
```

## Provider Support for Metadata

Most pricing providers support metadata, but with some limitations:

| Provider | Support | Limitations |
|----------|---------|-------------|
| Stripe | Full support | Max 50 keys, keys <= 40 chars, values <= 500 chars |
| Recurly | Partial support | Called 'custom fields', need to be pre-defined |
| Custom Providers | Custom implementation | Depends on your implementation |

## Common Use Cases for Metadata

### UI Display Configuration

Metadata is commonly used to control how products and prices are displayed in your UI:

```typescript
metadata: {
  displayOrder: 2,         // Control sorting order
  highlight: true,          // Highlight this option
  recommendedFor: 'teams',  // Add targeting information
  badge: 'Most Popular',    // Display a badge
  colorScheme: 'premium'    // Custom styling
}
```

### Marketing and Analytics

Tracking information for marketing campaigns and analytics:

```typescript
metadata: {
  campaign: 'summer_2023',
  segment: 'enterprise',
  conversionPath: 'blog_post',
  experimentVariant: 'price_display_b'
}
```

### Integration with Other Systems

Metadata can help with integrating your pricing with other systems:

```typescript
metadata: {
  accountingCode: 'PRO-SUB-001',
  taxCategory: 'software_service',
  inventoryId: 'digital-sub-001',
  legacyProductId: '12345'
}
```

### Feature Flags and Entitlements

Track what features or entitlements come with a specific product:

```typescript
metadata: {
  features: ['api_access', 'priority_support', 'white_labeling'],
  apiRequestLimit: '10000',
  storageLimit: '500GB',
  userSeats: 'unlimited'
}
```

## Accessing Metadata in Your Application

### Client-Side Usage

When building pricing pages or management interfaces:

```typescript
// Example with React
function PricingTier({ product }) {
  const { metadata } = product;
  
  return (
    <div className={`pricing-tier ${metadata.colorScheme}`}>
      {metadata.badge && <span className="badge">{metadata.badge}</span>}
      <h3>{product.name}</h3>
      {metadata.recommendedFor && (
        <p className="recommended-for">Recommended for: {metadata.recommendedFor}</p>
      )}
      {/* ... rest of component ... */}
    </div>
  );
}
```

### Server-Side Usage

Use metadata to determine business logic when processing subscriptions:

```typescript
async function handleSubscription(user, priceId) {
  // Fetch price details including metadata
  const price = await getPriceDetails(priceId);
  
  // Check if user qualifies for this price based on metadata
  if (price.metadata.minimumUserCount && 
      user.teamSize < price.metadata.minimumUserCount) {
    throw new Error('Your team is too small for this plan');
  }
  
  // Apply promotion if eligible
  let finalPrice = price.unitAmount;
  if (price.metadata.promotionEligible && user.hasPromoCode) {
    finalPrice = applyPromotion(finalPrice, user.promoCode);
  }
  
  // Proceed with subscription
  return createSubscription(user.id, priceId, finalPrice);
}
```

## Best Practices

1. **Document Your Metadata Schema**: Keep a central document explaining the metadata fields you use and their expected values.

2. **Be Consistent**: Use consistent naming conventions and structures across all products and prices.

3. **Don't Overload**: Keep metadata focused on necessary information. Don't use it for data that should be in your database.

4. **Validate Metadata**: Add validation to ensure your metadata meets your expectations and provider limitations.

5. **Version Control**: Consider adding a version field to your metadata to track changes over time.

## Next Steps

- Explore [Custom Pricing Logic](custom-pricing.html) for implementing complex pricing structures
- Learn about [CI/CD Integration](ci-cd.html) to automate your pricing updates
- See how to add [Custom Providers](custom-providers.html) with specialized metadata handling