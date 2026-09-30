import type { EditPlan, ProductionBrief, ProducedAssetRecord, Storyboard, StyleProfile } from "../core/types.js";
import type { RenderSpec, RenderScene } from "../../renderer/remotion/types.js";

export interface RendererSupportEntry {
  status: "supported" | "partial" | "planned";
  component?: string;
  note?: string;
}

export interface RendererSupportCatalog {
  version: number;
  renderer: string;
  patterns: Record<string, RendererSupportEntry>;
}

const dimensions = (format: ProductionBrief["format"]): { width: number; height: number } => {
  if (format === "vertical") return { width: 1080, height: 1920 };
  if (format === "square") return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
};

export function buildRenderSpec(input: {
  brief: ProductionBrief;
  storyboard: Storyboard;
  editPlan: EditPlan;
  style: StyleProfile;
  assets: ProducedAssetRecord[];
  rendererSupport: RendererSupportCatalog;
}): RenderSpec {
  const { brief, storyboard, editPlan, assets, rendererSupport } = input;
  if (brief.id !== storyboard.productionId || brief.id !== editPlan.productionId) {
    throw new Error("Brief, Storyboard and Edit Plan production IDs must match.");
  }

  let cursor = 0;
  const scenes: RenderScene[] = storyboard.scenes.map((scene) => {
    const startSeconds = cursor;
    cursor += scene.durationSeconds;
    return { ...scene, startSeconds, endSeconds: cursor };
  });

  if (Math.abs(cursor - editPlan.durationSeconds) > 0.25) {
    throw new Error(`Storyboard duration (${cursor}s) does not match Edit Plan duration (${editPlan.durationSeconds}s).`);
  }

  const knownScenes = new Set(scenes.map((scene) => scene.id));
  const warnings: string[] = [];
  const omittedOperationIds: string[] = [];
  const operations = editPlan.operations.filter((operation) => {
    if (!knownScenes.has(operation.sceneId)) {
      throw new Error(`Edit operation ${operation.id} references unknown scene ${operation.sceneId}.`);
    }
    if (operation.start < 0 || operation.end <= operation.start || operation.end > editPlan.durationSeconds + 0.001) {
      throw new Error(`Edit operation ${operation.id} has invalid timing.`);
    }
    const support = rendererSupport.patterns[operation.patternId];
    if (!support || support.status === "planned") {
      omittedOperationIds.push(operation.id);
      warnings.push(`${operation.id}: ${operation.patternId} is not implemented by ${rendererSupport.renderer}; base scene remains visible.`);
      return false;
    }
    if (support.status === "partial" && support.note) warnings.push(`${operation.id}: ${support.note}`);
    return true;
  });

  const { width, height } = dimensions(brief.format);
  return {
    productionId: brief.id,
    title: brief.title,
    styleProfileId: editPlan.styleProfileId,
    width,
    height,
    fps: 30,
    durationSeconds: editPlan.durationSeconds,
    scenes,
    operations,
    assets,
    rendererReport: {
      rendererId: rendererSupport.renderer,
      omittedOperationIds,
      warnings,
    },
  };
}
