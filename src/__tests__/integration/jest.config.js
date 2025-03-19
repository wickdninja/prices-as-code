/** @type {import('jest').Config} */
export default {
  displayName: 'Integration Tests',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
};