/** @type {import('jest').Config} */
export default {
  displayName: 'Integration Tests',
  testMatch: ['**/src/__tests__/integration/**/*.test.[jt]s?(x)'],
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
  setupFiles: ['dotenv/config'],
  testTimeout: 30000,
};