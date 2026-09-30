export interface AssetRequest {
  id: string;
  capabilityId: string;
  brief: string;
  inputs: Record<string, unknown>;
}

export interface ProducedAsset {
  requestId: string;
  capabilityId: string;
  uri: string;
  mediaType: string;
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
  produce(request: AssetRequest): Promise<ProducedAsset>;
}
