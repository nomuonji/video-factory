import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetProvider, AssetProviderContext, AssetRequest, ProducedAsset } from "../provider.js";

const visualCapabilities = new Set([
  "image",
  "illustration",
  "icon",
  "diagram",
  "chart",
  "map",
  "character",
  "code_render",
]);

const audioCapabilities = new Set(["music", "sfx", "ambient_audio"]);

const safeName = (value: string): string => value.replace(/[^A-Za-z0-9._-]+/g, "-");

const escapeXml = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (seed: number): (() => number) => {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const formatDimensions = (format: unknown): { width: number; height: number } => {
  if (format === "landscape") return { width: 1920, height: 1080 };
  if (format === "square") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
};

const listStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item) => typeof item === "string" ? item : String((item as { label?: unknown })?.label ?? "")).filter(Boolean)
    : [];

const titleFrom = (request: AssetRequest): string => {
  const visual = request.inputs.visual as Record<string, unknown> | undefined;
  return String(
    request.inputs.headline
    ?? visual?.headline
    ?? request.inputs.title
    ?? request.inputs.purpose
    ?? request.brief
    ?? "",
  );
};

const bodyFrom = (request: AssetRequest): string => {
  const visual = request.inputs.visual as Record<string, unknown> | undefined;
  return String(request.inputs.body ?? visual?.body ?? request.brief ?? "");
};

const wrapText = (text: string, maxChars: number): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const out: string[] = [];
  let current = "";
  for (const char of normalized) {
    current += char;
    if (current.length >= maxChars || /[。！？!?、,]/.test(char)) {
      out.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
};

const palette = (seedText: string): { bgA: string; bgB: string; accent: string; accent2: string } => {
  const palettes = [
    { bgA: "#07111f", bgB: "#111b35", accent: "#7dd3fc", accent2: "#fbbf24" },
    { bgA: "#10101a", bgB: "#24133b", accent: "#c4b5fd", accent2: "#fb7185" },
    { bgA: "#071812", bgB: "#123326", accent: "#6ee7b7", accent2: "#fde68a" },
    { bgA: "#171109", bgB: "#33210f", accent: "#fdba74", accent2: "#fef08a" },
    { bgA: "#0c1220", bgB: "#182235", accent: "#93c5fd", accent2: "#a7f3d0" },
  ];
  return palettes[hashString(seedText) % palettes.length]!;
};

const svgBase = (
  width: number,
  height: number,
  p: ReturnType<typeof palette>,
  body: string,
): string => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bgA}"/>
      <stop offset="100%" stop-color="${p.bgB}"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${body}
</svg>`;

const abstractVisual = (request: AssetRequest, width: number, height: number): string => {
  const title = titleFrom(request);
  const p = palette(request.id + title);
  const seed = hashString(request.id + title);
  const rnd = seededRandom(seed);
  const bubbles = Array.from({ length: 8 }, (_, index) => {
    const radius = Math.round((0.05 + rnd() * 0.12) * Math.min(width, height));
    const x = Math.round(rnd() * width);
    const y = Math.round(rnd() * height);
    const color = index % 2 === 0 ? p.accent : p.accent2;
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.16" filter="url(#soft)"/>`;
  }).join("\n");

  const lines = wrapText(title, width > height ? 24 : 15).slice(0, 4);
  const fontSize = Math.round(Math.min(width, height) * 0.075);
  const titleSvg = lines.map((line, i) =>
    `<text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.18 + i * fontSize * 1.18)}" font-family="Noto Sans CJK JP, sans-serif" font-size="${fontSize}" font-weight="800" fill="#f8fafc">${escapeXml(line)}</text>`
  ).join("\n");

  return svgBase(width, height, p, `${bubbles}
    <rect x="${Math.round(width * 0.06)}" y="${Math.round(height * 0.08)}" width="${Math.round(width * 0.88)}" height="${Math.round(height * 0.84)}" rx="${Math.round(Math.min(width,height)*0.045)}" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="3"/>
    ${titleSvg}`);
};

