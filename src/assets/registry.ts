import type { AssetProvider, AssetRequest } from "./provider.js";

export class AssetProviderRegistry {
  private readonly providers = new Map<string, AssetProvider>();

  register(provider: AssetProvider): void {
    if (this.providers.has(provider.id)) throw new Error(`Duplicate asset provider: ${provider.id}`);
    this.providers.set(provider.id, provider);
  }

  list(capabilityId?: string): AssetProvider[] {
    return [...this.providers.values()]
      .filter((provider) => !capabilityId || provider.capabilities.includes(capabilityId))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id));
  }

  resolve(request: AssetRequest): AssetProvider[] {
    return this.list(request.capabilityId).filter((provider) => provider.canHandle(request));
  }

  require(request: AssetRequest): AssetProvider {
    const provider = this.resolve(request)[0];
    if (!provider) throw new Error(`No provider can satisfy asset request ${request.id} (${request.capabilityId})`);
    return provider;
  }
}
