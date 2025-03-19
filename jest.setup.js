// Set default environment variables for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Import Jest from @jest/globals
import { jest, expect, test, describe, beforeEach, afterEach } from '@jest/globals';

// Setup global configuration
global.jest = jest;
global.expect = expect;
global.test = test;
global.describe = describe;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Increase timeout for tests that interact with external APIs
jest.setTimeout(30000);