import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetProvider, AssetProviderContext, AssetRequest, ProducedAsset } from "../provider.js";

interface VoicevoxQuery {
  speedScale?: number;
  intonationScale?: number;
  pitchScale?: number;
  volumeScale?: number;
  prePhonemeLength?: number;
  postPhonemeLength?: number;
  outputSamplingRate?: number;
  outputStereo?: boolean;
  [key: string]: unknown;
}

const safeName = (value: string): string => value.replace(/[^A-Za-z0-9._-]+/g, "-");

const numberConfig = (
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number => {
  const raw = config[key];
  const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : fallback;
  return Number.isFinite(value) ? value : fallback;
};

const fetchJson = async (url: URL, init: RequestInit, label: string): Promise<VoicevoxQuery> => {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
  return await response.json() as VoicevoxQuery;
};

export const voicevoxProvider: AssetProvider = {
  id: "voicevox",
  capabilities: ["narration"],
  priority: 100,

  canHandle(request: AssetRequest): boolean {
    const text = request.inputs.text;
    const language = request.inputs.language;
    return request.capabilityId === "narration"
      && typeof text === "string"
      && text.trim().length > 0
      && (typeof language !== "string" || language.toLowerCase().startsWith("ja"));
  },

  async produce(request: AssetRequest, context: AssetProviderContext): Promise<ProducedAsset> {
    const text = String(request.inputs.text ?? "").trim();
    const baseUrl = String(
      context.providerConfig.url
      ?? process.env.VOICEVOX_URL
      ?? "http://127.0.0.1:50021",
    ).replace(/\/$/, "");
    const speaker = numberConfig(
      context.providerConfig,
      "speaker",
      Number(process.env.VOICEVOX_SPEAKER ?? 3),
    );

    const queryUrl = new URL(`${baseUrl}/audio_query`);
    queryUrl.searchParams.set("speaker", String(speaker));
    queryUrl.searchParams.set("text", text);
    const query = await fetchJson(queryUrl, { method: "POST" }, "VOICEVOX /audio_query");

    query.speedScale = numberConfig(context.providerConfig, "speedScale", 1);
    query.intonationScale = numberConfig(context.providerConfig, "intonationScale", 1);
    query.pitchScale = numberConfig(context.providerConfig, "pitchScale", 0);
    query.volumeScale = numberConfig(context.providerConfig, "volumeScale", 1);
    query.prePhonemeLength = Math.max(Number(query.prePhonemeLength ?? 0.1), 0.08);
    query.postPhonemeLength = Math.max(Number(query.postPhonemeLength ?? 0.1), 0.12);
    query.outputSamplingRate = 48000;
    query.outputStereo = false;

    const synthesisUrl = new URL(`${baseUrl}/synthesis`);
    synthesisUrl.searchParams.set("speaker", String(speaker));
    const response = await fetch(synthesisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!response.ok) {
      throw new Error(`VOICEVOX /synthesis failed: ${response.status} ${response.statusText}`);
    }

    await mkdir(context.outputDir, { recursive: true });
    const scene = safeName(context.sceneId ?? request.id);
    const filename = `narration-${scene}.wav`;
    const output = join(context.outputDir, filename);
    await writeFile(output, Buffer.from(await response.arrayBuffer()));

    return {
      id: `${context.productionId}:${request.id}:voicevox`,
      requestId: request.id,
      capabilityId: "narration",
      uri: `generated/${context.productionId}/${filename}`,
      mediaType: "audio/wav",
      ...(context.sceneId ? { sceneId: context.sceneId } : {}),
      metadata: {
        provider: "voicevox",
        speaker,
        volume: numberConfig(context.providerConfig, "playbackVolume", 1),
      },
      provenance: {
        providerId: "voicevox",
        source: baseUrl,
        license: "VOICEVOX Engine and the selected voice library terms apply.",
      },
    };
  },
};
