import Stripe from 'stripe';
import {
  StripeProduct,
  StripePrice,
  StripeOptions,
  StripeRecurring,
  Product,
  Price,
  PriceInterval,
  ProviderClient,
} from '../types.js';

/**
 * Stripe provider implementation
 */
export class StripeProvider implements ProviderClient {
  private client: Stripe;
  private productIdMap: Map<string, string> = new Map();

  constructor(options: StripeOptions) {
    this.client = new Stripe(options.secretKey, { apiVersion: '2023-10-16' });
  }

  getClient(): Stripe {
    return this.client;
  }
  
  /**
   * Fetch all products from Stripe
   */
  async fetchProducts(): Promise<Product[]> {
    console.log('📥 Fetching products from Stripe...');
    
    try {
      // Fetch existing products with pagination support
      const stripeProducts: Stripe.Product[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;
      
      while (hasMore) {
        const params: Stripe.ProductListParams = { limit: 100, active: true };
        if (startingAfter) {
          params.starting_after = startingAfter;
        }
        
        const response = await this.client.products.list(params);
        stripeProducts.push(...response.data);
        
        hasMore = response.has_more;
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📋 Found ${stripeProducts.length} products in Stripe`);
      
      // Convert Stripe products to our format
      const products: StripeProduct[] = stripeProducts.map(product => {
        // Build product from Stripe data
        const parsedFeatures = product.metadata?.features ? 
          JSON.parse(product.metadata.features as string) : [];
          
        const highlight = product.metadata?.highlight === 'true';
        
        // Generate a key or use the one from metadata
        const key = product.metadata?.key || product.name.toLowerCase().replace(/\s+/g, '_');
        
        // Store in mapping for prices lookup
        this.productIdMap.set(key, product.id);
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          provider: 'stripe',
          key: key,
          features: parsedFeatures,
          highlight,
          metadata: {
            ...product.metadata,
            stripeCreated: product.created.toString()
          }
        };
      });
      
      return products;
    } catch (error: any) {
      console.error(`❌ Error fetching products from Stripe: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Process products before sending to Stripe
   */
  private prepareProduct(product: StripeProduct): any {
    // Generate key if not present
    if (!product.key) {
      product.key = product.name.toLowerCase().replace(/\s+/g, '_');
    }

    // Process features for Stripe format
    const features = product.features;
    const featuresString = Array.isArray(features)
      ? JSON.stringify(features)
      : features || JSON.stringify([]);

    // Convert highlight to string for metadata
    const highlight =
      typeof product.highlight === 'boolean'
        ? product.highlight.toString()
        : product.highlight || 'false';

    // Prepare metadata including our custom fields
    const metadata = {
      ...product.metadata,
      key: product.key,
      features: featuresString,
      highlight,
    };

    return {
      name: product.name,
      description: product.description,
      metadata,
    };
  }

  /**
   * Synchronize products with Stripe
   */
  async syncProducts(products: Product[]): Promise<Product[]> {
    const stripeProducts = products.filter(
      (p) => p.provider === 'stripe'
    ) as StripeProduct[];
    const updatedProducts: StripeProduct[] = [];
    const otherProviderProducts = products.filter((p) => p.provider !== 'stripe');

    console.log(`🚀 Syncing ${stripeProducts.length} products to Stripe...`);
    
    if (stripeProducts.length === 0) {
      console.log('No Stripe products to sync');
      return products;
    }

    try {
      // Fetch existing products with pagination support
      const existingProducts: Stripe.Product[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;
      
      while (hasMore) {
        const params: Stripe.ProductListParams = { limit: 100 };
        if (startingAfter) {
          params.starting_after = startingAfter;
        }
        
        const response = await this.client.products.list(params);
        existingProducts.push(...response.data);
        
        hasMore = response.has_more;
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📋 Found ${existingProducts.length} existing products in Stripe`);

      for (const product of stripeProducts) {
        const transactionId = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        try {
          const preparedProduct = this.prepareProduct(product);
          const key = product.key || preparedProduct.metadata.key;

          console.log(`📋 [${transactionId}] Processing product: ${product.name} (key: ${key})`);

          // Find existing product by key in metadata
          const existingProduct = existingProducts.find(
            (p) => p.metadata && p.metadata.key === key
          );

          if (existingProduct) {
            console.log(`📋 [${transactionId}] Found existing product with key: ${key} (${existingProduct.id})`);

            // Update existing product
            const updated = await this.client.products.update(
              existingProduct.id,
              {
                ...preparedProduct,
                active: true,
              }
            );

            // Store the mapping
            this.productIdMap.set(key, updated.id);

            // Update product with Stripe ID
            updatedProducts.push({
              ...product,
              id: updated.id,
            });

            console.log(
              `✅ [${transactionId}] Updated product: ${product.name} (ID: ${updated.id})`
            );
          } else {
            console.log(`📋 [${transactionId}] Creating new product with key: ${key}`);

            // Create new product
            const newProduct = await this.client.products.create(preparedProduct);

            // Store the mapping
            this.productIdMap.set(key, newProduct.id);

            // Update product with Stripe ID
            updatedProducts.push({
              ...product,
              id: newProduct.id,
            });

            console.log(
              `✅ [${transactionId}] Created product: ${product.name} (ID: ${newProduct.id})`
            );
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Unknown error';
          const errorType = error?.type || 'unknown_type';
          const errorCode = error?.code || 'unknown_code';
          
          console.error(`❌ [${transactionId}] Error syncing product ${product.name}: ${errorType}/${errorCode} - ${errorMessage}`);
          
          // Mark this product as failed but preserve its data
          updatedProducts.push({
            ...product,
            metadata: {
              ...product.metadata,
              syncError: `${errorType}/${errorCode}: ${errorMessage}`,
              syncFailed: 'true'
            }
          });
        }
      }

      // Wait for all product operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify productIdMap has all expected keys
      for (const product of stripeProducts) {
        const key = product.key || product.name.toLowerCase().replace(/\s+/g, '_');
        if (!this.productIdMap.has(key) && !product.id) {
          console.warn(`⚠️ Missing product ID mapping for key: ${key}`);
        }
      }

      return [...updatedProducts, ...otherProviderProducts];
    } catch (error: any) {
      console.error(`❌ Fatal error in syncProducts: ${error?.message || error}`);
      // In case of fatal error, return original products
      return products;
    }
  }

  /**
   * Process prices before sending to Stripe
   */
  private preparePrice(price: StripePrice): Stripe.PriceCreateParams {
    let productId = price.productId;

    // Use productKey to look up ID if available
    if (price.productKey && !productId) {
      productId = this.productIdMap.get(price.productKey);

      if (!productId) {
        throw new Error(
          `Could not find Stripe product ID for key: ${price.productKey}. ` + 
          `Product ID map contains ${this.productIdMap.size} entries. ` +
          `Available keys: ${Array.from(this.productIdMap.keys()).join(', ')}`
        );
      }
    }

    if (!productId) {
      throw new Error(
        `No product ID or key specified for price: ${price.name}. ` +
        `Either productId or productKey must be provided.`
      );
    }

    // Ensure key is present and unique
    const key = price.key || `${price.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    // Validate required fields
    if (!price.currency || price.currency.length !== 3) {
      throw new Error(`Invalid currency for price ${price.name}: ${price.currency}. Must be 3-character ISO code.`);
    }

    if (typeof price.unitAmount !== 'number') {
      throw new Error(`Invalid unit amount for price ${price.name}: ${price.unitAmount}. Must be a number.`);
    }

    if (price.type === 'recurring' && !price.recurring) {
      throw new Error(`Price ${price.name} is marked as recurring but missing recurring configuration.`);
    }

    const priceData: Stripe.PriceCreateParams = {
      product: productId,
      nickname: price.nickname || price.name,
      unit_amount: price.unitAmount,
      currency: price.currency.toLowerCase(), // Ensure lowercase for consistency
      metadata: {
        ...price.metadata,
        key,
        original_name: price.name, // Store original name for reference
        created_at: new Date().toISOString(),
      },
      active: price.active !== false,
    };

    // Add tax behavior if specified
    if (price.taxBehavior) {
      priceData.tax_behavior = price.taxBehavior;
    }

    // Add billing scheme if specified
    if (price.billingScheme) {
      priceData.billing_scheme = price.billingScheme;
    }

    // Add recurring for subscription prices
    if (price.type === 'recurring' && price.recurring) {
      // Validate recurring configuration
      if (!['day', 'week', 'month', 'year'].includes(price.recurring.interval)) {
        throw new Error(
          `Invalid interval for recurring price ${price.name}: ${price.recurring.interval}. ` +
          `Must be one of 'day', 'week', 'month', 'year'.`
        );
      }

      priceData.recurring = {
        interval: price.recurring.interval,
        interval_count: price.recurring.intervalCount || 1,
      };

      // Add trial period if specified
      if (price.recurring.trialPeriodDays) {
        if (price.recurring.trialPeriodDays < 1 || price.recurring.trialPeriodDays > 365) {
          throw new Error(
            `Invalid trial period for price ${price.name}: ${price.recurring.trialPeriodDays}. ` +
            `Must be between 1 and 365.`
          );
        }
        priceData.recurring.trial_period_days = price.recurring.trialPeriodDays;
      }

      // Add usage type if specified
      if (price.recurring.usageType) {
        // Validate usage type
        if (!['licensed', 'metered'].includes(price.recurring.usageType)) {
          throw new Error(
            `Invalid usage type for price ${price.name}: ${price.recurring.usageType}. ` +
            `Must be either 'licensed' or 'metered'.`
          );
        }
        priceData.recurring.usage_type = price.recurring.usageType;
      }

      // Add aggregate usage if specified for metered prices
      if (price.recurring.aggregateUsage) {
        // Validate aggregate usage
        if (!['sum', 'last_during_period', 'last_ever', 'max'].includes(price.recurring.aggregateUsage)) {
          throw new Error(
            `Invalid aggregate usage for price ${price.name}: ${price.recurring.aggregateUsage}. ` +
            `Must be one of 'sum', 'last_during_period', 'last_ever', 'max'.`
          );
        }
        
        // Ensure usage_type is metered when aggregate_usage is set
        if (!price.recurring.usageType || price.recurring.usageType !== 'metered') {
          throw new Error(
            `Aggregate usage specified for price ${price.name} but usage type is not 'metered'.`
          );
        }
        
        priceData.recurring.aggregate_usage = price.recurring.aggregateUsage;
      }
    }

    return priceData;
  }

  /**
   * Synchronize prices with Stripe
   */
  /**
   * Fetch all prices from Stripe
   */
  async fetchPrices(): Promise<Price[]> {
    console.log('📥 Fetching prices from Stripe...');
    
    try {
      // Ensure we have products first
      if (this.productIdMap.size === 0) {
        console.log('📊 Fetching products first to establish relationships...');
        await this.fetchProducts();
      }
      
      // Fetch existing prices with pagination support
      const stripePrices: Stripe.Price[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;
      
      while (hasMore) {
        const params: Stripe.PriceListParams = { limit: 100, active: true };
        if (startingAfter) {
          params.starting_after = startingAfter;
        }
        
        const response = await this.client.prices.list(params);
        stripePrices.push(...response.data);
        
        hasMore = response.has_more;
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`💰 Found ${stripePrices.length} prices in Stripe`);
      
      // Create a reverse mapping from product ID to key
      const productKeyMap = new Map<string, string>();
      this.productIdMap.forEach((id, key) => {
        productKeyMap.set(id, key);
      });
      
      // Convert Stripe prices to our format
      const prices: StripePrice[] = stripePrices.map(price => {
        // Determine price type
        const type = price.recurring ? 'recurring' : 'one_time';
        
        // Build recurring configuration if needed
        let recurring: StripeRecurring | undefined;
        if (price.recurring) {
          recurring = {
            interval: price.recurring.interval as PriceInterval,
            intervalCount: price.recurring.interval_count !== null ? price.recurring.interval_count : 1,
            usageType: price.recurring.usage_type as 'licensed' | 'metered' | undefined,
            aggregateUsage: price.recurring.aggregate_usage as 'sum' | 'last_during_period' | 'last_ever' | 'max' | undefined,
            trialPeriodDays: price.recurring.trial_period_days !== null ? price.recurring.trial_period_days : undefined
          };
        }
        
        // Generate a key or use existing one
        const key = price.metadata?.key || 
          `${price.nickname?.toLowerCase().replace(/\s+/g, '_') || 'price'}_${Date.now()}`;
        
        // Find product key
        const productKey = productKeyMap.get(price.product as string);
        
        return {
          id: price.id,
          name: price.metadata?.original_name as string || price.nickname || 'Unnamed Price',
          nickname: price.nickname || '',
          unitAmount: price.unit_amount !== null ? price.unit_amount : 0,
          currency: price.currency.toUpperCase(),
          type,
          recurring,
          provider: 'stripe',
          active: price.active,
          key,
          productId: price.product as string,
          productKey,
          taxBehavior: price.tax_behavior as 'inclusive' | 'exclusive' | 'unspecified' | undefined,
          billingScheme: price.billing_scheme as 'per_unit' | 'tiered' | undefined,
          metadata: {
            ...price.metadata,
            stripeCreated: price.created.toString()
          }
        };
      });
      
      return prices;
    } catch (error: any) {
      console.error(`❌ Error fetching prices from Stripe: ${error?.message || error}`);
      throw error;
    }
  }
  
  async syncPrices(prices: Price[]): Promise<Price[]> {
    const stripePrices = prices.filter(
      (p) => p.provider === 'stripe'
    ) as StripePrice[];
    const updatedPrices: StripePrice[] = [];
    const otherProviderPrices = prices.filter((p) => p.provider !== 'stripe');

    console.log(`💰 Syncing ${stripePrices.length} prices to Stripe...`);
    
    if (stripePrices.length === 0) {
      console.log('No Stripe prices to sync');
      return prices;
    }
    
    // Verify product ID map is populated
    if (this.productIdMap.size === 0 && stripePrices.some(p => p.productKey && !p.productId)) {
      console.warn('⚠️ Product ID map is empty but prices reference products by key. This may cause errors.');
    }

    try {
      // Fetch existing prices with pagination support
      const existingPrices: Stripe.Price[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;
      
      while (hasMore) {
        const params: Stripe.PriceListParams = { limit: 100 };
        if (startingAfter) {
          params.starting_after = startingAfter;
        }
        
        const response = await this.client.prices.list(params);
        existingPrices.push(...response.data);
        
        hasMore = response.has_more;
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`💰 Found ${existingPrices.length} existing prices in Stripe`);

      for (const price of stripePrices) {
        const transactionId = `price_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        try {
          // Ensure the price has a valid key
          const key = price.key || `${price.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
          console.log(`💰 [${transactionId}] Processing price: ${price.name} (key: ${key})`);

          // Resolve product ID early to catch errors
          let productId = price.productId;
          if (price.productKey && !productId) {
            productId = this.productIdMap.get(price.productKey);
            
            if (!productId) {
              throw new Error(
                `Could not find Stripe product ID for key: ${price.productKey}. Ensure products are synced before prices.`
              );
            }
            console.log(`💰 [${transactionId}] Resolved product ID ${productId} from key ${price.productKey}`);
          }

          // Find existing price by key in metadata
          const existingPrice = existingPrices.find(
            (p) => p.metadata && p.metadata.key === key
          );

          if (existingPrice) {
            console.log(`💰 [${transactionId}] Found existing price with key: ${key} (${existingPrice.id})`);

            // Enhanced price attribute matching
            const priceMatchesConfig =
              existingPrice.unit_amount === price.unitAmount &&
              existingPrice.currency.toLowerCase() === price.currency.toLowerCase() &&
              (!price.recurring ||
                (existingPrice.recurring?.interval === price.recurring.interval &&
                existingPrice.recurring?.interval_count === price.recurring.intervalCount &&
                (!price.recurring.trialPeriodDays || 
                 existingPrice.recurring?.trial_period_days === price.recurring.trialPeriodDays) &&
                (!price.recurring.usageType || 
                 existingPrice.recurring?.usage_type === price.recurring.usageType) &&
                (!price.recurring.aggregateUsage || 
                 existingPrice.recurring?.aggregate_usage === price.recurring.aggregateUsage))) &&
              (!price.billingScheme || existingPrice.billing_scheme === price.billingScheme) &&
              (!price.taxBehavior || existingPrice.tax_behavior === price.taxBehavior);

            if (priceMatchesConfig) {
              console.log(
                `✅ [${transactionId}] Existing price matches config, updating metadata if needed`
              );

              // Update metadata
              await this.client.prices.update(existingPrice.id, {
                metadata: {
                  ...price.metadata,
                  key,
                },
                active: price.active !== false,
              });

              // Update price with Stripe ID
              updatedPrices.push({
                ...price,
                id: existingPrice.id,
                key,
              });
            } else {
              console.log(
                `⚠️ [${transactionId}] Existing price attributes don't match config, creating new version`
              );
              
              // Log the differences for debugging
              if (existingPrice.unit_amount !== price.unitAmount) {
                console.log(`  - Unit amount differs: ${existingPrice.unit_amount} vs ${price.unitAmount}`);
              }
              if (existingPrice.currency.toLowerCase() !== price.currency.toLowerCase()) {
                console.log(`  - Currency differs: ${existingPrice.currency} vs ${price.currency}`);
              }
              if (price.recurring && existingPrice.recurring) {
                if (existingPrice.recurring.interval !== price.recurring.interval) {
                  console.log(`  - Interval differs: ${existingPrice.recurring.interval} vs ${price.recurring.interval}`);
                }
                if (existingPrice.recurring.interval_count !== price.recurring.intervalCount) {
                  console.log(`  - Interval count differs: ${existingPrice.recurring.interval_count} vs ${price.recurring.intervalCount}`);
                }
              }

              // Create new price version
              const priceData = this.preparePrice(price);
              const newPrice = await this.client.prices.create(priceData);

              // Deactivate old price
              await this.client.prices.update(existingPrice.id, {
                active: false,
                metadata: {
                  ...existingPrice.metadata,
                  replaced_by: newPrice.id,
                },
              });

              // Update price with new Stripe ID
              updatedPrices.push({
                ...price,
                id: newPrice.id,
                key,
              });

              console.log(
                `✅ [${transactionId}] Created new price version: ${price.name} (ID: ${newPrice.id})`
              );
            }
          } else {
            console.log(`💰 [${transactionId}] Creating new price with key: ${key}`);

            // Create new price
            const priceData = this.preparePrice({...price, key});  // Ensure key is set
            const newPrice = await this.client.prices.create(priceData);

            // Update price with new Stripe ID
            updatedPrices.push({
              ...price,
              id: newPrice.id,
              key,
            });

            console.log(`✅ [${transactionId}] Created price: ${price.name} (ID: ${newPrice.id})`);
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Unknown error';
          const errorType = error?.type || 'unknown_type';
          const errorCode = error?.code || 'unknown_code';
          
          console.error(`❌ [${transactionId}] Error syncing price ${price.name}: ${errorType}/${errorCode} - ${errorMessage}`);
          
          // Mark this price as failed but preserve its data
          updatedPrices.push({
            ...price,
            metadata: {
              ...price.metadata,
              syncError: `${errorType}/${errorCode}: ${errorMessage}`,
              syncFailed: 'true'
            }
          });
        }
      }

      // Wait for all price operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [...updatedPrices, ...otherProviderPrices];
    } catch (error: any) {
      console.error(`❌ Fatal error in syncPrices: ${error?.message || error}`);
      // In case of fatal error, return original prices
      return prices;
    }
  }
}
