import React from "react";
import { Audio, Video as MediaVideo } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";
import type { EditOperation, ProducedAssetRecord, StoryboardVisual } from "../../src/core/types.ts";
import type { RenderScene, RenderSpec } from "./types.ts";

const palette = {
  bg: "#0b1020",
  panel: "rgba(17, 24, 39, 0.88)",
  text: "#f8fafc",
  muted: "#cbd5e1",
  accent: "#7dd3fc",
  accent2: "#fbbf24",
  danger: "#fb7185",
};

const baseFont: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: palette.text,
};

const safePadding = (height: number) => Math.round(height * 0.07);

const Card: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: palette.panel,
      border: "2px solid rgba(255,255,255,0.1)",
      borderRadius: 32,
      padding: "44px 52px",
      boxShadow: "0 24px 80px rgba(0,0,0,.35)",
      ...style,
    }}
  >
    {children}
  </div>
);


const SceneMedia: React.FC<{ scene: RenderScene; assets: ProducedAssetRecord[] }> = ({ scene, assets }) => {
  const media = assets.find((asset) =>
    asset.sceneId === scene.id
    && ["image", "illustration", "generated-video", "screen_capture", "document_capture", "icon", "diagram", "chart", "map", "character", "code_render"].includes(asset.capabilityId),
  );
  if (!media) return null;

  const src = assetSource(media);
  const prominent = ["generated-broll", "product-showcase", "screen-demo"].includes(scene.scenePatternId);
  const mediaStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: prominent ? 1 : 0.34,
  };

  return (
    <AbsoluteFill>
      {media.capabilityId === "generated-video" || media.mediaType.startsWith("video/")
        ? <MediaVideo src={src} muted style={mediaStyle} />
        : <Img src={src} style={mediaStyle} />}
      <AbsoluteFill
        style={{
          background: prominent
            ? "linear-gradient(180deg, rgba(5,8,22,.10), rgba(5,8,22,.58))"
            : "rgba(5,8,22,.42)",
        }}
      />
    </AbsoluteFill>
  );
};

