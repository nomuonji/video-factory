import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import type { ProductionBrief, ProducedAssetRecord, Storyboard } from "../src/core/types.js";
import type { AssetRequest, ProducedAsset } from "../src/assets/provider.js";
import { AssetProviderRegistry } from "../src/assets/registry.js";
import { voicevoxProvider } from "../src/assets/providers/voicevox.js";

interface ProductionConfig {
  assetProviders?: Record<string, string>;
  providers?: Record<string, Record<string, unknown>>;
}

const id = process.argv[2];
if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) {
  throw new Error("Usage: npm run assets -- <production-id>");
}

const root = process.cwd();
const dir = resolve(root, "productions", id);
const load = async <T>(name: string): Promise<T> =>
  JSON.parse(await readFile(join(dir, name), "utf8")) as T;
const loadOptional = async <T>(name: string, fallback: T): Promise<T> => {
  try {
    return await load<T>(name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
};

const brief = await load<ProductionBrief>("brief.json");
const storyboard = await load<Storyboard>("storyboard.json");
const config = await loadOptional<ProductionConfig>("production.config.json", {});
const existing = await loadOptional<ProducedAssetRecord[]>("assets.json", []);

const registry = new AssetProviderRegistry();
registry.register(voicevoxProvider);

const generated: ProducedAsset[] = [];
const publicDir = resolve(root, "public");
const outputDir = resolve(publicDir, "generated", id);
await mkdir(outputDir, { recursive: true });

for (const scene of storyboard.scenes) {
  for (let index = 0; index < scene.assetRequests.length; index += 1) {
    const spec = scene.assetRequests[index];
    if (!spec) continue;
    const providerId = config.assetProviders?.[spec.capabilityId];
    if (!providerId || providerId === "none" || providerId === "internal") continue;

    const request: AssetRequest = {
      id: `${scene.id}:${spec.capabilityId}:${index}`,
      capabilityId: spec.capabilityId,
      brief: spec.brief,
      inputs: {
        ...spec,
        ...(spec.capabilityId === "narration"
          ? {
              text: scene.narration,
              language: brief.language,
              durationSeconds: scene.durationSeconds,
            }
          : {}),
      },
    };

    const provider = registry.requireById(providerId, request);
    const asset = await provider.produce(request, {
      productionId: id,
      sceneId: scene.id,
      rootDir: root,
      publicDir,
      outputDir,
      providerConfig: config.providers?.[providerId] ?? {},
    });
    generated.push(asset);
    console.log(`asset: ${request.id} -> ${providerId} -> ${asset.uri}`);
  }
}

const replaced = new Set(generated.map((asset) => asset.requestId));
const merged: ProducedAssetRecord[] = [
  ...existing.filter((asset) => !asset.requestId || !replaced.has(asset.requestId)),
  ...generated,
];

await writeFile(join(dir, "assets.json"), JSON.stringify(merged, null, 2) + "\n");
console.log(`Materialized ${generated.length} asset(s) for ${id}; total assets: ${merged.length}.`);