const iconShape = (concept: string, width: number, height: number, accent: string): string => {
  const cx = width / 2;
  const cy = height / 2;
  const size = Math.min(width, height) * 0.22;
  const c = concept.toLowerCase();

  if (/lock|password|鍵|認証/.test(c)) {
    return `<path d="M ${cx-size*.55} ${cy-size*.05} v ${size*.75} h ${size*1.1} v -${size*.75} z" fill="${accent}" opacity=".92"/>
      <path d="M ${cx-size*.38} ${cy-size*.05} v -${size*.3} a ${size*.38} ${size*.38} 0 0 1 ${size*.76} 0 v ${size*.3}" fill="none" stroke="#f8fafc" stroke-width="${size*.11}" stroke-linecap="round"/>`;
  }
  if (/key|token|キー|トークン/.test(c)) {
    return `<circle cx="${cx-size*.34}" cy="${cy}" r="${size*.28}" fill="none" stroke="${accent}" stroke-width="${size*.12}"/>
      <path d="M ${cx-size*.08} ${cy} H ${cx+size*.6} M ${cx+size*.34} ${cy} v ${size*.22} M ${cx+size*.52} ${cy} v ${size*.16}" stroke="#f8fafc" stroke-width="${size*.12}" stroke-linecap="round"/>`;
  }
  if (/user|person|human|人|ユーザー/.test(c)) {
    return `<circle cx="${cx}" cy="${cy-size*.28}" r="${size*.28}" fill="${accent}"/>
      <path d="M ${cx-size*.62} ${cy+size*.62} q 0 -${size*.7} ${size*.62} -${size*.7} q ${size*.62} 0 ${size*.62} ${size*.7} z" fill="#f8fafc" opacity=".9"/>`;
  }
  if (/play|video|再生|動画/.test(c)) {
    return `<circle cx="${cx}" cy="${cy}" r="${size*.7}" fill="${accent}" opacity=".92"/>
      <polygon points="${cx-size*.18},${cy-size*.32} ${cx+size*.38},${cy} ${cx-size*.18},${cy+size*.32}" fill="#07111f"/>`;
  }
  if (/check|success|ok|完了|成功/.test(c)) {
    return `<circle cx="${cx}" cy="${cy}" r="${size*.7}" fill="${accent}" opacity=".92"/>
      <polyline points="${cx-size*.38},${cy} ${cx-size*.08},${cy+size*.28} ${cx+size*.42},${cy-size*.34}" fill="none" stroke="#07111f" stroke-width="${size*.14}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${size*.68}" fill="${accent}" opacity=".9"/>
    <circle cx="${cx}" cy="${cy}" r="${size*.26}" fill="#f8fafc"/>
    <path d="M ${cx} ${cy-size*.95} V ${cy-size*.7} M ${cx} ${cy+size*.7} V ${cy+size*.95} M ${cx-size*.95} ${cy} H ${cx-size*.7} M ${cx+size*.7} ${cy} H ${cx+size*.95}" stroke="#f8fafc" stroke-width="${size*.08}" stroke-linecap="round"/>`;
};

const iconVisual = (request: AssetRequest, width: number, height: number): string => {
  const concept = String(request.inputs.concept ?? titleFrom(request) ?? request.brief);
  const p = palette(request.id + concept);
  return svgBase(width, height, p, iconShape(concept, width, height, p.accent));
};

const diagramVisual = (request: AssetRequest, width: number, height: number): string => {
  const visual = request.inputs.visual as Record<string, unknown> | undefined;
  const steps = listStrings(request.inputs.steps ?? visual?.steps ?? request.inputs.entities);
  const nodes = steps.length ? steps.slice(0, 7) : wrapText(titleFrom(request), 12).slice(0, 4);
  const p = palette(request.id + nodes.join("|"));
  const vertical = height > width;
  const boxW = vertical ? width * 0.72 : width * 0.18;
  const boxH = vertical ? Math.min(height * 0.1, 150) : Math.min(height * 0.18, 150);
  const gap = vertical ? Math.min(height * 0.055, 90) : Math.min(width * 0.025, 55);
  const total = nodes.length * (vertical ? boxH : boxW) + Math.max(0, nodes.length - 1) * gap;
  let cursor = (vertical ? height : width) / 2 - total / 2;
  const parts: string[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    const x = vertical ? (width - boxW) / 2 : cursor;
    const y = vertical ? cursor : (height - boxH) / 2;
    parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="28" fill="rgba(15,23,42,.82)" stroke="${i === nodes.length - 1 ? p.accent2 : p.accent}" stroke-width="4"/>`);
    const fontSize = Math.round(Math.min(boxH * 0.32, 44));
    parts.push(`<text x="${x + boxW/2}" y="${y + boxH/2 + fontSize*.35}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-size="${fontSize}" font-weight="750" fill="#f8fafc">${escapeXml(nodes[i])}</text>`);

    if (i < nodes.length - 1) {
      if (vertical) {
        const xMid = width / 2;
        const y1 = y + boxH;
        const y2 = y + boxH + gap;
        parts.push(`<path d="M ${xMid} ${y1+8} V ${y2-18}" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/><polygon points="${xMid-12},${y2-28} ${xMid+12},${y2-28} ${xMid},${y2-8}" fill="${p.accent}"/>`);
      } else {
        const yMid = height / 2;
        const x1 = x + boxW;
        const x2 = x + boxW + gap;
        parts.push(`<path d="M ${x1+8} ${yMid} H ${x2-18}" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/><polygon points="${x2-28},${yMid-12} ${x2-28},${yMid+12} ${x2-8},${yMid}" fill="${p.accent}"/>`);
      }
    }
    cursor += (vertical ? boxH : boxW) + gap;
  }
  return svgBase(width, height, p, parts.join("\n"));
};

type ChartDatum = { label: string; value: number };

const chartData = (request: AssetRequest): ChartDatum[] => {
  const visual = request.inputs.visual as Record<string, unknown> | undefined;
  const raw = request.inputs.data ?? request.inputs.items ?? visual?.items;
  if (Array.isArray(raw)) {
    return raw.flatMap((item, index) => {
      if (typeof item === "number") return [{ label: String(index + 1), value: item }];
      if (typeof item === "object" && item) {
        const rec = item as Record<string, unknown>;
        const value = Number(rec.value ?? rec.amount ?? rec.count ?? rec.score);
        if (Number.isFinite(value)) return [{ label: String(rec.label ?? rec.name ?? index + 1), value }];
      }
      return [];
    });
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).flatMap(([label, v]) => {
      const value = Number(v);
      return Number.isFinite(value) ? [{ label, value }] : [];
    });
  }
  return [];
};

