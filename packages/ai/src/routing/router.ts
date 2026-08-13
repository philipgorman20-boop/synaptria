import { providerUnsupportedCapabilityError } from '../errors/provider-error';
import type { AIProviderId } from '../constants';

export interface ProviderRoute {
  readonly providerId: AIProviderId;
  readonly model: string;
}

export interface ProviderRoutingConfig {
  readonly routes: Readonly<Record<string, ProviderRoute>>;
  readonly defaultRoute?: ProviderRoute;
}

export class DeterministicProviderRouter {
  constructor(private readonly config: ProviderRoutingConfig) {}

  resolve(capabilityId: string): ProviderRoute {
    const route = this.tryResolve(capabilityId);
    if (route === undefined) {
      throw providerUnsupportedCapabilityError(
        `No provider route is configured for capability "${capabilityId}".`,
      );
    }

    return route;
  }

  tryResolve(capabilityId: string): ProviderRoute | undefined {
    return this.config.routes[capabilityId] ?? this.config.defaultRoute;
  }
}