const SceneContent: React.FC<{ scene: RenderScene; operations: EditOperation[]; assets: ProducedAssetRecord[] }> = ({ scene, operations, assets }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const visual: StoryboardVisual = scene.visual ?? {};
  const headline = typeof visual.headline === "string" ? visual.headline : scene.purpose;
  const body = typeof visual.body === "string" ? visual.body : scene.narration;
  const steps = Array.isArray(visual.steps) ? visual.steps.map(String) : [];
  const opSteps = operations.find((op) => op.patternId === "VS-I03")?.params.steps;
  const resolvedSteps = steps.length ? steps : Array.isArray(opSteps) ? opSteps.map(String) : [];
  const transform = `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`;

  if (scene.scenePatternId === "narrated-diagram") {
    return (
      <AbsoluteFill style={{ ...baseFont, padding: safePadding(height), justifyContent: "center" }}>
        <SceneMedia scene={scene} assets={assets} />
        <div style={{ fontSize: height * 0.06, fontWeight: 800, marginBottom: 48, transform }}>{headline}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {(resolvedSteps.length ? resolvedSteps : [body]).map((step, index) => (
            <React.Fragment key={`${step}-${index}`}>
              <Card style={{ padding: "30px 34px", minWidth: width * 0.16, textAlign: "center" }}>
                <div style={{ fontSize: height * 0.036, fontWeight: 750 }}>{step}</div>
              </Card>
              {index < (resolvedSteps.length || 1) - 1 ? (
                <div style={{ fontSize: height * 0.05, color: palette.accent }}>→</div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 54, fontSize: height * 0.032, lineHeight: 1.5, color: palette.muted, maxWidth: width * 0.82 }}>{body}</div>
      </AbsoluteFill>
    );
  }

  if (scene.scenePatternId === "definition-card") {
    return (
      <AbsoluteFill style={{ ...baseFont, padding: safePadding(height), justifyContent: "center", alignItems: "center" }}>
        <SceneMedia scene={scene} assets={assets} />
        <Card style={{ width: "82%", transform }}>
          <div style={{ color: palette.accent, fontSize: height * 0.028, fontWeight: 800, marginBottom: 20 }}>DEFINITION</div>
          <div style={{ fontSize: height * 0.07, fontWeight: 900, marginBottom: 28 }}>{headline}</div>
          <div style={{ fontSize: height * 0.034, lineHeight: 1.55, color: palette.muted }}>{body}</div>
        </Card>
      </AbsoluteFill>
    );
  }

  if (scene.scenePatternId === "outro") {
    return (
      <AbsoluteFill style={{ ...baseFont, padding: safePadding(height), justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <SceneMedia scene={scene} assets={assets} />
        <div style={{ fontSize: height * 0.034, color: palette.accent, fontWeight: 800, marginBottom: 24 }}>TAKEAWAY</div>
        <div style={{ fontSize: height * 0.066, lineHeight: 1.25, fontWeight: 900, maxWidth: width * 0.86, transform, whiteSpace: "pre-line" }}>{headline}</div>
        <div style={{ fontSize: height * 0.033, lineHeight: 1.55, color: palette.muted, marginTop: 36, maxWidth: width * 0.82 }}>{body}</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ ...baseFont, padding: safePadding(height), justifyContent: "center" }}>
      <SceneMedia scene={scene} assets={assets} />
      <div style={{ fontSize: height * 0.075, lineHeight: 1.15, fontWeight: 900, maxWidth: width * 0.88, transform, whiteSpace: "pre-line" }}>{headline}</div>
      <div style={{ marginTop: 36, fontSize: height * 0.034, lineHeight: 1.55, color: palette.muted, maxWidth: width * 0.84 }}>{body}</div>
    </AbsoluteFill>
  );
};

const OperationOverlay: React.FC<{ operation: EditOperation }> = ({ operation }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const appear = spring({ frame, fps, config: { damping: 16, stiffness: 150 } });
  const text = String(operation.params.text ?? operation.params.title ?? operation.params.body ?? "");
  const common: CSSProperties = { ...baseFont, opacity: interpolate(appear, [0, 1], [0, 1]) };

  if (["VS-T01", "VS-T13", "VS-S02"].includes(operation.patternId)) {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: safePadding(height) }}>
        <div style={{ ...common, background: "rgba(0,0,0,.76)", borderRadius: 18, padding: "18px 28px", fontSize: height * 0.032, fontWeight: 800, textAlign: "center", maxWidth: width * 0.88 }}>{text}</div>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-T04") {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: safePadding(height) }}>
        <div style={{ ...common, transform: `scale(${interpolate(appear,[0,1],[0.7,1])}) rotate(-2deg)`, background: palette.danger, padding: "22px 34px", borderRadius: 20, fontSize: height * 0.055, fontWeight: 950, boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}>{text}</div>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-T11") {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: safePadding(height), pointerEvents: "none" }}>
        <div style={{ ...common, fontSize: height * 0.06, fontWeight: 950, color: palette.accent2, textShadow: "0 5px 30px rgba(0,0,0,.7)", transform: `scale(${interpolate(appear,[0,1],[0.85,1])})`, textAlign: "center", maxWidth: width * 0.88 }}>{text}</div>
      </AbsoluteFill>
    );
  }

  if (["VS-T10","VS-T14","VS-I14"].includes(operation.patternId)) {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: safePadding(height) }}>
        <Card style={{ ...common, padding: "18px 24px", maxWidth: width * 0.7 }}>
          <div style={{ fontSize: height * 0.022, color: palette.muted, lineHeight: 1.45 }}>{text}</div>
        </Card>
      </AbsoluteFill>
    );
  }

  if (["VS-I01","VS-C05","VS-E04","VS-G01","VS-G05","VS-C02","VS-C06"].includes(operation.patternId)) {
    const title = String(operation.params.title ?? operation.params.question ?? operation.params.result ?? "");
    const body = String(operation.params.body ?? operation.params.text ?? "");
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: safePadding(height) }}>
        <Card style={{ ...common, width: "82%", textAlign: "center", transform: `scale(${interpolate(appear,[0,1],[0.92,1])})` }}>
          <div style={{ fontSize: height * 0.055, fontWeight: 900 }}>{title}</div>
          {body ? <div style={{ marginTop: 24, fontSize: height * 0.03, lineHeight: 1.5, color: palette.muted }}>{body}</div> : null}
        </Card>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-I03") {
    const steps = Array.isArray(operation.params.steps) ? operation.params.steps.map(String) : [];
    return (
      <AbsoluteFill style={{ justifyContent: "center", padding: safePadding(height) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {steps.map((step,index)=>(
            <React.Fragment key={`${step}-${index}`}>
              <Card style={{ padding: "22px 24px", flex: 1, textAlign: "center" }}>
                <div style={{ ...common, fontSize: height * 0.028, fontWeight: 800 }}>{step}</div>
              </Card>
              {index < steps.length - 1 ? <div style={{ fontSize: height * 0.038, color: palette.accent }}>→</div> : null}
            </React.Fragment>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-I02") {
    const left = String(operation.params.left ?? "A");
    const right = String(operation.params.right ?? "B");
    return (
      <AbsoluteFill style={{ justifyContent: "center", padding: safePadding(height) }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          {[left,right].map((value,index)=><Card key={value+index}><div style={{ ...common, fontSize: height * 0.05, fontWeight: 900, textAlign: "center" }}>{value}</div></Card>)}
        </div>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-I05") {
    const number = String(operation.params.number ?? text);
    const label = String(operation.params.label ?? "");
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...common, textAlign: "center", transform: `scale(${interpolate(appear,[0,1],[0.6,1])})` }}>
          <div style={{ fontSize: height * 0.14, fontWeight: 950, color: palette.accent2 }}>{number}</div>
          {label ? <div style={{ fontSize: height * 0.035, color: palette.muted }}>{label}</div> : null}
        </div>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-I12") {
    const quote = String(operation.params.quote ?? operation.params.body ?? "");
    const source = String(operation.params.source ?? "");
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: safePadding(height) }}>
        <Card style={{ ...common, width: "82%" }}>
          <div style={{ fontSize: height * 0.046, lineHeight: 1.45, fontWeight: 750 }}>“{quote}”</div>
          {source ? <div style={{ marginTop: 26, color: palette.accent, fontSize: height * 0.026 }}>— {source}</div> : null}
        </Card>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-I13") {
    const items = Array.isArray(operation.params.items) ? operation.params.items.map(String) : [];
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: safePadding(height) }}>
        <Card style={{ ...common, width: "82%" }}>
          {items.map((item,index)=><div key={item+index} style={{ fontSize: height * 0.035, lineHeight: 1.6, margin: "10px 0" }}>• {item}</div>)}
        </Card>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-B02") {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-start", padding: safePadding(height) }}>
        <div style={{ ...common, alignSelf: "flex-start", background: palette.accent, color: palette.bg, padding: "14px 24px", borderRadius: 999, fontSize: height * 0.024, fontWeight: 900 }}>{text}</div>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-B03") {
    const name = String(operation.params.name ?? operation.params.title ?? "");
    const role = String(operation.params.role ?? "");
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: safePadding(height) }}>
        <Card style={{ ...common, padding: "18px 24px", alignSelf: "flex-start" }}>
          <div style={{ fontSize: height * 0.03, fontWeight: 900 }}>{name}</div>
          {role ? <div style={{ color: palette.muted, marginTop: 4, fontSize: height * 0.021 }}>{role}</div> : null}
        </Card>
      </AbsoluteFill>
    );
  }

  if (operation.patternId === "VS-E08") {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...common, fontSize: height * 0.07, fontWeight: 900 }}>{text}</div>
      </AbsoluteFill>
    );
  }

  return null;
};

