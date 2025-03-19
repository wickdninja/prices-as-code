/**
 * Example pricing configuration using TypeScript
 */
import { Config } from "../src/types.js";

const config: Config = {
  products: [
    // Stripe Products
    {
      provider: "stripe",
      name: "Basic Plan",
      description: "For individuals and small teams",
      features: ["5 projects", "10GB storage", "Email support"],
      highlight: false,
      metadata: {
        displayOrder: 1,
      },
    },
    {
      provider: "stripe",
      name: "Pro Plan",
      description: "For growing businesses",
      features: [
        "Unlimited projects",
        "100GB storage",
        "Priority support",
        "Advanced analytics",
      ],
      highlight: true,
      metadata: {
        displayOrder: 2,
      },
    },
    {
      provider: "stripe",
      name: "Enterprise Plan",
      description: "For large organizations",
      features: [
        "Unlimited everything",
        "Dedicated support",
        "Custom integrations",
        "SLA guarantees",
      ],
      highlight: false,
      metadata: {
        displayOrder: 3,
        enterpriseFeature: true,
      },
    },

  ],

  prices: [
    // Stripe Prices
    {
      provider: "stripe",
      name: "Basic Monthly",
      nickname: "Basic Monthly",
      unitAmount: 999,
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "month",
        intervalCount: 1,
      },
      productKey: "basic_plan",
      metadata: {
        displayName: "Basic Monthly",
        popular: false,
      },
    },
    {
      provider: "stripe",
      name: "Basic Yearly",
      nickname: "Basic Yearly",
      unitAmount: 9990,
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "year",
        intervalCount: 1,
      },
      productKey: "basic_plan",
      metadata: {
        displayName: "Basic Yearly",
        popular: true,
        savings: "17%",
      },
    },
    {
      provider: "stripe",
      name: "Pro Monthly",
      nickname: "Pro Monthly",
      unitAmount: 1999,
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "month",
        intervalCount: 1,
      },
      productKey: "pro_plan",
      metadata: {
        displayName: "Pro Monthly",
        popular: false,
      },
    },
    {
      provider: "stripe",
      name: "Pro Yearly",
      nickname: "Pro Yearly",
      unitAmount: 19990,
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "year",
        intervalCount: 1,
      },
      productKey: "pro_plan",
      metadata: {
        displayName: "Pro Yearly",
        popular: true,
        savings: "17%",
      },
    },
    {
      provider: "stripe",
      name: "Enterprise Monthly",
      nickname: "Enterprise Monthly",
      unitAmount: 4999,
      currency: "usd",
      type: "recurring",
      recurring: {
        interval: "month",
        intervalCount: 1,
      },
      productKey: "enterprise_plan",
      metadata: {
        displayName: "Enterprise Monthly",
        popular: false,
        enterprise: true,
      },
    },

  ],
};

export default config;
