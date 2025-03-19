# Prices as Code - Test Suite

This directory contains the comprehensive test suite for the Prices as Code library, organized into different levels of testing to ensure proper functionality and reliability.

## Test Structure

The test suite is organized into three main categories:

### 1. Unit Tests (`/unit`)

Unit tests focus on testing individual components in isolation, mocking external dependencies. These tests ensure that each part of the library works as expected on its own.

- **`/unit/core.test.ts`**: Tests for core functionality
- **`/unit/loader.test.ts`**: Tests for configuration loading/saving
- **`/unit/providers/`**: Tests for provider implementations
  - `stripe.test.ts`: Stripe provider unit tests
  - `recurly.test.ts`: Recurly provider unit tests
  - `index.test.ts`: Provider initialization tests

### 2. Integration Tests (`/integration`)

Integration tests verify that different components of the library work together correctly and that the library integrates with external services properly.

- **`/integration/stripe/`**: Tests for Stripe API integration
- **`/integration/recurly/`**: Tests for Recurly API integration

These tests require valid API credentials to run, which should be set in a `.env.test` file.

### 3. End-to-End Tests (`/e2e`)

End-to-end tests validate complete workflows, ensuring the library behaves as expected in real-world scenarios.

- **`/e2e/config-sync.test.ts`**: Tests the full workflow of loading, syncing, and saving configurations with different file formats.

## Running Tests

### Setup

1. Create a `.env.test` file with required API credentials:

```
STRIPE_SECRET_KEY=sk_test_...
RECURLY_API_KEY=recurly_test_...
```

2. Install dependencies:

```bash
npm install
```

### Running All Tests

```bash
npm test
```

### Running Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Specific provider integration tests
npm run test:integration:stripe
npm run test:integration:recurly
```

### Test Coverage

To generate test coverage report:

```bash
npm run test:coverage
```

## Test Utils

- **`/unit/utils/mockData.ts`**: Contains shared mock data used across tests

## Test Conventions

1. **Test organization**: Tests should be organized in describe/test blocks that match the structure of the code being tested.
2. **Naming**: Test names should clearly state the functionality being tested and expected outcome.
3. **Isolation**: Tests should not depend on the state from previous tests.
4. **Cleanup**: All tests should clean up any resources created during the test.
5. **Skip logic**: Tests requiring external services should gracefully skip when credentials are not available.

## Adding New Tests

When adding new functionality to the library, please follow these steps:

1. Add unit tests for the new component
2. Add integration tests if the component interacts with external services
3. Update or add end-to-end tests if the new functionality impacts complete workflows
4. Ensure all tests pass and maintain high coverage