const SceneSequence: React.FC<{ scene: RenderScene; operations: EditOperation[]; assets: ProducedAssetRecord[] }> = ({ scene, operations, assets }) => {
  const { fps } = useVideoConfig();
  const from = Math.round(scene.startSeconds * fps);
  const durationInFrames = Math.max(1, Math.round((scene.endSeconds - scene.startSeconds) * fps));
  return (
    <Sequence from={from} durationInFrames={durationInFrames}>
      <SceneContent scene={scene} operations={operations.filter((op) => op.sceneId === scene.id)} assets={assets.filter((asset) => asset.sceneId === scene.id)} />
    </Sequence>
  );
};

const assetSource = (asset: ProducedAssetRecord): string =>
  /^https?:\/\//i.test(asset.uri) ? asset.uri : staticFile(asset.uri.replace(/^\/+/, ""));

const NarrationTracks: React.FC<{ spec: RenderSpec }> = ({ spec }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {spec.assets
        .filter((asset) => asset.capabilityId === "narration" && Boolean(asset.sceneId))
        .map((asset) => {
          const scene = spec.scenes.find((item) => item.id === asset.sceneId);
          if (!scene) return null;
          const from = Math.round(scene.startSeconds * fps);
          const durationInFrames = Math.max(1, Math.round((scene.endSeconds - scene.startSeconds) * fps));
          return (
            <Sequence key={asset.id} from={from} durationInFrames={durationInFrames}>
              <Audio src={assetSource(asset)} volume={Number.isFinite(Number(asset.metadata?.volume)) ? Number(asset.metadata?.volume) : 1} />
            </Sequence>
          );
        })}
    </>
  );
};


