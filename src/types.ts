import Stripe from 'stripe';

export interface StripePacProduct {
  name: string;
  description?: string;
  id?: string;
  metadata: {
    key?: string;
    features?: string | string[];
    highlight?: string | boolean;
    [key: string]: any;
  };
}

export interface StripePacPrice {
  nickname: string;
  unit_amount: number;
  currency: string;
  id?: string;
  type?: 'one_time' | 'recurring';
  active?: boolean;
  product_well_known_id?: string;
  _product_well_known_id?: string;
  recurring?: {
    interval: Stripe.PriceCreateParams.Recurring.Interval;
    interval_count?: number;
  };
  metadata: {
    key?: string;
    plan_code?: string | number;
    [key: string]: any;
  };
}

export interface StripePacConfig {
  products: StripePacProduct[];
  prices: StripePacPrice[];
}

export interface SyncResult {
  config: StripePacConfig;
  configUpdated: boolean;
}

export interface StripePacOptions {
  stripeSecretKey?: string;
  stripeApiVersion?: string;
  configPath?: string;
}