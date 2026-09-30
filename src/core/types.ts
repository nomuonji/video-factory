export type InputMode = "generated" | "raw" | "hybrid";
export type Intensity = "low" | "medium" | "high";
export type ImplementationStatus = "planned" | "partial" | "supported";

export interface PatternImplementation {
  status: ImplementationStatus;
  adapter: string | null;
  component: string | null;
  fallbackPatternIds: string[];
}

export interface EditingPattern {
  id: string;
  slug: string;
  nameJa: string;
  category: string;
  categoryNameJa: string;
  purpose: string;
  inputModes: InputMode[];
  intents: string[];
  triggers: string[];
  avoidWhen: string[];
  requirements: string[];
  intensity: Intensity;
  densityCost: number;
  compatibility: {
    pairsWellWith: string[];
    avoidWith: string[];
  };
  implementation: PatternImplementation;
  sourceRef: string;
}

export interface ScenePattern {
  id: string;
  name: string;
  useWhen: string[];
  requiredCapabilities: string[];
  optionalCapabilities: string[];
  preferredPatternIds: string[];
}

export interface AssetCapability {
  id: string;
  kind: "visual" | "audio" | "text" | "data";
  description: string;
  inputs: string[];
  outputs: string[];
  providerPolicy: "internal" | "pluggable" | "internal_or_pluggable";
}

export interface StyleProfile {
  id: string;
  format: "landscape" | "vertical" | "square";
  aspectRatio: string;
  pacing: "slow" | "medium" | "fast" | "very_fast";
  captionDensity: "low" | "medium" | "high";
  effectDensity: "low" | "medium" | "high";
  strongEffectBudgetPer30s: number;
  minimumSamePatternGapSeconds: number;
  preferredSceneIds: string[];
  preferredEditingCategories: string[];
}

export interface EditOperation {
  id: string;
  sceneId: string;
  start: number;
  end: number;
  patternId: string;
  target?: string;
  reason: string;
  intensity: Intensity;
  params: Record<string, unknown>;
}

export interface EditPlan {
  productionId: string;
  version: number;
  styleProfileId: string;
  durationSeconds: number;
  operations: EditOperation[];
}