const chartVisual = (request: AssetRequest, width: number, height: number): string => {
  const data = chartData(request);
  if (!data.length) throw new Error("procedural chart requires numeric data; refusing to invent values");
  const items = data.slice(0, 8);
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  const p = palette(request.id + items.map((x) => x.label).join("|"));
  const marginX = width * 0.11;
  const baseline = height * 0.8;
  const usableH = height * 0.52;
  const slot = (width - marginX * 2) / items.length;
  const barW = slot * 0.58;
  const parts = items.map((item, i) => {
    const barH = Math.max(3, Math.abs(item.value) / max * usableH);
    const x = marginX + slot * i + (slot - barW)/2;
    const y = baseline - barH;
    const fs = Math.max(18, Math.min(34, slot * 0.22));
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="14" fill="${i % 2 ? p.accent2 : p.accent}" opacity=".9"/>
      <text x="${x+barW/2}" y="${baseline+fs*1.6}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-size="${fs}" fill="#cbd5e1">${escapeXml(item.label)}</text>
      <text x="${x+barW/2}" y="${Math.max(fs*1.5, y-fs*.45)}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-size="${fs}" font-weight="700" fill="#f8fafc">${escapeXml(item.value)}</text>`;
  }).join("\n");
  return svgBase(width, height, p, `<line x1="${marginX}" y1="${baseline}" x2="${width-marginX}" y2="${baseline}" stroke="rgba(255,255,255,.18)" stroke-width="3"/>${parts}`);
};

