---
layout: default
title: Providers
nav_order: 4
has_children: true
permalink: /providers
---

# Providers

Prices as Code supports multiple billing providers, allowing you to synchronize your pricing configuration across different platforms.

{: .note }
Each provider has specific configuration options and capabilities. Check the provider-specific documentation for details.

<div class="provider-grid">
  <div class="provider-card">
    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe Logo">
    <h3>Stripe</h3>
    <p>Synchronize products and prices with Stripe's billing platform</p>
    <a href="stripe.html" class="btn">View Docs</a>
  </div>
</div>

## Adding Custom Providers

You can extend Prices as Code with your own custom providers by implementing the `ProviderClient` interface.

See the [Custom Providers Guide](../guides/custom-providers.html) for detailed instructions.

## Provider Configuration

Each provider requires specific configuration in your PaC setup:

<div class="tabs">
  <div class="tab-label" data-tab="env-vars">Environment Variables</div>
  <div class="tab-label" data-tab="code-config">Code Configuration</div>
  
  <div id="env-vars" class="tab-content">
    <p>The simplest way to configure providers is through environment variables:</p>
    
    {% highlight bash %}
    # .env file
    STRIPE_SECRET_KEY=sk_test_your_key
    STRIPE_API_VERSION=2025-02-24
    {% endhighlight %}
  </div>
  
  <div id="code-config" class="tab-content">
    <p>You can also specify provider configuration in your code:</p>
    
    {% highlight typescript %}
    import { pac } from 'prices-as-code';

    await pac({
      configPath: './pricing.ts',
      providers: [
        {
          provider: 'stripe',
          options: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            apiVersion: '2025-02-24'
          }
        }
      ]
    });
    {% endhighlight %}
  </div>
</div>

{: .warning }
Never commit API keys or sensitive credentials to version control. Always use environment variables or secure secret management.

## Interactive Price Calculator

Try our interactive pricing calculator to see how you might structure your own pricing tiers:

{% include pricing-calculator.html %}

<style>
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.provider-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.provider-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.provider-card img {
  height: 60px;
  margin-bottom: 1rem;
}

.provider-card .btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #0366d6;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
}
</style>