import type { EditOperation, EditingPattern } from "../core/types.js";

export interface RendererEvent {
  type: string;
  at: number;
  duration?: number;
  payload: Record<string, unknown>;
}

export type AdapterResult =
  | { status: "mapped"; events: RendererEvent[]; notes?: string[] }
  | { status: "unsupported"; fallbackPatternIds: string[]; reason: string };

export interface RendererAdapter {
  id: string;
  canMap(pattern: EditingPattern): boolean;
  map(operation: EditOperation, pattern: EditingPattern): AdapterResult;
}
