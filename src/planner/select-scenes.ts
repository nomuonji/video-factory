import type { ScenePattern, StyleProfile } from "../core/types.js";
import type { CatalogRegistry } from "../catalog/registry.js";

export interface SceneSelectionContext {
  signals: string[];
  availableCapabilities: string[];
  style?: StyleProfile;
}

export interface SceneCandidate {
  scene: ScenePattern;
  score: number;
  reasons: string[];
}

export function selectScenes(
  registry: CatalogRegistry,
  context: SceneSelectionContext,
  limit = 5,
): SceneCandidate[] {
  return [...registry.scenes.values()]
    .filter((scene) => scene.requiredCapabilities.every((cap) => context.availableCapabilities.includes(cap)))
    .map((scene) => {
      const matched = scene.useWhen.filter((tag) => context.signals.includes(tag));
      const styleBoost = context.style?.preferredSceneIds.includes(scene.id) ? 1 : 0;
      return {
        scene,
        score: matched.length * 3 + styleBoost,
        reasons: [...matched.map((tag) => `signal:${tag}`), ...(styleBoost ? ["style_preference"] : [])],
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.scene.id.localeCompare(b.scene.id))
    .slice(0, limit);
}