type SubtitleSegment = { start: number; end: number; text: string };

const SubtitleAsset: React.FC<{ asset: ProducedAssetRecord }> = ({ asset }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const raw = asset.metadata?.segments;
  if (!Array.isArray(raw)) return null;

  const segments = raw.filter((item): item is SubtitleSegment => {
    if (!item || typeof item !== "object") return false;
    const rec = item as Record<string, unknown>;
    return Number.isFinite(Number(rec.start))
      && Number.isFinite(Number(rec.end))
      && typeof rec.text === "string";
  });
  const second = frame / fps;
  const active = segments.find((segment) => second >= Number(segment.start) && second < Number(segment.end));
  if (!active) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: Math.round(height * 0.055),
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          ...baseFont,
          maxWidth: width * 0.88,
          background: "rgba(0,0,0,.72)",
          borderRadius: 18,
          padding: "16px 24px",
          fontSize: Math.max(22, height * 0.03),
          fontWeight: 800,
          lineHeight: 1.35,
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(0,0,0,.25)",
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

const SubtitleTracks: React.FC<{ spec: RenderSpec }> = ({ spec }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {spec.assets
        .filter((asset) => asset.capabilityId === "subtitle" && Boolean(asset.sceneId))
        .map((asset) => {
          const scene = spec.scenes.find((item) => item.id === asset.sceneId);
          if (!scene) return null;
          const from = Math.round(scene.startSeconds * fps);
          const durationInFrames = Math.max(1, Math.round((scene.endSeconds - scene.startSeconds) * fps));
          return (
            <Sequence key={asset.id} from={from} durationInFrames={durationInFrames}>
              <SubtitleAsset asset={asset} />
            </Sequence>
          );
        })}
    </>
  );
};

const SupportingAudioTracks: React.FC<{ spec: RenderSpec }> = ({ spec }) => {
  const { fps } = useVideoConfig();
  const supported = new Set(["music", "sfx", "ambient_audio"]);
  return (
    <>
      {spec.assets
        .filter((asset) => supported.has(asset.capabilityId) && Boolean(asset.sceneId))
        .map((asset) => {
          const scene = spec.scenes.find((item) => item.id === asset.sceneId);
          if (!scene) return null;
          const from = Math.round(scene.startSeconds * fps);
          const durationInFrames = Math.max(1, Math.round((scene.endSeconds - scene.startSeconds) * fps));
          const fallbackVolume = asset.capabilityId === "music"
            ? 0.14
            : asset.capabilityId === "ambient_audio"
              ? 0.18
              : 0.5;
          const configuredVolume = Number(asset.metadata?.volume);
          const volume = Number.isFinite(configuredVolume) ? configuredVolume : fallbackVolume;
          return (
            <Sequence key={asset.id} from={from} durationInFrames={durationInFrames}>
              <Audio src={assetSource(asset)} volume={volume} />
            </Sequence>
          );
        })}
    </>
  );
};


