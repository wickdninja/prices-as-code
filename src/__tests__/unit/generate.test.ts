/**
 * Unit tests for the generate feature
 */
import { generateTemplate } from '../../core.js';
import { GenerateOptions } from '../../types.js';
import * as loader from '../../loader.js';
import * as path from 'path';
import * as fs from 'fs';

describe('Generate Feature', () => {
  const testDir = path.resolve(process.cwd(), 'tmp/test-output');
  const testConfigPath = path.resolve(testDir, 'test-generate.yml');

  // Ensure test directory exists
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Mock loader functions
    jest.spyOn(loader, 'writeConfigToFile').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a template with default options', async () => {
    const options: Partial<GenerateOptions> = {
      configPath: testConfigPath,
    };

    const result = await generateTemplate(options);

    // Check the result has the expected structure
    expect(result.products).toHaveLength(3); // Default: basic, pro, enterprise
    expect(result.prices).toHaveLength(6); // 3 tiers x 2 intervals

    // Check product properties
    const productNames = result.products.map(p => p.name);
    expect(productNames).toContain('Basic Plan');
    expect(productNames).toContain('Pro Plan');
    expect(productNames).toContain('Enterprise Plan');

    // Check price properties
    expect(result.prices[0].type).toBe('recurring');
    expect(result.prices[0].currency).toBe('usd'); // Default currency

    // Check intervals
    const monthlyPrices = result.prices.filter(p => p.recurring?.interval === 'month');
    const yearlyPrices = result.prices.filter(p => p.recurring?.interval === 'year');
    expect(monthlyPrices).toHaveLength(3); // One per tier
    expect(yearlyPrices).toHaveLength(3); // One per tier

    // Check if writeConfigToFile was called with the right arguments
    expect(loader.writeConfigToFile).toHaveBeenCalledWith(
      testConfigPath,
      expect.any(Object)
    );
  });

  test('should use custom tiers and currency', async () => {
    const options: Partial<GenerateOptions> = {
      configPath: testConfigPath,
      productTiers: ['free', 'standard', 'premium'],
      currency: 'eur'
    };

    const result = await generateTemplate(options);

    // Check the result has the expected structure
    expect(result.products).toHaveLength(3); // Custom: free, standard, premium

    // Check product properties
    const productNames = result.products.map(p => p.name);
    expect(productNames).toContain('Free Plan');
    expect(productNames).toContain('Standard Plan');
    expect(productNames).toContain('Premium Plan');

    // Check currency
    expect(result.prices[0].currency).toBe('eur');
  });

  test('should handle single interval option', async () => {
    const options: Partial<GenerateOptions> = {
      configPath: testConfigPath,
      intervals: ['month'], // Monthly only
      productTiers: ['basic', 'pro'] // Two tiers
    };

    const result = await generateTemplate(options);

    // Check the result has the expected structure
    expect(result.products).toHaveLength(2); // basic, pro
    expect(result.prices).toHaveLength(2); // 2 tiers x 1 interval

    // All prices should be monthly
    expect(result.prices.every(p => p.recurring?.interval === 'month')).toBe(true);
  });

  test('should handle no metadata and no features options', async () => {
    const options: Partial<GenerateOptions> = {
      configPath: testConfigPath,
      includeMetadata: false,
      includeFeatures: false
    };

    const result = await generateTemplate(options);

    // Products should not have features
    expect(result.products.every(p => !p.features)).toBe(true);

    // Products and prices should have empty metadata
    expect(result.products.every(p => Object.keys(p.metadata).length === 0)).toBe(true);
    expect(result.prices.every(p => Object.keys(p.metadata).length === 0)).toBe(true);
  });

  test('should not write to file if configPath is empty', async () => {
    const options: Partial<GenerateOptions> = {
      configPath: '',
      productTiers: ['basic']
    };

    const result = await generateTemplate(options);

    // Check structure still exists
    expect(result.products).toHaveLength(1);

    // Check that writeConfigToFile was not called
    expect(loader.writeConfigToFile).not.toHaveBeenCalled();
  });

  test('should handle errors during generation', async () => {
    const options: Partial<GenerateOptions> = {
      configPath: testConfigPath,
    };

    // Mock writeConfigToFile to throw an error
    jest.spyOn(loader, 'writeConfigToFile').mockRejectedValueOnce(new Error('Write error'));

    // The function should reject with the write error
    await expect(generateTemplate(options)).rejects.toThrow('Write error');
  });
});