import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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

function resolveSiteUrl(basePath) {
  const explicit = process.env.SITE_URL || process.env.VITE_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const repositoryRef = process.env.GITHUB_REPOSITORY;
  if (!repositoryRef) {
    return "";
  }

  const [owner] = repositoryRef.split("/");
  if (!owner) {
    return "";
  }

  const origin = `https://${owner}.github.io`;
  return basePath === "/" ? origin : `${origin}${basePath.replace(/\/$/, "")}`;
}

const basePath = resolveBasePath();
const siteUrl = resolveSiteUrl(basePath);
const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");

const buildResult = spawnSync(process.execPath, [viteBin, "build", `--base=${basePath}`], {
  stdio: "inherit",
  env: { ...process.env, VITE_SITE_URL: process.env.VITE_SITE_URL || siteUrl },
});

if (buildResult.error) {
  console.error(buildResult.error);
  process.exit(1);
}

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const outputDir = join(process.cwd(), ".output", "public");
const legacyServerEntry = join(process.cwd(), ".output", "server", "index.mjs");
const distClientDir = join(process.cwd(), "dist", "client");
const distServerEntry = join(process.cwd(), "dist", "server", "server.js");
const serverEntry = existsSync(legacyServerEntry) ? legacyServerEntry : distServerEntry;
const indexFile = join(outputDir, "index.html");
const notFoundFile = join(outputDir, "404.html");
const noJekyllFile = join(outputDir, ".nojekyll");

if (!existsSync(serverEntry)) {
  console.error(`GitHub Pages build failed: missing ${serverEntry}`);
  process.exit(1);
}

if (existsSync(distClientDir)) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  cpSync(distClientDir, outputDir, { recursive: true });
}

const workerModule = await import(pathToFileURL(serverEntry).href);
const response = await workerModule.default.fetch(new Request(`https://example.com${basePath}`), {}, { waitUntil() {} });

if (!response.ok) {
  console.error(`GitHub Pages build failed: SSR returned status ${response.status}`);
  process.exit(1);
}

const html = await response.text();
const sitemapEntries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${siteUrl
  ? sitemapEntries
      .map(({ path, changefreq, priority }) => {
        const url = new URL(path.replace(/^\//, ""), `${siteUrl}/`).toString();
        return `  <url>\n    <loc>${url}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      })
      .join("\n")
  : ""}\n</urlset>`;

mkdirSync(outputDir, { recursive: true });
writeFileSync(indexFile, html, "utf8");
copyFileSync(indexFile, notFoundFile);
writeFileSync(join(outputDir, "sitemap.xml"), sitemapXml, "utf8");
writeFileSync(
  join(outputDir, "robots.txt"),
  `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ""}`,
  "utf8",
);
writeFileSync(noJekyllFile, "");

console.log(`GitHub Pages bundle prepared in ${outputDir} with base path ${basePath}`);
