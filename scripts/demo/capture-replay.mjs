// Captures the redesigned replay UI as a high-DPI screenshot and a smooth
// scroll-through GIF, using Playwright (Chromium) + ffmpeg.
//
//   node scripts/demo/capture-replay.mjs
//
// Outputs:
//   docs/assets/agentflight-replay-timeline.png   (2x, full page)
//   docs/assets/agentflight-replay-scroll.gif      (eased autoscroll)
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { writeFixtureHtml } from "./replay-fixture.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const assets = resolve(root, "docs/assets");
const framesDir = resolve(root, "output/replay-frames");
const pngPath = resolve(assets, "agentflight-replay-timeline.png");
const gifPath = resolve(assets, "agentflight-replay-scroll.gif");

const PAGE_WIDTH = 1180;
const VIEW_HEIGHT = 760;
const GIF_WIDTH = 820;
const FPS = 18;

// ease-out-quint: calm, no overshoot (matches the UI motion guidance)
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

function pad(n) {
  return String(n).padStart(4, "0");
}

async function main() {
  const htmlPath = writeFixtureHtml();
  const url = pathToFileURL(htmlPath).href;

  const browser = await chromium.launch();

  // 1) Crisp full-page screenshot at 2x.
  const shotCtx = await browser.newContext({
    viewport: { width: PAGE_WIDTH, height: VIEW_HEIGHT },
    deviceScaleFactor: 2
  });
  const shotPage = await shotCtx.newPage();
  await shotPage.goto(url, { waitUntil: "networkidle" });
  mkdirSync(assets, { recursive: true });
  await shotPage.screenshot({ path: pngPath, fullPage: true });
  await shotCtx.close();
  console.log(`screenshot -> ${pngPath}`);

  // 2) Eased scroll-through frames at 1x.
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: PAGE_WIDTH, height: VIEW_HEIGHT },
    deviceScaleFactor: 1
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const maxScroll = Math.max(0, scrollHeight - VIEW_HEIGHT);

  const holdTop = 10;
  const scrollFrames = 58;
  const holdBottom = 16;
  let frame = 0;

  const shoot = async () => {
    await page.screenshot({ path: resolve(framesDir, `f-${pad(frame++)}.png`) });
  };

  await page.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < holdTop; i++) await shoot();
  for (let i = 1; i <= scrollFrames; i++) {
    const y = Math.round(maxScroll * easeOutQuint(i / scrollFrames));
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await shoot();
  }
  for (let i = 0; i < holdBottom; i++) await shoot();

  await ctx.close();
  await browser.close();
  console.log(`captured ${frame} frames`);

  // 3) Assemble GIF with a generated palette for clean flat color.
  const filter = [
    `fps=${FPS}`,
    `scale=${GIF_WIDTH}:-1:flags=lanczos`,
    "split[a][b]",
    "[a]palettegen=max_colors=128:stats_mode=full[p]",
    "[b][p]paletteuse=dither=none"
  ].join(",");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      resolve(framesDir, "f-%04d.png"),
      "-vf",
      filter,
      "-loop",
      "0",
      gifPath
    ],
    { stdio: "inherit" }
  );
  rmSync(framesDir, { recursive: true, force: true });
  const sizeMb = (statSize(gifPath) / 1e6).toFixed(2);
  console.log(`gif -> ${gifPath} (${sizeMb} MB, from ${readdirSync(assets).length} assets dir)`);
}

function statSize(p) {
  return execFileSync("stat", ["-f", "%z", p]).toString().trim() * 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
