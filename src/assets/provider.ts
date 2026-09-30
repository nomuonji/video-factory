export interface AssetRequest {
  id: string;
  capabilityId: string;
  brief: string;
  inputs: Record<string, unknown>;
}

export interface AssetProviderContext {
  productionId: string;
  sceneId?: string;
  rootDir: string;
  publicDir: string;
  outputDir: string;
  providerConfig: Record<string, unknown>;
}

export interface ProducedAsset {
  id: string;
  requestId: string;
  capabilityId: string;
  uri: string;
  mediaType: string;
  sceneId?: string;
  metadata: Record<string, unknown>;
  provenance: {
    providerId: string;
    source?: string;
    license?: string;
  };
}

export interface AssetProvider {
  id: string;
  capabilities: string[];
  priority?: number;
  canHandle(request: AssetRequest): boolean;
  produce(request: AssetRequest, context: AssetProviderContext): Promise<ProducedAsset>;
}
