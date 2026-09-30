import type { EditOperation, ProducedAssetRecord, StoryboardScene } from "../../src/core/types.js";

export interface RenderScene extends StoryboardScene {
  startSeconds: number;
  endSeconds: number;
}

export interface RenderSpec {
  productionId: string;
  title: string;
  styleProfileId: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  scenes: RenderScene[];
  operations: EditOperation[];
  assets: ProducedAssetRecord[];
  rendererReport: {
    rendererId: string;
    omittedOperationIds: string[];
    warnings: string[];
  };
}
