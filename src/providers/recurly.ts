/**
 * NOTE: Recurly provider has been removed from the public API in v2.0.0.
 * This file is kept for future reference but is not used or exported.
 * 
 * For custom Recurly integration, see the Custom Providers Guide:
 * https://wickdninja.github.io/prices-as-code/guides/custom-providers.html
 */

// import * as recurly from 'recurly';
import { 
  RecurlyProduct, 
  RecurlyPrice, 
  RecurlyOptions, 
  Product, 
  Price,
  ProviderClient
} from '../types.js';

/**
 * Recurly provider implementation (DEPRECATED - Not used in v2.0.0+)
 */
export class RecurlyProvider implements ProviderClient {
  private client: any; // Changed from recurly.Client
  private productMap: Map<string, string> = new Map(); // code -> id

  constructor(options: RecurlyOptions) {
    // Mock client since recurly package is not included anymore
    this.client = {};
    console.warn('RecurlyProvider is deprecated and not supported in v2.0.0+');
  }

  getClient(): any {
    return this.client;
  }

  /**
   * Synchronize products with Recurly (STUB)
   */
  async syncProducts(products: Product[]): Promise<Product[]> {
    // Only return non-recurly products
    return products.filter(p => p.provider === 'stripe');
  }

  /**
   * Synchronize prices with Recurly (STUB)
   */
  async syncPrices(prices: Price[]): Promise<Price[]> {
    // Only return the prices that are not recurly
    return prices.filter(p => p.provider === 'stripe');
  }
}