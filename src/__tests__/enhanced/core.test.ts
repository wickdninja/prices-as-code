/**
 * Enhanced tests for the core module
 */
import * as path from 'path';
import * as fs from 'fs';
import { pricesAsCode, pullFromProviders } from '../../core.js';
import { Config, PaCOptions } from '../../types.js';
import * as providers from '../../providers/index.js';

// Mock the providers module
jest.mock('../../providers/index.js', () => {
  // Create a mock provider client
  const mockProviderClient = {
    syncProducts: jest.fn().mockResolvedValue([]),
    syncPrices: jest.fn().mockResolvedValue([]),
    fetchProducts: jest.fn().mockResolvedValue([
      {
        provider: 'stripe',
        id: 'prod_123',
        name: 'Enhanced Test Product',
        description: 'A test product from enhanced tests',
        key: 'enhanced_test_product',
        metadata: {}
      }
    ]),
    fetchPrices: jest.fn().mockResolvedValue([
      {
        provider: 'stripe',
        id: 'price_123',
        name: 'Enhanced Test Price',
        nickname: 'Enhanced Test Price',
        unitAmount: 3000,
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
    ])
  };

  return {
    initializeProviders: jest.fn().mockReturnValue({
      providers: {
        stripe: mockProviderClient
      },
      clients: {}
    })
  };
});

// Mock the loader module
jest.mock('../../loader.js', () => {
  return {
    readConfigFromFile: jest.fn().mockResolvedValue({
      products: [],
      prices: []
    }),
    writeConfigToFile: jest.fn().mockResolvedValue(undefined)
  };
});

describe('Core Module Enhanced Tests', () => {
  const testDir = path.resolve(process.cwd(), 'tmp/test-output');
  const testConfigPath = path.resolve(testDir, 'test-config.yml');

  // Ensure test directory exists
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  // Clean up after tests
  afterEach(() => {
    jest.clearAllMocks();
    
    // Remove any test files created
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    
    const jsonPath = testConfigPath.replace('.yml', '.json');
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }
    
    const tsPath = testConfigPath.replace('.yml', '.ts');
    if (fs.existsSync(tsPath)) {
      fs.unlinkSync(tsPath);
    }
  });

  describe('pullFromProviders', () => {
    test('should pull data from providers and generate a config file', async () => {
      const options: PaCOptions = {
        configPath: testConfigPath,
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test_key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };

      const result = await pullFromProviders(options);

      // Check that providers were initialized
      expect(providers.initializeProviders).toHaveBeenCalledWith(options.providers);
      
      // Check that the product and price data was fetched
      const { providers: mockProviders } = providers.initializeProviders([]);
      expect(mockProviders.stripe.fetchProducts).toHaveBeenCalled();
      expect(mockProviders.stripe.fetchPrices).toHaveBeenCalled();
      
      // Check the result has the expected structure
      expect(result).toMatchObject({
        config: {
          products: [
            {
              id: 'prod_123',
              name: 'Enhanced Test Product',
              key: 'enhanced_test_product'
            }
          ],
          prices: [
            {
              id: 'price_123',
              name: 'Enhanced Test Price',
              unitAmount: 3000,
              currency: 'USD'
            }
          ]
        },
        configPath: testConfigPath
      });
    });
    
    test('should support different format options', async () => {
      // Test with JSON format
      const options: PaCOptions = {
        configPath: testConfigPath,
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test_key'
            }
          }
        ],
        format: 'json',
        writeBack: false
      };

      // Import the writeConfigToFile function from the loader module
      const { writeConfigToFile } = require('../../loader.js');
      
      await pullFromProviders(options);
      
      // Check that writeConfigToFile was called with the JSON extension
      expect(writeConfigToFile).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.any(Object)
      );
      
      // Test with TypeScript format
      const tsOptions: PaCOptions = {
        ...options,
        format: 'ts'
      };
      
      await pullFromProviders(tsOptions);
      
      // Check that writeConfigToFile was called with the TS extension
      expect(writeConfigToFile).toHaveBeenCalledWith(
        expect.stringContaining('.ts'),
        expect.any(Object)
      );
    });
    
    test('should not write to file if configPath is empty', async () => {
      const options: PaCOptions = {
        configPath: '',  // Empty path
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test_key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };
      
      const { writeConfigToFile } = require('../../loader.js');
      
      await pullFromProviders(options);
      
      // Check that writeConfigToFile was not called
      expect(writeConfigToFile).not.toHaveBeenCalled();
    });
    
    test('should handle provider errors gracefully', async () => {
      // Make the fetchProducts method throw an error
      const { providers: mockProviders } = providers.initializeProviders([]);
      // Instead of trying to mock an individual method, let's just mock the whole initializeProviders function
      (providers.initializeProviders as jest.Mock).mockReturnValueOnce({
        providers: {
          stripe: {
            fetchProducts: jest.fn().mockRejectedValue(new Error('Provider error')),
            fetchPrices: jest.fn()
          }
        },
        clients: {}
      });
      
      const options: PaCOptions = {
        configPath: testConfigPath,
        providers: [
          {
            provider: 'stripe',
            options: {
              secretKey: 'test_key'
            }
          }
        ],
        writeBack: false,
        format: 'yaml'
      };
      
      // The function should reject with the provider error
      await expect(pullFromProviders(options)).rejects.toThrow('Provider error');
    });
  });
});