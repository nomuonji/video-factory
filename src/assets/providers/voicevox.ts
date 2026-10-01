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

interface VoicevoxSpeaker {
  name: string;
  styles?: Array<{ id: number; name: string }>;
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

const fetchJson = async <T>(url: URL, init: RequestInit, label: string): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(label + " failed: " + response.status + " " + response.statusText);
  return await response.json() as T;
};

const wavDurationSeconds = (buffer: Buffer): number | undefined => {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    return undefined;
  }

  let offset = 12;
  let byteRate: number | undefined;
  let dataSize: number | undefined;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkId === "fmt " && chunkSize >= 12 && dataOffset + 12 <= buffer.length) {
      byteRate = buffer.readUInt32LE(dataOffset + 8);
    } else if (chunkId === "data") {
      dataSize = Math.min(chunkSize, Math.max(0, buffer.length - dataOffset));
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  if (!byteRate || dataSize === undefined) return undefined;
  return dataSize / byteRate;
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
    const envSpeaker = Number(process.env.VOICEVOX_SPEAKER ?? 3);
    const defaultSpeaker = Number.isFinite(envSpeaker) ? envSpeaker : 3;
    const speaker = numberConfig(context.providerConfig, "speaker", defaultSpeaker);

    const speakers = await fetchJson<VoicevoxSpeaker[]>(
      new URL(baseUrl + "/speakers"),
      { method: "GET" },
      "VOICEVOX /speakers",
    );
    const speakerInfo = speakers
      .flatMap((entry) => (entry.styles ?? []).map((style) => ({ speakerName: entry.name, style })))
      .find((entry) => Number(entry.style.id) === speaker);
    if (!speakerInfo) throw new Error("VOICEVOX speaker/style id " + speaker + " was not found");

    const queryUrl = new URL(baseUrl + "/audio_query");
    queryUrl.searchParams.set("speaker", String(speaker));
    queryUrl.searchParams.set("text", text);
    const query = await fetchJson<VoicevoxQuery>(queryUrl, { method: "POST" }, "VOICEVOX /audio_query");

    query.speedScale = numberConfig(context.providerConfig, "speedScale", 1);
    query.intonationScale = numberConfig(context.providerConfig, "intonationScale", 1);
    query.pitchScale = numberConfig(context.providerConfig, "pitchScale", 0);
    query.volumeScale = numberConfig(context.providerConfig, "volumeScale", 1);
    query.prePhonemeLength = Math.max(Number(query.prePhonemeLength ?? 0.1), 0.08);
    query.postPhonemeLength = Math.max(Number(query.postPhonemeLength ?? 0.1), 0.12);
    query.outputSamplingRate = 48000;
    query.outputStereo = false;

    const synthesisUrl = new URL(baseUrl + "/synthesis");
    synthesisUrl.searchParams.set("speaker", String(speaker));
    const response = await fetch(synthesisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!response.ok) {
      throw new Error("VOICEVOX /synthesis failed: " + response.status + " " + response.statusText);
    }

    const wav = Buffer.from(await response.arrayBuffer());
    const durationSeconds = wavDurationSeconds(wav);
    const targetDuration = Number(request.inputs.durationSeconds);
    const targetDurationSeconds = Number.isFinite(targetDuration) && targetDuration > 0 ? targetDuration : undefined;
    const fillRatio = durationSeconds !== undefined && targetDurationSeconds !== undefined
      ? durationSeconds / targetDurationSeconds
      : undefined;

    await mkdir(context.outputDir, { recursive: true });
    const scene = safeName(context.sceneId ?? request.id);
    const filename = "narration-" + scene + ".wav";
    const output = join(context.outputDir, filename);
    await writeFile(output, wav);

    return {
      id: context.productionId + ":" + request.id + ":voicevox",
      requestId: request.id,
      capabilityId: "narration",
      uri: "generated/" + context.productionId + "/" + filename,
      mediaType: "audio/wav",
      ...(context.sceneId ? { sceneId: context.sceneId } : {}),
      metadata: {
        provider: "voicevox",
        speaker,
        speakerName: speakerInfo.speakerName,
        styleName: speakerInfo.style.name,
        attribution: "VOICEVOX:" + speakerInfo.speakerName,
        volume: numberConfig(context.providerConfig, "playbackVolume", 1),
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        ...(targetDurationSeconds !== undefined ? { targetDurationSeconds } : {}),
        ...(fillRatio !== undefined ? { fillRatio } : {}),
      },
      provenance: {
        providerId: "voicevox",
        source: baseUrl,
        license: "VOICEVOX Engine and the selected voice library terms apply.",
      },
    };
  },
};
