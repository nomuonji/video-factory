import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import process from "node:process";
import type { EditPlan, EditingPattern, ProductionBrief, ProducedAssetRecord, Storyboard, StyleProfile } from "../src/core/types.js";
import { applyEditingGuardrails } from "../src/planner/guardrails.js";
import { buildRenderSpec, type RendererSupportCatalog } from "../src/runner/build-render-spec.js";

const id = process.argv[2];
if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) throw new Error("Usage: npm run prepare:production -- <production-id>");

const root = process.cwd();
const dir = resolve(root, "productions", id);
const load = async <T>(name: string): Promise<T> => JSON.parse(await readFile(join(dir, name), "utf8")) as T;
const loadRoot = async <T>(path: string): Promise<T> => JSON.parse(await readFile(resolve(root, path), "utf8")) as T;

const brief = await load<ProductionBrief>("brief.json");
const storyboard = await load<Storyboard>("storyboard.json");
const editPlan = await load<EditPlan>("edit-plan.json");
let assets: ProducedAssetRecord[] = [];
try { assets = await load<ProducedAssetRecord[]>("assets.json"); } catch { assets = []; }

const styleCatalog = await loadRoot<{profiles: StyleProfile[]}>("catalog/styles/styles.json");
const editingCatalog = await loadRoot<{patterns: EditingPattern[]}>("catalog/editing/patterns.json");
const rendererSupport = await loadRoot<RendererSupportCatalog>("catalog/renderers/remotion.json");
const style = styleCatalog.profiles.find((item) => item.id === editPlan.styleProfileId);
if (!style) throw new Error(`Unknown style profile: ${editPlan.styleProfileId}`);

const patternMap = new Map(editingCatalog.patterns.map((pattern) => [pattern.id, pattern]));
const guarded = applyEditingGuardrails(editPlan.operations, patternMap, style);
const unknown = guarded.rejected.filter((item) => item.reason === "unknown_pattern");
if (unknown.length) throw new Error(`Unknown edit patterns: ${unknown.map((item) => item.operation.patternId).join(", ")}`);

const guardedPlan: EditPlan = { ...editPlan, operations: guarded.accepted };
const spec = buildRenderSpec({ brief, storyboard, editPlan: guardedPlan, style, assets, rendererSupport });

const generated = join(dir, ".generated");
await mkdir(generated, { recursive: true });
await writeFile(join(generated, "render-props.json"), JSON.stringify(spec, null, 2) + "\n");
await writeFile(join(generated, "report.json"), JSON.stringify({
  productionId: id,
  rejectedByGuardrails: guarded.rejected.map((item) => ({ id:item.operation.id, patternId:item.operation.patternId, reason:item.reason })),
  renderer: spec.rendererReport
}, null, 2) + "\n");

console.log(`Prepared ${id}: ${spec.scenes.length} scenes, ${spec.operations.length} renderable operations.`);
for (const warning of spec.rendererReport.warnings) console.warn("warning:", warning);
