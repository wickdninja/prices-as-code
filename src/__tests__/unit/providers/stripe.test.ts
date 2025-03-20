/**
 * Stripe provider tests
 */
import { StripeProvider } from '../../../providers/stripe.js';
import { StripeProduct, StripePrice } from '../../../types.js';
import Stripe from 'stripe';

// Mock Stripe class
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      products: {
        create: jest.fn(),
        update: jest.fn(),
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'prod_123',
              name: 'Test Product',
              description: 'A test product',
              active: true,
              created: 1617994800,
              metadata: {
                key: 'test_product',
                features: JSON.stringify(['Feature 1', 'Feature 2']),
                highlight: 'true'
              }
            },
            {
              id: 'prod_456',
              name: 'Another Product',
              description: 'Another test product',
              active: true,
              created: 1617994801,
              metadata: {
                key: 'another_product'
              }
            }
          ],
          has_more: false
        })
      },
      prices: {
        create: jest.fn(),
        update: jest.fn(),
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'price_123',
              product: 'prod_123',
              nickname: 'Test Price',
              unit_amount: 1000,
              currency: 'usd',
              active: true,
              recurring: {
                interval: 'month',
                interval_count: 1
              },
              created: 1617994900,
              metadata: {
                key: 'test_price',
                original_name: 'Test Price'
              }
            },
            {
              id: 'price_456',
              product: 'prod_456',
              nickname: 'Another Price',
              unit_amount: 2000,
              currency: 'eur',
              active: true,
              created: 1617994901,
              metadata: {
                key: 'another_price'
              }
            }
          ],
          has_more: false
        })
      }
    };
  });
});

