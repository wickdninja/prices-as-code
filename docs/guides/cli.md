---
layout: default
title: Command Line Interface
parent: Guides
nav_order: 3
---

# Command Line Interface

Prices as Code includes a powerful CLI tool that makes it easy to manage your pricing configurations. This guide covers the available commands and options.

## Installation

The CLI is included when you install the package:

```bash
npm install -g prices-as-code
```

You can also run it directly with npx:

```bash
npx prices-as-code [command] [options]
```

## Basic Usage

Sync your pricing configuration with your provider:

```bash
prices-as-code [config-file] [options]
```

Where `config-file` is the path to your pricing configuration file (e.g., `pricing.ts`, `prices.yml`).

## Commands

### Sync

The default command. Synchronizes your pricing configuration with the provider.

```bash
prices-as-code sync pricing.ts
```

### Validate

Validates your pricing configuration without making any changes to your provider.

```bash
prices-as-code validate pricing.ts
```

### Import

Imports existing products and prices from your provider into a local configuration file.

```bash
prices-as-code import --provider stripe --output imported-prices.yml
```

### Diff

Shows the difference between your local configuration and what's currently on the provider.

```bash
prices-as-code diff pricing.ts
```

## Options

### General Options

| Option | Description |
|--------|-------------|
| `--help` | Display help information |
| `--version` | Display version information |
| `--verbose` | Enable verbose logging |
| `--config <path>` | Path to a config file |

### Provider Options

| Option | Description |
|--------|-------------|
| `--provider <name>` | Specify the provider (stripe) |
| `--dry-run` | Show what would be done without making changes |
| `--env-file <path>` | Path to .env file for environment variables |

### Output Options

| Option | Description |
|--------|-------------|
| `--output <format>` | Output format (json, yaml, table) |
| `--output-file <path>` | Write output to a file instead of stdout |

## Environment Variables

You can configure the CLI using environment variables, either in your shell or via a `.env` file:

```
PAC_STRIPE_SECRET_KEY=sk_test_your_stripe_key
PAC_DRY_RUN=true
```

## Examples

### Sync with a specific provider

```bash
prices-as-code pricing.ts --provider stripe
```

### Run a dry run to see changes

```bash
prices-as-code pricing.ts --dry-run
```

### Import from a provider and save as YAML

```bash
prices-as-code import --provider stripe --output prices.yml
```

### Validate configuration and show detailed output

```bash
prices-as-code validate pricing.ts --verbose
```

### Use a custom .env file

```bash
prices-as-code pricing.ts --env-file .env.production
```

## CI/CD Integration

The CLI is designed to work well in CI/CD environments. You can use the exit codes to determine if the sync was successful:

- Exit code 0: Success
- Exit code 1: Error

Example in GitHub Actions:

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v2
  
  - name: Setup Node.js
    uses: actions/setup-node@v2
    with:
      node-version: '18'
  
  - name: Install dependencies
    run: npm ci
  
  - name: Sync pricing
    run: npx prices-as-code pricing.ts
    env:
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

## Next Steps

- Learn about [CI/CD Integration](ci-cd.html) for automating your pricing updates
- Explore [Working with Metadata](metadata.html) to extend functionality
- See how to implement [Custom Providers](custom-providers.html)