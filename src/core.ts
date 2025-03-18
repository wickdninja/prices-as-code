import Stripe from 'stripe';
import { StripePacConfig, StripePacOptions, SyncResult } from './types';
import { loadYamlConfig } from './loader';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Initialize Stripe with API key
 */
export function initializeStripe(options: StripePacOptions = {}): Stripe {
  let stripeSecretKey = options.stripeSecretKey;
  
  // If no key provided, try to load from environment
  if (!stripeSecretKey) {
    // Load environment variables if not already loaded
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not found. Please provide it in options or set in environment.');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: options.stripeApiVersion || '2025-02-24.acacia',
  });
}

/**
 * Process the configuration to ensure all required fields and references
 */
export function addWellKnownIds(config: StripePacConfig): StripePacConfig {
  // Parse features if they're strings
  config.products.forEach((product) => {
    if (typeof product.metadata.features === 'string') {
      try {
        product.metadata.features = JSON.parse(product.metadata.features as string);
      } catch (e) {
        // If it's not valid JSON, leave it as is
      }
    }
  });

  // Add key to products if not present
  config.products.forEach((product) => {
    if (!product.metadata.key) {
      // Generate a key based on the product name
      const name = product.name.toLowerCase().replace(/\s+/g, '_');
      product.metadata.key = name;
    }
  });

  // Add key to prices if not present
  config.prices.forEach((price) => {
    if (!price.metadata.key) {
      // Generate a key based on the plan_code
      const planCode =
        typeof price.metadata.plan_code === 'string'
          ? price.metadata.plan_code
          : price.metadata.plan_code?.toString();
      price.metadata.key = planCode || `price_${Date.now()}`;
    }

    // Fix for renamed products (example: "basic" -> "free")
    if (price.product_well_known_id === 'basic') {
      price.product_well_known_id = 'free';
    }

    // Save the product_well_known_id for later reference if it exists
    if (price.product_well_known_id) {
      // This property is just for our script - doesn't get sent to Stripe
      price._product_well_known_id = price.product_well_known_id;
      delete price.product_well_known_id; // Remove so it doesn't confuse Stripe
    }
  });

  return config;
}

/**
 * Sync products and prices to Stripe
 */
