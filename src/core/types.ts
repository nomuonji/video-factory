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
  compatibility: { pairsWellWith: string[]; avoidWith: string[] };
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

export interface ProductionBrief {
  id: string;
  title: string;
  goal: string;
  audience: string;
  durationTargetSeconds: number;
  format: "landscape" | "vertical" | "square";
  language: string;
  inputMode: InputMode;
  prompt: string;
  styleProfileId: string;
  sourceAssets?: Array<Record<string, unknown>>;
  constraints: Record<string, unknown>;
}

export interface StoryboardVisual {
  headline?: string;
  body?: string;
  labels?: string[];
  steps?: string[];
  items?: Array<Record<string, unknown>>;
  assetRefs?: string[];
  background?: string;
  [key: string]: unknown;
}

export interface AssetRequestSpec {
  capabilityId: string;
  brief: string;
  [key: string]: unknown;
}

export interface StoryboardScene {
  id: string;
  purpose: string;
  durationSeconds: number;
  narration: string;
  scenePatternId: string;
  visual?: StoryboardVisual;
  assetRequests: AssetRequestSpec[];
  editingIntents: string[];
}

export interface Storyboard {
  productionId: string;
  version: number;
  scenes: StoryboardScene[];
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

export interface ProducedAssetRecord {
  id: string;
  requestId?: string;
  capabilityId: string;
  uri: string;
  mediaType: string;
  sceneId?: string;
  metadata?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
}
