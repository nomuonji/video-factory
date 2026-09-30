import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { Video } from "./Video.js";
import type { RenderSpec } from "./types.js";

const defaultSpec: RenderSpec = {
  productionId: "preview",
  title: "Video Factory Preview",
  styleProfileId: "youtube-standard",
  width: 1920,
  height: 1080,
  fps: 30,
  durationSeconds: 10,
  scenes: [],
  operations: [],
  assets: [],
  rendererReport: { rendererId: "remotion", omittedOperationIds: [], warnings: [] },
};

const calculateMetadata: CalculateMetadataFunction<RenderSpec> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil(props.durationSeconds * props.fps)),
  fps: props.fps,
  width: props.width,
  height: props.height,
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Video"
    component={Video}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={defaultSpec}
    calculateMetadata={calculateMetadata}
  />
);
