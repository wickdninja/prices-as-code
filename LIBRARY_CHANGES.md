# Library Changes - Version 2.0.0

## Major Changes in Version 2.0.0

### Removed Recurly Support

The Recurly provider has been completely removed from the public API in version 2.0.0. This is a breaking change, which is why we've incremented the major version number.

#### Changes Made:

1. Removed Recurly provider export from the public API in:
   - `src/providers/index.ts`

2. Updated types in:
   - `src/types.ts`
   - Removed Recurly from ProviderOptionsSchema
   - Updated Clients interface to only include Stripe

3. Removed Recurly references from documentation:
   - `README.md`
   - `docs/guides/getting-started.md`
   - `docs/guides/configuration-file.md`
   - `docs/guides/cli.md`
   - `docs/guides/custom-providers.md`
   - `docs/api/index.md`
   - `docs/providers/index.md`
   - Deleted `docs/providers/recurly.md`

4. Updated examples:
   - `examples/pricing.ts` - Removed Recurly products and prices

5. Removed Recurly test files:
   - `src/__tests__/integration/recurly/recurly.test.ts`
   - `src/__tests__/unit/providers/recurly.test.ts`

6. Updated CLI:
   - `src/cli.ts` - Removed Recurly CLI argument detection
   - `src/core.ts` - Removed Recurly auto-detection from environment variables

7. Updated Jest configuration:
   - `jest.config.js` - Excluded Recurly provider from coverage metrics
   
8. Updated package.json:
   - Removed recurly from dependencies
   - Removed recurly from keywords

### Test Suite Improvements

The test suite has been completely overhauled to fix issues related to ESM modules and TypeScript compatibility:

1. Fixed Jest configuration to properly handle TypeScript files with ESM modules
   - Updated moduleNameMapper to properly handle imports
   - Added proper test matching patterns

2. Fixed TypeScript configuration
   - Added proper module resolution
   - Added path mapping for Jest globals

3. Fixed type issues in test files
   - Added proper typing for provider objects
   - Fixed Stripe provider type annotation issues

## Migration Guide

If you were using the Recurly provider in your application, you will need to implement your own custom provider based on the Recurly SDK. Here's a high-level migration plan:

1. Update to version 2.0.0 of prices-as-code
2. Install the Recurly SDK directly: `npm install recurly`
3. Create a custom provider implementation for Recurly using the ProviderClient interface
4. Update your configuration to use your custom Recurly provider

For more information on creating custom providers, see the [Custom Providers Guide](https://wickdninja.github.io/prices-as-code/guides/custom-providers.html).

## Future Plans

Going forward, Prices as Code will focus on its core Stripe integration while providing a robust extension system for custom providers. This will allow for a more maintainable codebase and clearer API surface.

Future releases will include:
- Enhanced Stripe support
- More comprehensive test coverage
- Improved documentation for custom providers
- Better TypeScript typing and validation