import { StripeProvider } from './stripe.js';
import { 
  ProviderOptions,
  ProviderClient,
  Clients
} from '../types.js';

/**
 * Initialize provider clients based on options
 */
export function initializeProviders(providers: ProviderOptions[]): {
  clients: Clients;
  providers: Record<string, ProviderClient>;
} {
  const clients: Clients = {};
  const providerClients: Record<string, ProviderClient> = {};
  
  for (const providerOption of providers) {
    if (providerOption.provider === 'stripe') {
      const stripeProvider = new StripeProvider(providerOption.options);
      clients.stripe = stripeProvider.getClient();
      providerClients.stripe = stripeProvider;
    }
  }
  
  return { clients, providers: providerClients };
}

export { StripeProvider };