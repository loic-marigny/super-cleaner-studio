import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

function normalizeBasePath(input) {
  if (!input || input === "/") {
    return "/";
  }

  const withLeadingSlash = input.startsWith("/") ? input : `/${input}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function resolveBasePath() {
  if (process.env.PAGES_BASE_PATH) {
    return normalizeBasePath(process.env.PAGES_BASE_PATH);
  }

  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repository || repository.endsWith(".github.io")) {
    return "/";
  }

  return `/${repository}/`;
}

const basePath = resolveBasePath();
const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");

const buildResult = spawnSync(process.execPath, [viteBin, "build", `--base=${basePath}`], {
  stdio: "inherit",
  env: process.env,
});

if (buildResult.error) {
  console.error(buildResult.error);
  process.exit(1);
}

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const outputDir = join(process.cwd(), ".output", "public");
const serverEntry = join(process.cwd(), ".output", "server", "index.mjs");
const indexFile = join(outputDir, "index.html");
const notFoundFile = join(outputDir, "404.html");
const noJekyllFile = join(outputDir, ".nojekyll");

if (!existsSync(serverEntry)) {
  console.error(`GitHub Pages build failed: missing ${serverEntry}`);
  process.exit(1);
}

const workerModule = await import(pathToFileURL(serverEntry).href);
const response = await workerModule.default.fetch(new Request(`https://example.com${basePath}`), {}, { waitUntil() {} });

if (!response.ok) {
  console.error(`GitHub Pages build failed: SSR returned status ${response.status}`);
  process.exit(1);
}

const html = await response.text();

mkdirSync(outputDir, { recursive: true });
writeFileSync(indexFile, html, "utf8");
copyFileSync(indexFile, notFoundFile);
writeFileSync(noJekyllFile, "");

console.log(`GitHub Pages bundle prepared in ${outputDir} with base path ${basePath}`);
