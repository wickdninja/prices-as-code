---
layout: default
title: CI/CD Integration
parent: Guides
parent_page: index.md
nav_order: 7
---

# CI/CD Integration

Integrating Prices as Code into your CI/CD workflow allows you to automate pricing updates and ensure your pricing configuration stays in sync with your billing provider. This guide shows you how to set up automated price synchronization in various CI/CD environments.

## Benefits of CI/CD Integration

- **Automation**: Update pricing without manual intervention
- **Version Control**: Track pricing changes alongside code
- **Environment Separation**: Use different configurations for development, staging, and production
- **Approval Workflow**: Require reviews for pricing changes
- **Change Tracking**: Document when and why pricing was updated

## Basic Workflow

A typical CI/CD workflow for Prices as Code looks like this:

1. **Developers update** pricing configuration in version control
2. **Pull request** is opened and reviewed
3. **Automated tests** check the configuration for errors
4. **Approval and merge** updates the main branch
5. **CI/CD pipeline** runs the price sync operation
6. **Notification** is sent about the successful update

## GitHub Actions Setup

### Basic GitHub Action

Create a file at `.github/workflows/sync-prices.yml`:

```yaml
name: Sync Pricing

on:
  push:
    branches: [main]
    paths:
      - 'pricing/**'
  workflow_dispatch:  # Allow manual triggers

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate pricing configuration
        run: npx prices-as-code validate pricing/prices.yml

      - name: Sync pricing (dry run)
        if: github.ref != 'refs/heads/main'
        run: npx prices-as-code sync pricing/prices.yml --dry-run
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}

      - name: Sync pricing (production)
        if: github.ref == 'refs/heads/main'
        run: npx prices-as-code sync pricing/prices.yml
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_PROD_KEY }}

      - name: Notify team
        if: always()
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const status = '${{ job.status }}';
            const message = status === 'success' 
              ? '✅ Pricing sync successful!' 
              : '❌ Pricing sync failed!';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: message
            });
```

### Environment-Specific Configuration

For different environments (dev, staging, production):

```yaml
name: Sync Pricing

on:
  push:
    branches: [dev, staging, main]
    paths:
      - 'pricing/**'

jobs:
  sync:
    name: Sync pricing for ${{ github.ref_name }}
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Select environment config
        id: select-config
        run: |
          if [[ "${{ github.ref_name }}" == "main" ]]; then
            echo "config=pricing/production.yml" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" == "staging" ]]; then
            echo "config=pricing/staging.yml" >> $GITHUB_OUTPUT
          else
            echo "config=pricing/development.yml" >> $GITHUB_OUTPUT
          fi

      - name: Sync pricing
        run: npx prices-as-code sync ${{ steps.select-config.outputs.config }}
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          RECURLY_API_KEY: ${{ secrets.RECURLY_API_KEY }}
```

## GitLab CI Setup

Create a `.gitlab-ci.yml` file:

```yaml
stages:
  - validate
  - deploy

validate-pricing:
  stage: validate
  image: node:18-alpine
  script:
    - npm ci
    - npx prices-as-code validate pricing/prices.yml
  only:
    changes:
      - pricing/**

sync-pricing-test:
  stage: deploy
  image: node:18-alpine
  script:
    - npm ci
    - npx prices-as-code sync pricing/prices.yml
  environment:
    name: test
  variables:
    STRIPE_SECRET_KEY: ${STRIPE_TEST_KEY}
  only:
    refs:
      - develop
    changes:
      - pricing/**

sync-pricing-prod:
  stage: deploy
  image: node:18-alpine
  script:
    - npm ci
    - npx prices-as-code sync pricing/prices.yml
  environment:
    name: production
  variables:
    STRIPE_SECRET_KEY: ${STRIPE_PROD_KEY}
  only:
    refs:
      - main
    changes:
      - pricing/**
  when: manual  # Requires manual approval
```

## CircleCI Setup

Create a `.circleci/config.yml` file:

```yaml
version: 2.1

jobs:
  validate-pricing:
    docker:
      - image: cimg/node:18.12
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{% raw %}{{ checksum "package.json" }}{% endraw %}
            - v1-dependencies-
      - run: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{% raw %}{{ checksum "package.json" }}{% endraw %}
      - run: npx prices-as-code validate pricing/prices.yml

  sync-pricing:
    docker:
      - image: cimg/node:18.12
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{% raw %}{{ checksum "package.json" }}{% endraw %}
            - v1-dependencies-
      - run: npm ci
      - run: npx prices-as-code sync pricing/prices.yml

workflows:
  version: 2
  validate-and-sync:
    jobs:
      - validate-pricing:
          filters:
            branches:
              only: /.*/
      - hold-for-approval:
          type: approval
          requires:
            - validate-pricing
          filters:
            branches:
              only: main
      - sync-pricing:
          requires:
            - hold-for-approval
          filters:
            branches:
              only: main
          context: stripe-production
```

