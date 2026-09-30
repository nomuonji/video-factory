import type { EditingPattern, InputMode, Intensity, StyleProfile } from "../core/types.js";
import type { CatalogRegistry } from "../catalog/registry.js";

export interface PatternSelectionContext {
  inputMode: InputMode;
  intents: string[];
  signals: string[];
  availableRequirements: string[];
  flags: string[];
  maxIntensity?: Intensity;
  style?: StyleProfile;
  supportedPatternIds?: string[];
}

export interface PatternCandidate {
  pattern: EditingPattern;
  score: number;
  reasons: string[];
}

const intensityRank: Record<Intensity, number> = { low: 1, medium: 2, high: 3 };

export function selectEditingPatterns(
  registry: CatalogRegistry,
  context: PatternSelectionContext,
  limit = 5,
): PatternCandidate[] {
  const maxIntensity = context.maxIntensity ?? "high";
  const supported = new Set(context.supportedPatternIds ?? []);

  return [...registry.editing.values()]
    .filter((pattern) => pattern.inputModes.includes(context.inputMode))
    .filter((pattern) => pattern.requirements.every((req) => context.availableRequirements.includes(req)))
    .filter((pattern) => !pattern.avoidWhen.some((flag) => context.flags.includes(flag)))
    .filter((pattern) => intensityRank[pattern.intensity] <= intensityRank[maxIntensity])
    .map((pattern) => {
      const matchedIntents = pattern.intents.filter((intent) => context.intents.includes(intent));
      const matchedTriggers = pattern.triggers.filter((trigger) => context.signals.includes(trigger));
      const styleBoost = context.style?.preferredEditingCategories.includes(pattern.category) ? 1 : 0;
      const rendererBoost = supported.has(pattern.id) ? 0.75 : 0;
      const score = matchedIntents.length * 3 + matchedTriggers.length * 2 + styleBoost + rendererBoost - pattern.densityCost * 0.1;
      const reasons = [
        ...matchedIntents.map((value) => `intent:${value}`),
        ...matchedTriggers.map((value) => `trigger:${value}`),
        ...(styleBoost ? [`style:${pattern.category}`] : []),
        ...(rendererBoost ? ["renderer:supported"] : []),
      ];
      return { pattern, score, reasons };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id))
    .slice(0, limit);
}
