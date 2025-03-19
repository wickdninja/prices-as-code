# Contributing to Prices as Code

Thank you for your interest in contributing to Prices as Code! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Bugs are tracked as GitHub issues. Search the issues to make sure the bug hasn't been reported already. If you find a bug that hasn't been reported, open a new issue and include:

- A clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant code snippets or error messages

### Suggesting Enhancements

Enhancement suggestions are also tracked as GitHub issues. When suggesting an enhancement, please include:

- A clear title and detailed description
- Step-by-step explanation of the suggested enhancement
- Any examples of how the enhancement would work

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Make sure linting passes: `npm run lint`
6. Commit your changes with a descriptive commit message
7. Push to your branch: `git push origin feature/your-feature-name`
8. Open a pull request to the `main` branch

#### Pull Request Guidelines

- Include tests for any new functionality
- Update documentation if needed
- Follow existing code style and conventions
- Keep pull requests focused on a single concern

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Adding New Providers

When adding support for a new billing provider:

1. Create a new file in `src/providers/` with your provider implementation
2. Implement the `ProviderClient` interface
3. Add appropriate types to `src/types.ts`
4. Add tests for your provider
5. Update documentation to include your new provider

## License

By contributing to Prices as Code, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).