export async function syncStripe(
  stripe: Stripe,
  config: StripePacConfig
): Promise<SyncResult> {
  console.log('🚀 Starting Stripe sync with metadata-based IDs...');

  // First ensure all entities have keys
  config = addWellKnownIds(config);

  // Map to track product keys to Stripe IDs
  const productIdMap = new Map();
  let configUpdated = false;

  // Sync Products first using keys
  for (const product of config.products) {
    try {
      const key = product.metadata.key;
      console.log(`📋 Processing product: ${product.name} (key: ${key})`);

      // Search for product by well-known ID in metadata
      const productList = await stripe.products.list({
        limit: 100,
      });

      // Find product with matching key in metadata
      const existingProduct = productList.data.find(
        (p) => p.metadata && p.metadata.key === key
      );

      // Ensure features is an array before stringify
      let features = product.metadata.features;
      if (Array.isArray(features)) {
        features = JSON.stringify(features);
      } else if (typeof features === 'string') {
        // Leave it as is if it's already a string
      } else {
        features = JSON.stringify([]);
      }

      // Ensure highlight is a string
      let highlight = product.metadata.highlight;
      if (typeof highlight !== 'string') {
        highlight = highlight ? 'true' : 'false';
      }

      if (existingProduct) {
        console.log(`📋 Found existing product with key: ${key}`);

        // Update the product
        await stripe.products.update(existingProduct.id, {
          name: product.name,
          description: product.description,
          metadata: {
            ...product.metadata,
            features: features as string,
            highlight: highlight as string,
          },
          active: true,
        });

        // Store the mapping
        productIdMap.set(key, existingProduct.id);

        // Update our config with the Stripe ID if needed
        if (!product.id || product.id !== existingProduct.id) {
          product.id = existingProduct.id;
          configUpdated = true;
        }

        console.log(
          `✅ Updated product: ${product.name} (ID: ${existingProduct.id})`
        );
      } else {
        console.log(`📋 Creating new product with key: ${key}`);

        // Create a new product with the key
        const newProduct = await stripe.products.create({
          name: product.name,
          description: product.description,
          metadata: {
            ...product.metadata,
            features: features as string,
            highlight: highlight as string,
          },
        });

        // Store the mapping
        productIdMap.set(key, newProduct.id);

        // Update our config with the new ID
        product.id = newProduct.id;
        configUpdated = true;

        console.log(
          `✅ Created product: ${product.name} (ID: ${newProduct.id})`
        );
      }
    } catch (error) {
      console.error(`❌ Error syncing product ${product.name}:`, error);
    }
  }

  // Then sync Prices using keys
  for (const price of config.prices) {
    try {
      const wellKnownId = price.metadata.key;

      // First, try to use the explicit product_well_known_id we set earlier
      let productWellKnownId = price._product_well_known_id;
      let stripeProductId = null;

      // Get the product ID from our mapping
      if (productWellKnownId) {
        stripeProductId = productIdMap.get(productWellKnownId);
        console.log(
          `📋 Using product_well_known_id [${productWellKnownId}] for price [${price.nickname}]`
        );
      }

      // If we still don't have a product ID, it's an error
      if (!stripeProductId) {
        console.error(
          `❌ Could not determine product for price: ${price.nickname}`
        );
        continue;
      }

      console.log(
        `💰 Processing price: ${price.nickname} (key: ${wellKnownId})`
      );

      // Search for price by well-known ID in metadata
      const priceList = await stripe.prices.list({
        limit: 100,
      });

      // Find price with matching key in metadata
      const existingPrice = priceList.data.find(
        (p) => p.metadata && p.metadata.key === wellKnownId
      );

      if (existingPrice) {
        console.log(`💰 Found existing price with key: ${wellKnownId}`);

        // Prices are immutable, so we can only update certain fields like metadata
        const priceMatchesConfig =
          existingPrice.unit_amount === price.unit_amount &&
          existingPrice.currency === price.currency &&
          (!price.recurring ||
            (existingPrice.recurring?.interval === price.recurring.interval &&
              existingPrice.recurring?.interval_count ===
                price.recurring.interval_count));

        if (priceMatchesConfig) {
          console.log(
            `✅ Existing price matches config, updating metadata if needed`
          );

          // Update just the metadata if needed
          await stripe.prices.update(existingPrice.id, {
            metadata: price.metadata,
            active: price.active !== false,
          });

          // Update our config with the Stripe ID
          if (!price.id || price.id !== existingPrice.id) {
            price.id = existingPrice.id;
            configUpdated = true;
          }
        } else {
          console.log(
            `⚠️ Existing price attributes don't match config, creating new version`
          );

          // Create a new price with the same key but updated attributes
          const priceData: Stripe.PriceCreateParams = {
            product: stripeProductId,
            nickname: price.nickname,
            unit_amount: price.unit_amount,
            currency: price.currency,
            metadata: price.metadata,
            active: price.active !== false,
          };

          // Only add recurring for recurring prices
          if (price.type === 'recurring' && price.recurring) {
            priceData.recurring = price.recurring;
          }

          const newPrice = await stripe.prices.create(priceData);

          // Deactivate the old price
          await stripe.prices.update(existingPrice.id, {
            active: false,
            metadata: {
              ...existingPrice.metadata,
              replaced_by: newPrice.id,
            },
          });

          // Update our config with the new ID
          price.id = newPrice.id;
          configUpdated = true;

          console.log(
            `✅ Created new price version: ${price.nickname} (ID: ${newPrice.id})`
          );
        }
      } else {
        console.log(`💰 Creating new price with key: ${wellKnownId}`);

        // Create a new price with the key
        const priceData: Stripe.PriceCreateParams = {
          product: stripeProductId,
          nickname: price.nickname,
          unit_amount: price.unit_amount,
          currency: price.currency,
          metadata: price.metadata,
          active: price.active !== false,
        };

        // Only add recurring for recurring prices
        if (price.type === 'recurring' && price.recurring) {
          priceData.recurring = price.recurring;
        }

        const newPrice = await stripe.prices.create(priceData);

        // Update our config with the new ID
        price.id = newPrice.id;
        configUpdated = true;

        console.log(`✅ Created price: ${price.nickname} (ID: ${newPrice.id})`);
      }
    } catch (error) {
      console.error(`❌ Error syncing price ${price.nickname}:`, error);
    }
  }

  return { config, configUpdated };
}