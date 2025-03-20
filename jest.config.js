export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.\\./.*|\\./.*)\\.(js|ts)$': '$1',
    '@jest/globals': '<rootDir>/node_modules/@jest/globals',
  },
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/types.ts',
    '!src/providers/recurly.ts',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/lib/',
    'src/__tests__/integration/jest.setup.js',
    'src/__tests__/integration/jest.config.js',
    'src/__tests__/integration/setup.ts',
    'src/__tests__/integration/helpers.ts',
    'src/__tests__/unit/utils/mockData.ts'
  ],
  verbose: true
};