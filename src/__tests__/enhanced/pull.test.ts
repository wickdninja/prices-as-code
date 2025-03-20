/**
 * Tests for the pull functionality
 */
import { pull } from '../../index.js';
import * as core from '../../core.js';
import { PullResult } from '../../types.js';

// Mock the core module
jest.mock('../../core.js', () => {
  return {
    loadEnvironment: jest.fn(options => ({ ...options, loadEnvironmentCalled: true })),
    pullFromProviders: jest.fn().mockResolvedValue({
      config: {
        products: [{ id: 'test_product' }],
        prices: [{ id: 'test_price' }]
      },
      configPath: 'test/path'
    })
  };
});

describe('Pull Function', () => {
  beforeEach(() => {
    // Clear mock call history
    jest.clearAllMocks();
  });

  test('should call loadEnvironment with provided options', async () => {
    const options = {
      configPath: 'test-config.yml',
      providers: [
        {
          provider: 'stripe' as const,
          options: {
            secretKey: 'test_key'
          }
        }
      ],
      format: 'yaml' as const
    };

    await pull(options);

    expect(core.loadEnvironment).toHaveBeenCalledWith(options);
  });

  test('should call pullFromProviders with resolved options', async () => {
    const options = {
      configPath: 'test-config.yml',
      providers: [
        {
          provider: 'stripe' as const,
          options: {
            secretKey: 'test_key'
          }
        }
      ]
    };

    // Configure mock to return specific data
    const resolvedOptions = {
      ...options,
      loadEnvironmentCalled: true,
      format: 'yaml'
    };
    (core.loadEnvironment as jest.Mock).mockReturnValueOnce(resolvedOptions);

    await pull(options);

    expect(core.pullFromProviders).toHaveBeenCalledWith(resolvedOptions);
  });

  test('should return result from pullFromProviders', async () => {
    const expectedResult: PullResult = {
      config: {
        products: [{ 
          id: 'test_product',
          name: 'Test Product',
          provider: 'stripe' as const,
          metadata: {}
        }],
        prices: [{ 
          id: 'test_price',
          name: 'Test Price',
          nickname: 'Test Price',
          unitAmount: 1000,
          currency: 'USD',
          type: 'one_time' as const,
          provider: 'stripe' as const,
          active: true,
          metadata: {}
        }]
      },
      configPath: 'test/path'
    };
    
    (core.pullFromProviders as jest.Mock).mockResolvedValueOnce(expectedResult);

    const result = await pull({});

    expect(result).toEqual(expectedResult);
  });

  test('should handle different format options', async () => {
    // Test with each format
    const formats = ['yaml', 'json', 'ts'] as const;
    
    for (const format of formats) {
      await pull({ format });
      
      expect(core.loadEnvironment).toHaveBeenCalledWith(
        expect.objectContaining({ format })
      );
    }
  });

  test('should handle errors from core functions', async () => {
    // Make loadEnvironment throw an error
    (core.loadEnvironment as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Load environment error');
    });

    await expect(pull({})).rejects.toThrow('Load environment error');

    // Reset and make pullFromProviders throw an error
    (core.loadEnvironment as jest.Mock).mockReturnValueOnce({});
    (core.pullFromProviders as jest.Mock).mockRejectedValueOnce(new Error('Pull error'));

    await expect(pull({})).rejects.toThrow('Pull error');
  });
});