import { providerUnsupportedCapabilityError } from '../errors/provider-error';
import { DeterministicProviderRouter } from '../routing/router';
import { ProviderRegistry } from '../routing/provider-registry';
import type { AIProviderRequest, AIProviderResponse } from '../types/contracts';
import { providerSupportsRequest } from '../types/contracts';

export class AIProviderService {
  constructor(
    private readonly router: DeterministicProviderRouter,
    private readonly registry: ProviderRegistry,
  ) {}

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    const route = this.router.resolve(request.capabilityId);
    const provider = this.registry.get(route.providerId);
    if (!providerSupportsRequest(provider, request)) {
      throw providerUnsupportedCapabilityError(
        `Provider "${provider.providerId}" does not support capability "${request.capabilityId}".`,
        { providerId: provider.providerId },
      );
    }

    return provider.execute(request, { model: route.model });
  }
}
