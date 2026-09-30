import { readdir, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const editing = await load("catalog/editing/patterns.json");
const scenes = await load("catalog/scenes/scenes.json");
const assets = await load("catalog/assets/assets.json");
const styles = await load("catalog/styles/styles.json");
const plan = await load("examples/prompt-only/edit-plan.json");
const storyboard = await load("examples/prompt-only/storyboard.json");
const rendererFiles = (await readdir(new URL("catalog/renderers/", root))).filter((name) => name.endsWith(".json"));
const renderers = await Promise.all(rendererFiles.map((name) => load(`catalog/renderers/${name}`)));

const errors = [];
const fail = (message) => errors.push(message);
const unique = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item.id) fail(`${label}: missing id`);
    if (seen.has(item.id)) fail(`${label}: duplicate id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
};

const patternIds = unique(editing.patterns, "editing");
const sceneIds = unique(scenes.scenes, "scenes");
const assetIds = unique(assets.capabilities, "assets");
const styleIds = unique(styles.profiles, "styles");

if (editing.patterns.length !== 92) fail(`editing: expected 92 source patterns, found ${editing.patterns.length}`);

for (const pattern of editing.patterns) {
  for (const key of ["slug","nameJa","category","purpose","inputModes","intents","triggers","avoidWhen","requirements","intensity","densityCost","implementation","sourceRef"]) {
    if (pattern[key] === undefined) fail(`${pattern.id}: missing ${key}`);
  }
  for (const fallback of pattern.implementation.fallbackPatternIds ?? []) {
    if (!patternIds.has(fallback)) fail(`${pattern.id}: unknown fallback ${fallback}`);
  }
}

for (const scene of scenes.scenes) {
  for (const id of scene.preferredPatternIds) if (!patternIds.has(id)) fail(`${scene.id}: unknown preferred pattern ${id}`);
  for (const cap of [...scene.requiredCapabilities, ...scene.optionalCapabilities]) {
    if (!assetIds.has(cap)) fail(`${scene.id}: unknown asset capability ${cap}`);
  }
}

for (const profile of styles.profiles) {
  for (const id of profile.preferredSceneIds) if (!sceneIds.has(id)) fail(`${profile.id}: unknown preferred scene ${id}`);
}

const rendererIds = new Set();
for (const renderer of renderers) {
  if (!renderer.renderer) {
    fail("renderer catalog: missing renderer id");
    continue;
  }
  if (rendererIds.has(renderer.renderer)) fail(`renderer catalog: duplicate renderer ${renderer.renderer}`);
  rendererIds.add(renderer.renderer);
  for (const [patternId, support] of Object.entries(renderer.patterns ?? {})) {
    if (!patternIds.has(patternId)) fail(`${renderer.renderer}: unknown pattern ${patternId}`);
    if (!["supported","partial","planned"].includes(support.status)) fail(`${renderer.renderer}: invalid status for ${patternId}`);
  }
}

if (!styleIds.has(plan.styleProfileId)) fail(`example plan: unknown style ${plan.styleProfileId}`);
for (const op of plan.operations) if (!patternIds.has(op.patternId)) fail(`example plan: unknown pattern ${op.patternId}`);
for (const scene of storyboard.scenes) {
  if (!sceneIds.has(scene.scenePatternId)) fail(`example storyboard: unknown scene ${scene.scenePatternId}`);
  for (const request of scene.assetRequests) if (!assetIds.has(request.capabilityId)) fail(`example storyboard: unknown asset ${request.capabilityId}`);
}

if (errors.length) {
  for (const error of errors) console.error("Catalog validation failed:", error);
  process.exit(1);
}
console.log(`OK: ${editing.patterns.length} editing patterns, ${scenes.scenes.length} scenes, ${assets.capabilities.length} asset capabilities, ${styles.profiles.length} styles, ${renderers.length} renderer catalogs`);