## Jenkins Pipeline

Create a `Jenkinsfile`:

```groovy
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Validate') {
            steps {
                sh 'npx prices-as-code validate pricing/prices.yml'
            }
        }
        
        stage('Sync Pricing') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([string(credentialsId: 'stripe-api-key', variable: 'STRIPE_SECRET_KEY')]) {
                    sh 'npx prices-as-code sync pricing/prices.yml'
                }
            }
        }
    }
    
    post {
        success {
            slackSend(color: 'good', message: "Price sync succeeded for ${env.JOB_NAME}")
        }
        failure {
            slackSend(color: 'danger', message: "Price sync failed for ${env.JOB_NAME}")
        }
    }
}
```

## Pull Request Validation

To validate pricing changes on pull requests without syncing:

### GitHub Actions

```yaml
name: Validate Pricing

on:
  pull_request:
    paths:
      - 'pricing/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Validate pricing configuration
        run: npx prices-as-code validate pricing/prices.yml

      - name: Generate pricing diff
        run: npx prices-as-code diff pricing/prices.yml > pricing_diff.md
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const diff = fs.readFileSync('pricing_diff.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Pricing Changes\n\n${diff}`
            });
```

## Handling Secrets

API keys should never be stored in your codebase. Instead, use your CI/CD platform's secrets management:

- **GitHub**: Use repository or environment secrets
- **GitLab**: Use CI/CD variables
- **CircleCI**: Use contexts or environment variables
- **Jenkins**: Use credentials manager

For example, with GitHub Actions:

1. Go to your repository settings
2. Select "Secrets and variables" → "Actions"
3. Create a new repository secret named `STRIPE_SECRET_KEY`
4. Add your API key as the value

## Deployment Strategies

### Scheduled Updates

For regular price updates (e.g., monthly):

```yaml
name: Scheduled Price Update

on:
  schedule:
    - cron: '0 0 1 * *'  # First day of each month at midnight

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      # Implementation steps...
```

### Feature Flags

For gradual rollout of pricing changes:

```typescript
const config: Config = {
  products: [
    // Products configuration...
  ],
  prices: [
    {
      provider: 'stripe',
      name: 'New Pricing Tier',
      unitAmount: 2999,
      // Other configuration...
      metadata: {
        featureFlag: 'new_pricing_q2_2023',
        rolloutPercentage: 25  // Only show to 25% of users initially
      }
    }
  ]
};
```

Then in your application code:

```typescript
function shouldShowNewPricing(user) {
  const price = getPriceByName('New Pricing Tier');
  if (!price || !price.metadata?.featureFlag) return false;
  
  // Check if feature flag is enabled
  if (!featureFlags.isEnabled(price.metadata.featureFlag)) return false;
  
  // Check rollout percentage
  if (price.metadata.rolloutPercentage) {
    const userHash = hashUserId(user.id);
    const userBucket = userHash % 100;
    if (userBucket >= price.metadata.rolloutPercentage) return false;
  }
  
  return true;
}
```

## Monitoring and Notifications

### Slack Notifications

For GitHub Actions:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1.23.0
  with:
    payload: |
      {
        "text": "Pricing update completed",
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "Pricing Update Completed"
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Status:* ${{ job.status }}\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref_name }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### Email Notifications

For GitLab CI:

```yaml
sync-pricing-prod:
  # Job configuration...
  after_script:
    - |  
      if [ $CI_JOB_STATUS == "success" ]; then
        curl -X POST \
          -H "Content-Type: application/json" \
          -d '{"from": "ci@example.com", "to": "team@example.com", "subject": "Pricing Update Successful", "body": "The pricing update has been successfully deployed to production."}' \
          ${EMAIL_API_ENDPOINT}
      else
        curl -X POST \
          -H "Content-Type: application/json" \
          -d '{"from": "ci@example.com", "to": "team@example.com", "subject": "Pricing Update Failed", "body": "The pricing update failed. Please check the logs."}' \
          ${EMAIL_API_ENDPOINT}
      fi
```

## Best Practices

1. **Always use `--dry-run` first** to see what changes would be made
2. **Separate environments** using different branches and configs
3. **Require code reviews** for pricing changes
4. **Use detailed commit messages** explaining why prices changed
5. **Set up monitoring and alerts** to detect issues
6. **Create a rollback plan** in case of problems
7. **Document your pricing history** in a change log

## Rollback Strategy

If you need to roll back pricing changes:

1. Revert the commit with the pricing changes
2. Run the sync operation with the previous configuration
3. Notify stakeholders of the rollback

## Next Steps

- Explore [Working with Metadata](metadata.html) for more flexible pricing configurations
- Learn about [Custom Pricing Logic](custom-pricing.html) for complex use cases
- Set up [Custom Providers](custom-providers.html) for specialized integrations