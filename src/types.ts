import { z } from 'zod';
import Stripe from 'stripe';

/**
 * Base Types
 */

/**
 * Common metadata schema used across all providers
 */
export const MetadataSchema = z.record(
  z.string().or(z.number()).or(z.boolean()).or(z.array(z.string()))
);
export type Metadata = z.infer<typeof MetadataSchema>;

/**
 * Base product schema shared across all providers
 */
export const BaseProductSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  metadata: MetadataSchema.optional().default({}),
});
export type BaseProduct = z.infer<typeof BaseProductSchema>;

/**
 * Common price intervals
 */
export const PriceIntervalSchema = z.enum(['day', 'week', 'month', 'year']);
export type PriceInterval = z.infer<typeof PriceIntervalSchema>;

/**
 * Base recurring price schema
 */
export const BaseRecurringSchema = z.object({
  interval: PriceIntervalSchema,
  intervalCount: z.number().optional().default(1),
});
export type BaseRecurring = z.infer<typeof BaseRecurringSchema>;

/**
 * Base price schema shared across all providers
 */
export const BasePriceSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  unitAmount: z.number(),
  currency: z.string().length(3), // ISO 4217 currency code
  type: z.enum(['one_time', 'recurring']).default('one_time'),
  recurring: BaseRecurringSchema.optional(),
  active: z.boolean().optional().default(true),
  productId: z.string().optional(), // Reference to product ID
  metadata: MetadataSchema.optional().default({}),
});
export type BasePrice = z.infer<typeof BasePriceSchema>;

/**
 * Stripe Provider Schemas
 */

/**
 * Stripe-specific product schema
 */
export const StripeProductSchema = BaseProductSchema.extend({
  features: z.array(z.string()).optional(),
  highlight: z.boolean().optional(),
  provider: z.literal('stripe'),
  key: z.string().optional(), // Well-known ID for reference
});
export type StripeProduct = z.infer<typeof StripeProductSchema>;

/**
 * Stripe-specific recurring schema
 */
export const StripeRecurringSchema = BaseRecurringSchema.extend({
  interval: z.enum(['day', 'week', 'month', 'year']),
  usageType: z.enum(['licensed', 'metered']).optional(),
  aggregateUsage: z
    .enum(['sum', 'last_during_period', 'last_ever', 'max'])
    .optional(),
  trialPeriodDays: z.number().optional(),
});
export type StripeRecurring = z.infer<typeof StripeRecurringSchema>;

/**
 * Stripe-specific price schema
 */
export const StripePriceSchema = BasePriceSchema.extend({
  nickname: z.string(), // Stripe-specific field
  recurring: StripeRecurringSchema.optional(),
  provider: z.literal('stripe'),
  key: z.string().optional(), // Well-known ID for reference
  taxBehavior: z.enum(['inclusive', 'exclusive', 'unspecified']).optional(),
  billingScheme: z.enum(['per_unit', 'tiered']).optional(),
  productKey: z.string().optional(), // Reference by key instead of ID
});
export type StripePrice = z.infer<typeof StripePriceSchema>;

/**
 * Union types for providers
 */
export const ProductSchema = z.discriminatedUnion('provider', [
  StripeProductSchema,
]);
export type Product = z.infer<typeof ProductSchema>;

export const PriceSchema = z.discriminatedUnion('provider', [
  StripePriceSchema,
]);
export type Price = z.infer<typeof PriceSchema>;

/**
 * Configuration schema for all providers
 */
export const ConfigSchema = z.object({
  products: z.array(ProductSchema),
  prices: z.array(PriceSchema),
});
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Provider-specific client options
 */
export const StripeOptionsSchema = z.object({
  secretKey: z.string(),
  apiVersion: z.string().optional(),
});
export type StripeOptions = z.infer<typeof StripeOptionsSchema>;

/**
 * Provider union type
 */
export const ProviderOptionsSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('stripe'), options: StripeOptionsSchema }),
]);
export type ProviderOptions = z.infer<typeof ProviderOptionsSchema>;

/**
 * Global options
 */
export const PaCOptionsSchema = z.object({
  configPath: z.string().optional(),
  providers: z.array(ProviderOptionsSchema),
  writeBack: z.boolean().optional().default(false),
});
export type PaCOptions = z.infer<typeof PaCOptionsSchema>;

/**
 * Result of synchronization
 */
export const SyncResultSchema = z.object({
  config: ConfigSchema,
  configUpdated: z.boolean(),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

/**
 * Provider client interfaces
 */
export interface ProviderClient {
  syncProducts(products: Product[]): Promise<Product[]>;
  syncPrices(prices: Price[]): Promise<Price[]>;
}

/**
 * Return type with typed clients
 */
export interface Clients {
  stripe?: Stripe;
}

/**
 * Private/internal types for Recurly support (not exposed in public API)
 */

/**
 * Recurly-specific product schema 
 */
export const RecurlyProductSchema = BaseProductSchema.extend({
  provider: z.literal('recurly'),
  code: z.string(), // Recurly-specific identifier
  taxCode: z.string().optional(),
  taxExempt: z.boolean().optional(),
});
export type RecurlyProduct = z.infer<typeof RecurlyProductSchema>;

/**
 * Recurly-specific recurring schema
 */
export const RecurlyRecurringSchema = BaseRecurringSchema.extend({
  intervalLength: z.number().min(1),
  intervalUnit: z.enum(['days', 'months']),
  trialLength: z.number().optional(),
  trialUnit: z.enum(['days', 'months']).optional(),
});
export type RecurlyRecurring = z.infer<typeof RecurlyRecurringSchema>;

/**
 * Recurly-specific price schema
 */
export const RecurlyPriceSchema = BasePriceSchema.extend({
  provider: z.literal('recurly'),
  code: z.string(), // Recurly-specific identifier
  taxInclusive: z.boolean().optional(),
  recurring: RecurlyRecurringSchema.optional(),
  productCode: z.string(), // Reference to product code
});
export type RecurlyPrice = z.infer<typeof RecurlyPriceSchema>;

/**
 * Recurly client options
 */
export const RecurlyOptionsSchema = z.object({
  apiKey: z.string(),
  subdomain: z.string().optional(),
});
export type RecurlyOptions = z.infer<typeof RecurlyOptionsSchema>;
