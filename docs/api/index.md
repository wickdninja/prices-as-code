---
layout: default
title: API Reference
nav_order: 3
permalink: /api
---

# API Reference

Prices as Code provides a JavaScript/TypeScript API for programmatically managing your pricing configuration.

{: .note }
This API reference covers the main functions and types provided by Prices as Code. For provider-specific APIs, see the [Providers](/providers) section.

## Main Functions

<div class="api-method">
  <div class="method-title">pac(options): Promise&lt;SyncResult&gt;</div>
  <div class="method-description">
    The main entry point for Prices as Code. This function synchronizes your pricing configuration with the specified providers.
  </div>
  
  <div class="parameters">
    <h4>Parameters</h4>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>options.configPath</code></td>
          <td><code>string</code></td>
          <td>Optional path to a configuration file (.ts, .js, .mjs, .yml, or .yaml)</td>
        </tr>
        <tr>
          <td><code>options.config</code></td>
          <td><code>Config</code></td>
          <td>Optional Config object (can be used instead of configPath)</td>
        </tr>
        <tr>
          <td><code>options.providers</code></td>
          <td><code>ProviderOptions[]</code></td>
          <td>Array of provider configurations</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="return-value">
    <h4>Return Value</h4>
    <p>Returns a <code>Promise&lt;SyncResult&gt;</code> with the results of the synchronization:</p>
    
    {% highlight typescript %}
    interface SyncResult {
      config: Config; // The final configuration after synchronization
      configUpdated: boolean; // Whether any changes were made
    }
    {% endhighlight %}
  </div>
  
  <div class="examples">
    <h4>Examples</h4>
    
    <div class="tabs">
      <div class="tab-label" data-tab="file-config">Using with a file</div>
      <div class="tab-label" data-tab="inline-config">Using with inline config</div>
      
      <div id="file-config" class="tab-content">
        {% highlight typescript %}
        import { pac } from 'prices-as-code';

        // Using with a configuration file
        const result = await pac({
          configPath: './pricing.ts',
          providers: [
            {
              provider: 'stripe',
              options: {
                secretKey: process.env.STRIPE_SECRET_KEY
              }
            }
          ]
        });
        {% endhighlight %}
      </div>
      
      <div id="inline-config" class="tab-content">
        {% highlight typescript %}
        import { pac } from 'prices-as-code';

        // Define your config object
        const myConfig = {
          products: [
            {
              provider: 'stripe',
              name: 'Basic Plan',
              description: 'For individuals and small teams'
            }
          ],
          prices: [
            {
              provider: 'stripe',
              name: 'Basic Monthly',
              unitAmount: 999,
              currency: 'usd',
              type: 'recurring',
              recurring: {
                interval: 'month'
              },
              productKey: 'basic_plan'
            }
          ]
        };

        // Using with an inline configuration
        const result = await pac({
          config: myConfig,
          providers: [
            {
              provider: 'stripe',
              options: {
                secretKey: process.env.STRIPE_SECRET_KEY
              }
            }
          ]
        });
        {% endhighlight %}
      </div>
    </div>
  </div>
</div>

## Configuration Types

<div class="api-method">
  <div class="method-title">Config</div>
  <div class="method-description">
    The main configuration type that defines products and prices.
  </div>
  
  {% highlight typescript %}
  interface Config {
    products: Product[]; // Array of products across all providers
    prices: Price[]; // Array of prices across all providers
  }
  {% endhighlight %}
</div>

<div class="api-method">
  <div class="method-title">Product</div>
  <div class="method-description">
    Union type for all supported provider product types.
  </div>
  
  {% highlight typescript %}
  type Product = StripeProduct;
  {% endhighlight %}
</div>

<div class="api-method">
  <div class="method-title">Price</div>
  <div class="method-description">
    Union type for all supported provider price types.
  </div>
  
  {% highlight typescript %}
  type Price = StripePrice;
  {% endhighlight %}
</div>

## Provider Client Interface

<div class="api-method">
  <div class="method-title">ProviderClient</div>
  <div class="method-description">
    Interface for implementing custom providers.
  </div>
  
  {% highlight typescript %}
  interface ProviderClient {
    syncProducts(products: Product[]): Promise<Product[]>;
    syncPrices(prices: Price[]): Promise<Price[]>;
  }
  {% endhighlight %}
  
  <div class="callout info">
    <div class="callout-title">Custom Providers</div>
    <p>For detailed instructions on implementing custom providers, see the <a href="../guides/custom-providers.html">Custom Providers Guide</a>.</p>
  </div>
</div>

## Type Helpers

<div class="api-method">
  <div class="method-title">zodProduct</div>
  <div class="method-description">
    Zod schema for validating product objects.
  </div>
  
  {% highlight typescript %}
  const myProductSchema = zodProduct();
  const isValid = myProductSchema.safeParse(productObject).success;
  {% endhighlight %}
</div>

<div class="api-method">
  <div class="method-title">zodPrice</div>
  <div class="method-description">
    Zod schema for validating price objects.
  </div>
  
  {% highlight typescript %}
  const myPriceSchema = zodPrice();
  const isValid = myPriceSchema.safeParse(priceObject).success;
  {% endhighlight %}
</div>

<div class="mermaid">
  graph TD
    A[Prices as Code] --> B[Configuration]
    B --> C[Products]
    B --> D[Prices]
    A --> E[Provider Clients]
    E --> F[Stripe Client]
    E --> G[Reserved]
    E --> H[Custom Clients]
    A --> I[Sync Process]
    I --> J[API Calls]
    I --> K[Reconciliation]
    I --> L[Error Handling]
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: true });
  }
});
</script>.