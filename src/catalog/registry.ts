import type { AssetCapability, EditingPattern, ScenePattern, StyleProfile } from "../core/types.js";

export class CatalogRegistry {
  readonly editing = new Map<string, EditingPattern>();
  readonly scenes = new Map<string, ScenePattern>();
  readonly assets = new Map<string, AssetCapability>();
  readonly styles = new Map<string, StyleProfile>();

  constructor(input: {
    editing?: EditingPattern[];
    scenes?: ScenePattern[];
    assets?: AssetCapability[];
    styles?: StyleProfile[];
  }) {
    for (const item of input.editing ?? []) this.addUnique(this.editing, item.id, item);
    for (const item of input.scenes ?? []) this.addUnique(this.scenes, item.id, item);
    for (const item of input.assets ?? []) this.addUnique(this.assets, item.id, item);
    for (const item of input.styles ?? []) this.addUnique(this.styles, item.id, item);
  }

  private addUnique<T>(map: Map<string, T>, id: string, value: T): void {
    if (map.has(id)) throw new Error(`Duplicate catalog id: ${id}`);
    map.set(id, value);
  }

  editingForIntent(intent: string): EditingPattern[] {
    return [...this.editing.values()].filter((pattern) => pattern.intents.includes(intent));
  }

  editingForInputMode(inputMode: "generated" | "raw" | "hybrid"): EditingPattern[] {
    return [...this.editing.values()].filter((pattern) => pattern.inputModes.includes(inputMode));
  }

  sceneForUseCase(tag: string): ScenePattern[] {
    return [...this.scenes.values()].filter((scene) => scene.useWhen.includes(tag));
  }

  requireStyle(id: string): StyleProfile {
    const profile = this.styles.get(id);
    if (!profile) throw new Error(`Unknown style profile: ${id}`);
    return profile;
  }
}