const mapVisual = (request: AssetRequest, width: number, height: number): string => {
  const visual = request.inputs.visual as Record<string, unknown> | undefined;
  const locations = listStrings(request.inputs.locations ?? request.inputs.labels ?? visual?.labels);
  if (locations.length < 2) throw new Error("procedural map requires at least two locations; it is a schematic route, not a geographic map");
  const p = palette(request.id + locations.join("|"));
  const vertical = height > width;
  const parts: string[] = [];
  for (let i = 0; i < locations.length; i += 1) {
    const t = locations.length === 1 ? 0.5 : i / (locations.length - 1);
    const x = vertical ? width * (0.34 + (i % 2) * 0.32) : width * (0.12 + t * 0.76);
    const y = vertical ? height * (0.16 + t * 0.68) : height * (0.42 + (i % 2) * 0.16);
    if (i > 0) {
      const prevT = (i-1)/(locations.length-1);
      const px = vertical ? width * (0.34 + ((i-1) % 2) * 0.32) : width * (0.12 + prevT * 0.76);
      const py = vertical ? height * (0.16 + prevT * 0.68) : height * (0.42 + ((i-1) % 2) * 0.16);
      parts.push(`<path d="M ${px} ${py} Q ${(px+x)/2 + (vertical?width*.08:0)} ${(py+y)/2 - (vertical?0:height*.1)} ${x} ${y}" fill="none" stroke="${p.accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="16 12"/>`);
    }
    parts.push(`<circle cx="${x}" cy="${y}" r="22" fill="${i===locations.length-1?p.accent2:p.accent}" stroke="#f8fafc" stroke-width="6"/>`);
    parts.push(`<text x="${x}" y="${y+58}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-size="28" font-weight="700" fill="#f8fafc">${escapeXml(locations[i])}</text>`);
  }
  return svgBase(width, height, p, parts.join("\n"));
};

const characterVisual = (request: AssetRequest, width: number, height: number): string => {
  const name = String(request.inputs.character ?? request.inputs.name ?? titleFrom(request) ?? "Character");
  const p = palette(request.id + name);
  const cx=width/2, cy=height*.48, r=Math.min(width,height)*.16;
  const body=`<circle cx="${cx}" cy="${cy-r*.6}" r="${r}" fill="${p.accent}"/>
    <circle cx="${cx-r*.34}" cy="${cy-r*.65}" r="${r*.09}" fill="#07111f"/>
    <circle cx="${cx+r*.34}" cy="${cy-r*.65}" r="${r*.09}" fill="#07111f"/>
    <path d="M ${cx-r*.35} ${cy-r*.12} Q ${cx} ${cy+r*.15} ${cx+r*.35} ${cy-r*.12}" fill="none" stroke="#07111f" stroke-width="${r*.08}" stroke-linecap="round"/>
    <path d="M ${cx-r*1.25} ${cy+r*1.5} Q ${cx-r*1.1} ${cy+r*.4} ${cx} ${cy+r*.45} Q ${cx+r*1.1} ${cy+r*.4} ${cx+r*1.25} ${cy+r*1.5} Z" fill="${p.accent2}" opacity=".86"/>
    <text x="${cx}" y="${cy+r*2}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-size="${Math.round(r*.28)}" font-weight="800" fill="#f8fafc">${escapeXml(name)}</text>`;
  return svgBase(width,height,p,body);
};

const codeVisual = (request: AssetRequest, width: number, height: number): string => {
  const code = String(request.inputs.code ?? "");
  if (!code.trim()) throw new Error("procedural code_render requires code");
  const p = palette(request.id + code.slice(0,80));
  const lines = code.split("\n").slice(0, 24);
  const fontSize = Math.max(20, Math.round(Math.min(width,height)*.026));
  const lineH = fontSize*1.45;
  const x = width*.09, y0=height*.18;
  const rows = lines.map((line,i)=>`<text x="${x}" y="${y0+i*lineH}" font-family="Noto Sans Mono CJK JP, monospace" font-size="${fontSize}" fill="${i%3===0?p.accent:"#e2e8f0"}">${escapeXml(line)}</text>`).join("\n");
  return svgBase(width,height,p,`<rect x="${width*.055}" y="${height*.07}" width="${width*.89}" height="${height*.86}" rx="32" fill="rgba(2,6,23,.82)" stroke="rgba(255,255,255,.12)" stroke-width="3"/>${rows}`);
};

