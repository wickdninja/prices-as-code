/**
 * Core module tests
 */
import { loadEnvironment, pricesAsCode } from '../../core.js';
import { Config } from '../../types.js';
import * as loader from '../../loader.js';

describe('Core Module', () => {
  const mockConfig: Config = {
    products: [
      {
        provider: 'stripe',
        name: 'Test Product',
        description: 'A test product'
      }
    ],
    prices: [
      {
        provider: 'stripe',
        name: 'Test Price',
        nickname: 'Test Price',
        unitAmount: 1000,
        currency: 'usd',
        type: 'recurring',
        recurring: {
          interval: 'month',
          intervalCount: 1
        }
      }
    ]
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.restoreAllMocks();
  });
  
  describe('loadEnvironment', () => {
    test('should set default options', () => {
      const options = loadEnvironment();
      expect(options).toHaveProperty('configPath');
      expect(options).toHaveProperty('providers');
    });
  });
  
  describe('pricesAsCode', () => {
    test('should respect writeBack=false and not call writeConfigToFile', async () => {
      // Mock dependencies
      jest.spyOn(loader, 'readConfigFromFile').mockResolvedValue(mockConfig);
      jest.spyOn(loader, 'writeConfigToFile').mockResolvedValue();
      
      // Mock provider initialization
      jest.mock('../../providers/index.js', () => ({
        initializeProviders: () => ({
          providers: {
            stripe: {
              syncProducts: async (products: any[]) => products.map(p => ({ ...p, id: 'prod_123' })),
              syncPrices: async (prices: any[]) => prices.map(p => ({ ...p, id: 'price_123' }))
            }
          }
        })
      }), { virtual: true });
      
      // Run with writeBack=false (default)
      await pricesAsCode({ 
        configPath: 'test.ts',
        providers: [{ provider: 'stripe', options: { secretKey: 'test_key' } }],
        writeBack: false
      });
      
      // Verify writeConfigToFile was not called
      expect(loader.writeConfigToFile).not.toHaveBeenCalled();
    });
    
    test('should respect writeBack=true and call writeConfigToFile', async () => {
      // Mock dependencies
      jest.spyOn(loader, 'readConfigFromFile').mockResolvedValue(mockConfig);
      jest.spyOn(loader, 'writeConfigToFile').mockResolvedValue();
      
      // Mock syncProviders to return updated config and configUpdated=true
      const updatedConfig = {
        products: mockConfig.products.map(p => ({ ...p, id: 'prod_123' })),
        prices: mockConfig.prices.map(p => ({ ...p, id: 'price_123' }))
      };
      
      jest.mock('../../providers/index.js', () => ({
        initializeProviders: () => ({
          providers: {
            stripe: {
              syncProducts: async (products: any[]) => products.map(p => ({ ...p, id: 'prod_123' })),
              syncPrices: async (prices: any[]) => prices.map(p => ({ ...p, id: 'price_123' }))
            }
          }
        })
      }), { virtual: true });
      
      // Run with writeBack=true
      await pricesAsCode({ 
        configPath: 'test.ts',
        providers: [{ provider: 'stripe', options: { secretKey: 'test_key' } }],
        writeBack: true
      });
      
      // Verify writeConfigToFile was called
      expect(loader.writeConfigToFile).toHaveBeenCalled();
    });
  });
});