describe('Stripe Provider', () => {
  let provider: StripeProvider;
  
  beforeEach(() => {
    // Create a new instance of StripeProvider for each test
    provider = new StripeProvider({
      secretKey: 'test_key'
    });
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('fetchProducts', () => {
    test('should fetch products from Stripe', async () => {
      const products = await provider.fetchProducts();
      
      // Verify the API was called
      expect(Stripe.prototype.products.list).toHaveBeenCalledWith({
        limit: 100,
        active: true
      });
      
      // Verify the resulting products
      expect(products).toHaveLength(2);
      expect(products[0]).toMatchObject({
        provider: 'stripe',
        id: 'prod_123',
        name: 'Test Product',
        description: 'A test product',
        key: 'test_product',
        features: ['Feature 1', 'Feature 2'],
        highlight: true
      });
      
      expect(products[1]).toMatchObject({
        provider: 'stripe',
        id: 'prod_456',
        name: 'Another Product',
        description: 'Another test product',
        key: 'another_product'
      });
      
      // Verify metadata includes Stripe-specific fields
      expect(products[0].metadata).toHaveProperty('stripeCreated', '1617994800');
    });
    
    test('should handle pagination when fetching products', async () => {
      // Setup pagination mock
      const listMock = Stripe.prototype.products.list as jest.Mock;
      
      // First page
      listMock.mockResolvedValueOnce({
        data: [{ id: 'prod_page1', name: 'Page 1 Product', created: 123, metadata: {} }],
        has_more: true
      });
      
      // Second page
      listMock.mockResolvedValueOnce({
        data: [{ id: 'prod_page2', name: 'Page 2 Product', created: 456, metadata: {} }],
        has_more: false
      });
      
      const products = await provider.fetchProducts();
      
      // Should have made 2 API calls
      expect(listMock).toHaveBeenCalledTimes(2);
      expect(listMock.mock.calls[1][0]).toHaveProperty('starting_after', 'prod_page1');
      
      // Should have 2 products from both pages
      expect(products).toHaveLength(2);
      expect(products[0].id).toBe('prod_page1');
      expect(products[1].id).toBe('prod_page2');
    });
    
    test('should handle API errors when fetching products', async () => {
      // Make the API call throw an error
      const listMock = Stripe.prototype.products.list as jest.Mock;
      listMock.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(provider.fetchProducts()).rejects.toThrow('API Error');
    });
  });
  
  describe('fetchPrices', () => {
    test('should fetch prices from Stripe', async () => {
      // Mock fetchProducts since fetchPrices depends on productIdMap
      jest.spyOn(provider, 'fetchProducts').mockResolvedValueOnce([
        {
          provider: 'stripe',
          id: 'prod_123',
          key: 'test_product',
          name: 'Test Product',
          description: 'A test product',
          metadata: {}
        } as StripeProduct,
        {
          provider: 'stripe',
          id: 'prod_456',
          key: 'another_product',
          name: 'Another Product',
          description: 'Another product',
          metadata: {}
        } as StripeProduct
      ]);
      
      const prices = await provider.fetchPrices();
      
      // Verify the API was called
      expect(Stripe.prototype.prices.list).toHaveBeenCalledWith({
        limit: 100,
        active: true
      });
      
      // Verify fetchProducts was called to establish relationships
      expect(provider.fetchProducts).toHaveBeenCalled();
      
      // Verify the resulting prices
      expect(prices).toHaveLength(2);
      expect(prices[0]).toMatchObject({
        provider: 'stripe',
        id: 'price_123',
        name: 'Test Price',
        nickname: 'Test Price',
        unitAmount: 1000,
        currency: 'USD',
        type: 'recurring',
        recurring: {
          interval: 'month',
          intervalCount: 1
        },
        productId: 'prod_123',
        productKey: 'test_product'
      });
      
      expect(prices[1]).toMatchObject({
        provider: 'stripe',
        id: 'price_456',
        name: 'Another Price',
        nickname: 'Another Price',
        unitAmount: 2000,
        currency: 'EUR',
        type: 'one_time',
        productId: 'prod_456',
        productKey: 'another_product'
      });
      
      // Verify metadata includes Stripe-specific fields
      expect(prices[0].metadata).toHaveProperty('stripeCreated', '1617994900');
    });
    
    test('should fetch products first if productIdMap is empty', async () => {
      // Mock fetchProducts for testing
      jest.spyOn(provider, 'fetchProducts').mockResolvedValueOnce([
        {
          provider: 'stripe',
          id: 'prod_123',
          key: 'test_product',
          name: 'Test Product',
          description: 'A test product',
          metadata: {}
        } as StripeProduct
      ]);
      
      await provider.fetchPrices();
      
      // Should have called fetchProducts
      expect(provider.fetchProducts).toHaveBeenCalled();
    });
    
    test('should handle pagination when fetching prices', async () => {
      // Setup productIdMap first
      await provider.fetchProducts();
      
      // Setup pagination mock
      const listMock = Stripe.prototype.prices.list as jest.Mock;
      
      // First page
      listMock.mockResolvedValueOnce({
        data: [{ 
          id: 'price_page1', 
          product: 'prod_123', 
          nickname: 'Page 1 Price',
          unit_amount: 1000,
          currency: 'usd',
          created: 123,
          metadata: {} 
        }],
        has_more: true
      });
      
      // Second page
      listMock.mockResolvedValueOnce({
        data: [{ 
          id: 'price_page2', 
          product: 'prod_456', 
          nickname: 'Page 2 Price',
          unit_amount: 2000,
          currency: 'usd',
          created: 456,
          metadata: {} 
        }],
        has_more: false
      });
      
      const prices = await provider.fetchPrices();
      
      // Should have made 2 API calls (not counting the fetchProducts call)
      expect(listMock).toHaveBeenCalledTimes(3); // 1 from first test + 2 from this test
      expect(listMock.mock.calls[2][0]).toHaveProperty('starting_after', 'price_page1');
      
      // Should have 2 prices from both pages
      expect(prices).toHaveLength(2);
      expect(prices[0].id).toBe('price_page1');
      expect(prices[1].id).toBe('price_page2');
    });
    
    test('should handle API errors when fetching prices', async () => {
      // Mock fetchProducts to avoid dependency error
      jest.spyOn(provider, 'fetchProducts').mockResolvedValueOnce([]);
      
      // Make the API call throw an error
      const listMock = Stripe.prototype.prices.list as jest.Mock;
      listMock.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(provider.fetchPrices()).rejects.toThrow('API Error');
    });
  });
});