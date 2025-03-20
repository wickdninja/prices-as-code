/**
 * Core module tests
 */
import { loadEnvironment, pricesAsCode, pullFromProviders } from '../../core.js';
import { Config, PaCOptions } from '../../types.js';
import * as loader from '../../loader.js';
import * as providers from '../../providers/index.js';

describe('Core Module', () => {
  const mockConfig: Config = {
    products: [
      {
        provider: 'stripe',
        name: 'Test Product',
        description: 'A test product',
        metadata: {}
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
        active: true,
        metadata: {},
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

    test('should set format option with default yaml', () => {
      const options = loadEnvironment();
      expect(options).toHaveProperty('format', 'yaml');
    });

    test('should use provided format option', () => {
      const options = loadEnvironment({ format: 'ts' });
      expect(options).toHaveProperty('format', 'ts');
    });
  });
  
  describe('pricesAsCode', () => {
    test('should pass a placeholder test', () => {
      expect(true).toBe(true);
    });
  });

  describe('pullFromProviders', () => {
    // Mock provider that returns predefined products and prices
    const mockProvider = {
      fetchProducts: jest.fn().mockResolvedValue([
        {
          provider: 'stripe',
          id: 'prod_123',
          name: 'Pulled Product',
          description: 'A pulled product',
          key: 'pulled_product',
          metadata: {}
        }
      ]),
      fetchPrices: jest.fn().mockResolvedValue([
        {
          provider: 'stripe',
          id: 'price_123',
          name: 'Pulled Price',
          nickname: 'Pulled Price',
          unitAmount: 2000,
          currency: 'USD',
          type: 'recurring',
          active: true,
          productId: 'prod_123',
          metadata: {},
          recurring: {
            interval: 'month',
            intervalCount: 1
          }
        }
      ]),
      syncProducts: jest.fn(),
      syncPrices: jest.fn()
    };

    beforeEach(() => {
      // Mock the initializeProviders function
      jest.spyOn(providers, 'initializeProviders').mockReturnValue({
        providers: {
          stripe: mockProvider
        },
        clients: {}
      });

      // Mock the writeConfigToFile function
      jest.spyOn(loader, 'writeConfigToFile').mockResolvedValue();
    });

    test('should pull products and prices from providers', async () => {
      const options: PaCOptions = {
        configPath: 'test-config.yml',
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test-key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };

      const result = await pullFromProviders(options);

      expect(providers.initializeProviders).toHaveBeenCalled();
      expect(mockProvider.fetchProducts).toHaveBeenCalled();
      expect(mockProvider.fetchPrices).toHaveBeenCalled();
      
      expect(result.config).toEqual({
        products: [
          {
            provider: 'stripe',
            id: 'prod_123',
            name: 'Pulled Product',
            description: 'A pulled product',
            key: 'pulled_product',
            metadata: {}
          }
        ],
        prices: [
          {
            provider: 'stripe',
            id: 'price_123',
            name: 'Pulled Price',
            nickname: 'Pulled Price',
            unitAmount: 2000,
            currency: 'USD',
            type: 'recurring',
            active: true,
            productId: 'prod_123',
            metadata: {},
            recurring: {
              interval: 'month',
              intervalCount: 1
            }
          }
        ]
      });
      expect(result.configPath).toBe('test-config.yml');
    });

    test('should write config to file if configPath is provided', async () => {
      const options: PaCOptions = {
        configPath: 'test-config.yml',
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test-key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };

      await pullFromProviders(options);

      expect(loader.writeConfigToFile).toHaveBeenCalledWith('test-config.yml', expect.any(Object));
    });

    test('should adjust file extension based on format', async () => {
      const options: PaCOptions = {
        configPath: 'test-config.yml',
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test-key'
            }
          }
        ],
        format: 'json',
        writeBack: false
      };

      await pullFromProviders(options);

      // Should adjust to .json extension
      expect(loader.writeConfigToFile).toHaveBeenCalledWith('test-config.json', expect.any(Object));
    });

    test('should not write config to file if configPath is not provided', async () => {
      const options: PaCOptions = {
        configPath: '',
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test-key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };

      await pullFromProviders(options);

      expect(loader.writeConfigToFile).not.toHaveBeenCalled();
    });

    test('should handle error in provider fetch', async () => {
      // Make fetchProducts throw an error
      mockProvider.fetchProducts.mockRejectedValueOnce(new Error('API Error'));

      const options: PaCOptions = {
        configPath: 'test-config.yml',
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test-key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };

      await expect(pullFromProviders(options)).rejects.toThrow('API Error');
    });
  });
});