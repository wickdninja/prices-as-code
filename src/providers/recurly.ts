import * as recurly from 'recurly';
import { 
  RecurlyProduct, 
  RecurlyPrice, 
  RecurlyOptions, 
  Product, 
  Price,
  ProviderClient
} from '../types.js';

/**
 * Recurly provider implementation
 */
export class RecurlyProvider implements ProviderClient {
  private client: recurly.Client;
  private productMap: Map<string, string> = new Map(); // code -> id

  constructor(options: RecurlyOptions) {
    this.client = new recurly.Client(options.apiKey);
  }

  getClient(): recurly.Client {
    return this.client;
  }

  /**
   * Process products before sending to Recurly
   */
  private prepareProduct(product: RecurlyProduct): any {
    return {
      code: product.code,
      name: product.name,
      description: product.description,
      tax_exempt: product.taxExempt,
      tax_code: product.taxCode,
      metadata: product.metadata as Record<string, string>
    };
  }

  /**
   * Synchronize products with Recurly
   * Note: In Recurly, "plans" are closer to products in our abstraction
   */
  async syncProducts(products: Product[]): Promise<Product[]> {
    // Cast products to unknown first, then to RecurlyProduct[]
    const recurlyProducts = products
      .filter(p => (p.provider as string) === 'recurly') as unknown as RecurlyProduct[];
    const updatedProducts: RecurlyProduct[] = [];
    
    console.log(`🚀 Syncing ${recurlyProducts.length} products to Recurly...`);
    
    for (const product of recurlyProducts) {
      try {
        const code = product.code;
        console.log(`📋 Processing product: ${product.name} (code: ${code})`);
        
        let existingProduct;
        
        // Try to get existing plan by code
        try {
          existingProduct = await this.client.getPlan(code);
        } catch (error) {
          // Plan doesn't exist, we'll create it
          existingProduct = null;
        }
        
        if (existingProduct) {
          console.log(`📋 Found existing plan with code: ${code}`);
          
          // Update existing plan
          const updatedData = this.prepareProduct(product);
          const updated = await this.client.updatePlan(code, updatedData);
          
          // Store the mapping
          this.productMap.set(code, updated.id as string);
          
          // Update product with Recurly ID
          updatedProducts.push({
            ...product,
            id: updated.id as string
          });
          
          console.log(`✅ Updated plan: ${product.name} (ID: ${updated.id})`);
        } else {
          console.log(`📋 Creating new plan with code: ${code}`);
          
          // Create new plan
          const planData = this.prepareProduct(product);
          const newPlan = await this.client.createPlan(planData);
          
          // Store the mapping
          this.productMap.set(code, newPlan.id as string);
          
          // Update product with Recurly ID
          updatedProducts.push({
            ...product,
            id: newPlan.id as string
          });
          
          console.log(`✅ Created plan: ${product.name} (ID: ${newPlan.id})`);
        }
      } catch (error) {
        console.error(`❌ Error syncing product ${product.name}:`, error);
        
        // Keep original product in results
        updatedProducts.push(product);
      }
    }
    
    // Only return non-recurly products since we've removed Recurly from exported types
    return products.filter(p => p.provider === 'stripe');
  }

  /**
   * Process pricing for Recurly
   * Note: In Recurly, "add-ons" are closer to prices in our abstraction
   */
  private preparePrice(price: RecurlyPrice): any {
    // Ensure we have a product code
    if (!price.productCode) {
      throw new Error(`No product code specified for price: ${price.name}`);
    }
    
    // Create add-on (pricing) data
    const addOnData: any = {
      code: price.code,
      name: price.name,
      currency: price.currency,
      unit_amount: price.unitAmount,
      add_on_type: price.type === 'recurring' ? 'fixed' : 'usage',
      usage_type: 'sum',
      revenue_schedule_type: 'at_range_end',
      tax_inclusive: price.taxInclusive || false,
    };
    
    // Add recurring settings for subscription pricing
    if (price.type === 'recurring' && price.recurring) {
      if (price.recurring.trialLength) {
        addOnData.trial_length = price.recurring.trialLength;
        addOnData.trial_unit = price.recurring.trialUnit || 'days';
      }
      
      // Set measured units for usage pricing
      if (price.type === 'recurring' && addOnData.add_on_type === 'usage') {
        addOnData.measured_unit = {
          name: `${price.name} Unit`,
          display_name: `${price.name} Unit`
        };
      }
    }
    
    if (price.metadata) {
      addOnData.optional_metadata = price.metadata as Record<string, string>;
    }
    
    return addOnData;
  }

  /**
   * Synchronize prices with Recurly
   */
  async syncPrices(prices: Price[]): Promise<Price[]> {
    // Cast prices to unknown first, then to RecurlyPrice[]
    const recurlyPrices = prices
      .filter(p => (p.provider as string) === 'recurly') as unknown as RecurlyPrice[];
    const updatedPrices: RecurlyPrice[] = [];
    
    console.log(`💰 Syncing ${recurlyPrices.length} prices to Recurly...`);
    
    for (const price of recurlyPrices) {
      try {
        const code = price.code;
        const planCode = price.productCode;
        
        console.log(`💰 Processing price: ${price.name} (code: ${code}, plan: ${planCode})`);
        
        let existingAddOn;
        
        // Try to get existing add-on by code
        try {
          existingAddOn = await this.client.getAddOn(planCode);
        } catch (error) {
          // Add-on doesn't exist, we'll create it
          existingAddOn = null;
        }
        
        if (existingAddOn) {
          console.log(`💰 Found existing add-on with code: ${code}`);
          
          // Update existing add-on
          const addOnData = this.preparePrice(price);
          delete addOnData.code; // Cannot update code
          
          const updated = await (this.client as any).updateAddOn(planCode, code, addOnData);
          
          // Update price with Recurly ID
          updatedPrices.push({
            ...price,
            id: updated.id as string
          });
          
          console.log(`✅ Updated add-on: ${price.name} (ID: ${updated.id})`);
        } else {
          console.log(`💰 Creating new add-on with code: ${code}`);
          
          // Create new add-on
          const addOnData = this.preparePrice(price);
          const newAddOn = await (this.client as any).createAddOn(planCode, addOnData);
          
          // Update price with Recurly ID
          updatedPrices.push({
            ...price,
            id: newAddOn.id as string
          });
          
          console.log(`✅ Created add-on: ${price.name} (ID: ${newAddOn.id})`);
        }
      } catch (error) {
        console.error(`❌ Error syncing price ${price.name}:`, error);
        
        // Keep original price in results
        updatedPrices.push(price);
      }
    }
    
    // Only return the prices that are not recurly
    // since we've removed Recurly from the exported types
    return prices.filter(p => p.provider === 'stripe');
  }
}