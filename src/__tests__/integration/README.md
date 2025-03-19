# Integration Tests

This directory contains integration tests that verify the functionality of Prices as Code with actual provider APIs.

## Setup

To run these tests, you'll need to set up API credentials for the providers you want to test.

1. Copy `.env.example` to `.env` in the project root
2. Add your API keys to the `.env` file

## Running Tests

To run all integration tests:

```bash
npm test -- --testPathPattern=integration
```

To run only Stripe integration tests:

```bash
npm test -- --testPathPattern=integration/stripe
```

## Notes

- These tests create actual resources on your provider accounts
- Resources should be cleaned up after tests complete
- Avoid running these tests with production API keys
- Tests will be skipped if the corresponding API key is not provided