const VoiceCredits: React.FC<{ spec: RenderSpec }> = ({ spec }) => {
  const { fps, height } = useVideoConfig();
  const credits = [...new Set(
    spec.assets
      .filter((asset) => asset.capabilityId === "narration")
      .map((asset) => asset.metadata?.attribution)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  )];
  if (!credits.length) return null;

  const durationSeconds = Math.min(4, spec.durationSeconds);
  const from = Math.max(0, Math.round((spec.durationSeconds - durationSeconds) * fps));
  const durationInFrames = Math.max(1, Math.round(durationSeconds * fps));

  return (
    <Sequence from={from} durationInFrames={durationInFrames}>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "flex-end",
          padding: Math.round(height * 0.025),
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            ...baseFont,
            fontSize: Math.max(16, height * 0.018),
            color: "rgba(248,250,252,.72)",
            textShadow: "0 2px 8px rgba(0,0,0,.8)",
          }}
        >
          {credits.join(" / ")}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

export const Video: React.FC<RenderSpec> = (spec) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const active = spec.operations.filter((op) => seconds >= op.start && seconds < op.end);

  const punch = active.find((op) => op.patternId === "VS-R01");
  const darkZoom = active.find((op) => op.patternId === "VS-R03");
  const shake = active.find((op) => op.patternId === "VS-R08");
  const monochrome = active.find((op) => op.patternId === "VS-R09");

  let scale = 1;
  if (punch || darkZoom) {
    const op = punch ?? darkZoom!;
    const local = Math.max(0, seconds - op.start);
    scale = interpolate(
      local,
      [0, Math.min(0.22, (op.end - op.start) / 2), Math.max(0.23, op.end - op.start)],
      [1, Number(op.params.zoom ?? 1.12), Number(op.params.zoom ?? 1.12)],
      { extrapolateRight: "clamp" },
    );
  }
  const shakeX = shake ? Math.sin(frame * 2.7) * Number(shake.params.intensity ?? 10) : 0;
  const shakeY = shake ? Math.cos(frame * 3.1) * Number(shake.params.intensity ?? 7) : 0;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 20% 10%, #16213e 0%, ${palette.bg} 50%, #050816 100%)`, overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", transform: `translate(${shakeX}px,${shakeY}px) scale(${scale})`, transformOrigin: "center center", filter: monochrome ? "grayscale(1)" : undefined }}>
        {spec.scenes.map((scene) => <SceneSequence key={scene.id} scene={scene} operations={spec.operations} assets={spec.assets} />)}
      </div>

      {darkZoom ? <AbsoluteFill style={{ background: "rgba(0,0,0,.22)", pointerEvents: "none" }} /> : null}

      {spec.operations.map((operation) => {
        const from = Math.round(operation.start * fps);
        const durationInFrames = Math.max(1, Math.round((operation.end - operation.start) * fps));
        if (["VS-R01","VS-R03","VS-R08","VS-R09","VS-E06","VS-S01"].includes(operation.patternId)) return null;
        return (
          <Sequence key={operation.id} from={from} durationInFrames={durationInFrames}>
            <OperationOverlay operation={operation} />
          </Sequence>
        );
      })}

      {spec.operations.filter((op) => op.patternId === "VS-E06").map((operation) => {
        const from = Math.round(operation.start * fps);
        const durationInFrames = Math.max(1, Math.round((operation.end - operation.start) * fps));
        return (
          <Sequence key={operation.id} from={from} durationInFrames={durationInFrames}>
            <FadeOverlay durationInFrames={durationInFrames} />
          </Sequence>
        );
      })}

      <SupportingAudioTracks spec={spec} />
      <NarrationTracks spec={spec} />
      <SubtitleTracks spec={spec} />
      <VoiceCredits spec={spec} />
    </AbsoluteFill>
  );
};

const FadeOverlay: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ background: "#000", opacity }} />;
};
