import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicRoot = join(root, "public");
const runtimeFiles = [
  "src/app/components/InspectionExperience.tsx",
  "src/app/inspection-data.ts",
  "src/app/styles.css",
  "src/app/bob-assets.ts",
  "src/app/components/BobRenderer.tsx",
  "src/app/components/TerritoryVisual.tsx",
];

const verifiedRuntimePaths = new Set([
  "/assets/bob/scenarios.json",
  "/assets/bob/master/bob-primary.svg",
  "/assets/bob/fallback/bob-fallback.svg",
  "/assets/territory/colina-condesa-primary.svg",
  "/assets/territory/colina-condesa-fallback.svg",
]);

function walk(directory) {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? walk(path) : [path];
    })
    .sort();
}

function toPublicFile(assetPath) {
  return join(publicRoot, assetPath.replace(/^\//, ""));
}

const publicFiles = walk(publicRoot).map((file) => relative(root, file));
const referenced = new Set();
const assetPattern = /["'`]((?:\/assets\/)[^"'`\s)]+)/g;

for (const file of runtimeFiles) {
  const source = readFileSync(join(root, file), "utf8");
  for (const match of source.matchAll(assetPattern)) {
    if (!match[1].includes("${")) referenced.add(match[1]);
  }
}

const scenarioFile = join(publicRoot, "assets/bob/scenarios.json");
const scenarioLibrary = JSON.parse(readFileSync(scenarioFile, "utf8"));
for (const scenario of Object.values(scenarioLibrary.scenarios ?? {})) {
  for (const key of ["animation", "expression", "master", "background", "audio"]) {
    const value = scenario?.[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const path = value.startsWith("/")
      ? value
      : `/assets/bob/${value.replace(/^\.?\//, "")}`;
    referenced.add(path);
  }
}
referenced.add("/assets/bob/scenarios.json");

const missing = [...referenced].filter((path) => !existsSync(toPublicFile(path)));
const unverified = [...referenced].filter((path) => !verifiedRuntimePaths.has(path));
const missingVerified = [...verifiedRuntimePaths].filter(
  (path) => !existsSync(toPublicFile(path)),
);

console.log("Available public assets:");
for (const file of publicFiles) console.log(`- ${file}`);
console.log("\nRuntime asset references:");
for (const path of [...referenced].sort()) console.log(`- ${path}`);

if (missing.length || unverified.length || missingVerified.length) {
  if (missing.length) console.error("\nMissing referenced assets:", missing);
  if (unverified.length) console.error("\nUnverified runtime paths:", unverified);
  if (missingVerified.length) console.error("\nMissing verified assets:", missingVerified);
  process.exitCode = 1;
} else {
  console.log("\nAsset audit passed: every runtime reference resolves locally.");
}