const buildSvg = (request: AssetRequest): string => {
  const { width, height } = formatDimensions(request.inputs.format);
  switch (request.capabilityId) {
    case "icon": return svgBase(width,height,palette(request.id),iconShape(String(request.inputs.concept ?? titleFrom(request)),width,height,palette(request.id).accent));
    case "diagram": return diagramVisual(request,width,height);
    case "chart": return chartVisual(request,width,height);
    case "map": return mapVisual(request,width,height);
    case "character": return characterVisual(request,width,height);
    case "code_render": return codeVisual(request,width,height);
    default: return abstractVisual(request,width,height);
  }
};

const writeWav = (samples: Float32Array, sampleRate: number): Buffer => {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF",0);
  buffer.writeUInt32LE(36+dataBytes,4);
  buffer.write("WAVE",8);
  buffer.write("fmt ",12);
  buffer.writeUInt32LE(16,16);
  buffer.writeUInt16LE(1,20);
  buffer.writeUInt16LE(1,22);
  buffer.writeUInt32LE(sampleRate,24);
  buffer.writeUInt32LE(sampleRate*2,28);
  buffer.writeUInt16LE(2,32);
  buffer.writeUInt16LE(16,34);
  buffer.write("data",36);
  buffer.writeUInt32LE(dataBytes,40);
  for(let i=0;i<samples.length;i+=1){
    const v=Math.max(-1,Math.min(1,samples[i] ?? 0));
    buffer.writeInt16LE(Math.round(v*32767),44+i*2);
  }
  return buffer;
};

const proceduralAudio = (request: AssetRequest): { wav: Buffer; durationSeconds: number; volume: number } => {
  const sampleRate=24000;
  const requested=Number(request.inputs.durationSeconds);
  const duration=request.capabilityId==="sfx"
    ? Math.max(.22,Math.min(1.2,Number.isFinite(requested)?requested:.55))
    : Math.max(1,Math.min(90,Number.isFinite(requested)?requested:8));
  const length=Math.max(1,Math.round(duration*sampleRate));
  const samples=new Float32Array(length);
  const rand=seededRandom(hashString(request.id+request.brief));

  if(request.capabilityId==="sfx"){
    const intent=String(request.inputs.effect_intent ?? request.brief).toLowerCase();
    for(let i=0;i<length;i+=1){
      const t=i/sampleRate;
      const env=Math.pow(1-i/length,2);
      if(/whoosh|sweep|シュ|移動/.test(intent)){
        const freq=140+1000*(i/length);
        samples[i]=(Math.sin(2*Math.PI*freq*t)*.25+(rand()*2-1)*.24)*env;
      }else if(/chime|ding|success|正解|完了/.test(intent)){
        samples[i]=(Math.sin(2*Math.PI*880*t)*.34+Math.sin(2*Math.PI*1320*t)*.17)*env;
      }else{
        const freq=220+260*Math.exp(-t*10);
        samples[i]=Math.sin(2*Math.PI*freq*t)*.5*env;
      }
    }
    return {wav:writeWav(samples,sampleRate),durationSeconds:duration,volume:.5};
  }

  if(request.capabilityId==="ambient_audio"){
    let smooth=0;
    for(let i=0;i<length;i+=1){
      smooth=smooth*.985+(rand()*2-1)*.015;
      samples[i]=smooth*.18;
    }
    return {wav:writeWav(samples,sampleRate),durationSeconds:duration,volume:.18};
  }

  const roots=[130.81,146.83,164.81,196];
  const root=roots[hashString(request.brief)%roots.length]!;
  for(let i=0;i<length;i+=1){
    const t=i/sampleRate;
    const fadeIn=Math.min(1,t/.8);
    const fadeOut=Math.min(1,(duration-t)/.8);
    const env=Math.max(0,Math.min(fadeIn,fadeOut));
    const pulse=.72+.28*Math.sin(2*Math.PI*.22*t);
    const a=Math.sin(2*Math.PI*root*t);
    const b=Math.sin(2*Math.PI*root*1.5*t);
    const c=Math.sin(2*Math.PI*root*2*t);
    samples[i]=(a*.19+b*.10+c*.06)*env*pulse;
  }
  return {wav:writeWav(samples,sampleRate),durationSeconds:duration,volume:.14};
};

