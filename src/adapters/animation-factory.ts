import type { EditOperation, EditingPattern } from "../core/types.js";
import type { AdapterResult, RendererAdapter, RendererEvent } from "./types.js";

type Mapping = (operation: EditOperation) => RendererEvent[];
const duration = (operation: EditOperation): number => Math.max(0.01, operation.end - operation.start);

const mappings: Record<string, Mapping> = {
  "VS-T01": (op) => [{ type: "ui.caption", at: op.start, duration: duration(op), payload: { text: op.params.text ?? "" } }],
  "VS-T04": (op) => [{ type: "ui.caption", at: op.start, duration: duration(op), payload: { text: op.params.text ?? "" } }],
  "VS-I01": (op) => [{ type: "ui.essayCard", at: op.start, duration: duration(op), payload: { title: op.params.title ?? "", body: op.params.body ?? "" } }],
  "VS-I12": (op) => [{ type: "ui.essayCard", at: op.start, duration: duration(op), payload: { title: op.params.source ?? "", body: op.params.quote ?? "" } }],
  "VS-R01": (op) => [{ type: "camera.zoom", at: op.start, duration: duration(op), payload: { zoom: op.params.zoom ?? 1.15 } }],
  "VS-R08": (op) => [{ type: "camera.shake", at: op.start, duration: duration(op), payload: { intensity: op.params.intensity ?? 1 } }],
  "VS-E06": (op) => [{ type: "transition.fade", at: op.start, duration: duration(op), payload: { mode: op.params.mode ?? "out", color: op.params.color ?? "#000000" } }],
  "VS-B02": (op) => [{ type: "ui.caption", at: op.start, duration: duration(op), payload: { text: op.params.text ?? "" } }],
  "VS-C05": (op) => [{ type: "ui.essayCard", at: op.start, duration: duration(op), payload: { title: op.params.title ?? "Summary", body: op.params.body ?? "" } }],
};

export const animationFactoryAdapter: RendererAdapter = {
  id: "animation-factory",
  canMap(pattern: EditingPattern): boolean {
    return pattern.implementation.adapter === "animation-factory" && Boolean(mappings[pattern.id]);
  },
  map(operation: EditOperation, pattern: EditingPattern): AdapterResult {
    const mapping = mappings[pattern.id];
    if (!mapping) {
      return {
        status: "unsupported",
        fallbackPatternIds: pattern.implementation.fallbackPatternIds,
        reason: `Animation Factory does not currently expose a mapping for ${pattern.id}`,
      };
    }
    return { status: "mapped", events: mapping(operation) };
  },
};
