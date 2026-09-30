import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

const id = process.argv[2];
if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) throw new Error("Usage: npm run render -- <production-id>");

const root = process.cwd();
const props = resolve(root, "productions", id, ".generated", "render-props.json");
const outputDir = resolve(root, "outputs");
const output = join(outputDir, `${id}.mp4`);
await mkdir(outputDir, { recursive: true });

const run = (command: string, args: string[]) => new Promise<void>((resolvePromise, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: "inherit", shell: false });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with code ${code}`)));
});

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
await run(npm, ["run", "prepare", "--", id]);

const remotion = resolve(root, "node_modules", ".bin", process.platform === "win32" ? "remotion.cmd" : "remotion");
await run(remotion, [
  "render",
  "renderer/remotion/index.ts",
  "Video",
  output,
  "--props",
  props,
  "--codec",
  "h264",
  "--pixel-format",
  "yuv420p"
]);

console.log(`Rendered: ${output}`);