const subtitleAsset = (request: AssetRequest): { json: string; segments: Array<{start:number;end:number;text:string}> } => {
  const text=String(request.inputs.text ?? request.inputs.narration ?? "");
  if(!text.trim()) throw new Error("procedural subtitle requires text");
  const duration=Math.max(.1,Number(request.inputs.durationSeconds) || 4);
  const chunks=text.split(/(?<=[。！？!?])/).map(x=>x.trim()).filter(Boolean);
  const parts=chunks.length?chunks:[text.trim()];
  const total=Math.max(1,parts.reduce((sum,x)=>sum+x.length,0));
  let cursor=0;
  const segments=parts.map((part,index)=>{
    const share=part.length/total;
    const start=cursor;
    const end=index===parts.length-1?duration:Math.min(duration,cursor+duration*share);
    cursor=end;
    return {start:Number(start.toFixed(3)),end:Number(end.toFixed(3)),text:part};
  });
  return {json:JSON.stringify({version:1,durationSeconds:duration,segments},null,2)+"\n",segments};
};

export const proceduralProvider: AssetProvider = {
  id:"procedural",
  capabilities:[
    "subtitle",
    "image",
    "illustration",
    "icon",
    "diagram",
    "chart",
    "map",
    "character",
    "music",
    "sfx",
    "ambient_audio",
    "code_render",
  ],
  priority:50,

  canHandle(request: AssetRequest): boolean {
    if(request.capabilityId==="subtitle") return typeof request.inputs.text==="string" && request.inputs.text.trim().length>0;
    if(request.capabilityId==="chart") return chartData(request).length>0;
    if(request.capabilityId==="map"){
      const visual=request.inputs.visual as Record<string,unknown>|undefined;
      return listStrings(request.inputs.locations ?? request.inputs.labels ?? visual?.labels).length>=2;
    }
    if(request.capabilityId==="code_render") return typeof request.inputs.code==="string" && request.inputs.code.trim().length>0;
    return visualCapabilities.has(request.capabilityId)||audioCapabilities.has(request.capabilityId);
  },

  async produce(request: AssetRequest, context: AssetProviderContext): Promise<ProducedAsset> {
    await mkdir(context.outputDir,{recursive:true});
    const base=safeName(request.id);

    if(request.capabilityId==="subtitle"){
      const subtitle=subtitleAsset(request);
      const filename=base+".subtitles.json";
      await writeFile(join(context.outputDir,filename),subtitle.json);
      return {
        id:context.productionId+":"+request.id+":procedural",
        requestId:request.id,
        capabilityId:request.capabilityId,
        uri:"generated/"+context.productionId+"/"+filename,
        mediaType:"application/json",
        ...(context.sceneId?{sceneId:context.sceneId}:{}),
        metadata:{provider:"procedural",segments:subtitle.segments},
        provenance:{providerId:"procedural",source:"generated",license:"Generated in-repo; no external media source."},
      };
    }

    if(visualCapabilities.has(request.capabilityId)){
      const filename=base+".svg";
      await writeFile(join(context.outputDir,filename),buildSvg(request),"utf8");
      return {
        id:context.productionId+":"+request.id+":procedural",
        requestId:request.id,
        capabilityId:request.capabilityId,
        uri:"generated/"+context.productionId+"/"+filename,
        mediaType:"image/svg+xml",
        ...(context.sceneId?{sceneId:context.sceneId}:{}),
        metadata:{
          provider:"procedural",
          renderer:"svg",
          ...(request.capabilityId==="map"?{mapType:"schematic_route"}:{}),
        },
        provenance:{providerId:"procedural",source:"generated",license:"Generated in-repo; no external media source."},
      };
    }

    if(audioCapabilities.has(request.capabilityId)){
      const audio=proceduralAudio(request);
      const filename=base+".wav";
      await writeFile(join(context.outputDir,filename),audio.wav);
      return {
        id:context.productionId+":"+request.id+":procedural",
        requestId:request.id,
        capabilityId:request.capabilityId,
        uri:"generated/"+context.productionId+"/"+filename,
        mediaType:"audio/wav",
        ...(context.sceneId?{sceneId:context.sceneId}:{}),
        metadata:{provider:"procedural",durationSeconds:audio.durationSeconds,volume:audio.volume},
        provenance:{providerId:"procedural",source:"generated",license:"Generated in-repo; no external media source."},
      };
    }

    throw new Error("Unsupported procedural capability: "+request.capabilityId);
  },
};
