import { providerNotFoundError } from '../errors/provider-error';
import type { AIProviderId } from '../constants';
import type { AIProvider } from '../types/contracts';

export class ProviderRegistry {
  private readonly providers = new Map<AIProviderId, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  get(providerId: AIProviderId): AIProvider {
    const provider = this.providers.get(providerId);
    if (provider === undefined) {
      throw providerNotFoundError(`Provider "${providerId}" is not registered.`, {
        providerId,
      });
    }

    return provider;
  }

  has(providerId: AIProviderId): boolean {
    return this.providers.has(providerId);
  }
}
