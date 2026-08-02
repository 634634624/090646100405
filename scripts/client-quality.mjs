#!/usr/bin/env node
// Generated-client quality gate (emitted verbatim by the canonical UUI Site
// Factory). Four mechanical checks:
//   1. Factory-mode guard — emitted clients run in ASSEMBLY mode. Owned
//      component/toolkit sources are immutable and new client-local component
//      files are rejected. New reusable components return to the Factory's
//      separately approved COMPONENT_CREATION gate.
//   2. Library-first guard — new or modified source files must not hand-build
//      native controls (button/input/select/textarea/radio/checkbox/dialog,
//      modal/drawer/filter/product-card equivalents) when owned UUI primitives
//      exist. Files emitted by the factory are exempt via the artifact
//      manifest hash; a genuine platform exception needs a same-line
//      `uui-native-allow: <reason>` annotation.
//   3. Token/icon authority — new or modified source files must use UUI
//      semantic tokens and the PRO icon package; raw Tailwind palettes,
//      dynamic token interpolation, arbitrary hex utilities, and foreign icon
//      libraries fail.
//   4. Built-output scan — dist HTML must not contain preview/runtime error
//      markers.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NATIVE_CONTROL_PATTERNS = [
  { id: "native-button", pattern: /<\s*button\b/g },
  { id: "native-input", pattern: /<\s*input\b/g },
  { id: "native-select", pattern: /<\s*select\b/g },
  { id: "native-textarea", pattern: /<\s*textarea\b/g },
  { id: "native-dialog", pattern: /<\s*dialog\b|role\s*=\s*["']dialog["']/g },
  { id: "native-radio", pattern: /type\s*=\s*["']radio["']/g },
  { id: "native-checkbox", pattern: /type\s*=\s*["']checkbox["']/g },
  { id: "handmade-overlay", pattern: /class(?:Name)?\s*=\s*["'][^"']*\b(?:modal|drawer|product-card)\b[^"']*["']/g },
];
const ALLOW = /uui-native-allow:\s*\S/;
const COLOR_ALLOW = /uui-color-allow:\s*\S/;
const SOURCE_RULES = [
  {
    id: "raw-tailwind-palette",
    pattern: /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:gray|zinc|slate|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    allow: COLOR_ALLOW,
    message: "use a UUI semantic/utility token",
  },
  {
    id: "raw-hex-color",
    pattern: /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-\[#(?:[a-fA-F0-9]{3,8})\]/g,
    allow: COLOR_ALLOW,
    message: "use a UUI token, or annotate a required fixed-color exception with `uui-color-allow: <reason>`",
  },
  {
    id: "dynamic-tailwind-token",
    pattern: /(?:bg|text|border|ring|from|via|to|fill|stroke)-[^\s"'`]*\$\{/g,
    message: "use a static class lookup or semantic CSS variable",
  },
  {
    id: "forbidden-icon-library",
    pattern: /from\s+["'](?:lucide-react|lucide|@heroicons\/[^"']*|react-icons[^"']*|feather-icons|@tabler\/icons[^"']*|@phosphor-icons\/[^"']*|@untitledui\/icons)["']/g,
    message: "use @untitledui-pro/icons/line",
  },
];
const SOURCE_EXTENSIONS = new Set([".astro", ".tsx", ".jsx", ".ts", ".mjs", ".js"]);
const DIST_ERRORS = /Preview unavailable|TypeError:|ReferenceError:/;

const sha = (buffer) => `sha256:${createHash("sha256").update(buffer).digest("hex")}`;

function walk(directory, out = []) {
  for (const name of readdirSync(directory).sort()) {
    if (["node_modules", "dist", ".astro", ".git"].includes(name)) continue;
    const absolute = path.join(directory, name);
    if (statSync(absolute).isDirectory()) walk(absolute, out);
    else out.push(absolute);
  }
  return out;
}

export function runClientQuality(root = process.cwd()) {
  const failures = [];
  const manifestPath = path.join(root, ".uui/artifact-manifest.json");
  let manifest = null;
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (manifest.kind !== "ClientArtifactManifestV1" || !Array.isArray(manifest.files)) {
        failures.push(".uui/artifact-manifest.json has an invalid contract");
        manifest = null;
      }
    } catch {
      failures.push(".uui/artifact-manifest.json is not valid JSON");
    }
  } else failures.push(".uui/artifact-manifest.json missing — provenance is required");
  const artifactFilesByPath = new Map((manifest?.files ?? []).map((file) => [file.path, file]));
  const factoryModePath = path.join(root, ".uui/factory-mode.json");
  let factoryMode = null;
  const emittedHashByPath = new Map();
  if (existsSync(factoryModePath)) {
    try {
      const receipt = JSON.parse(readFileSync(factoryModePath, "utf8"));
      if (receipt.kind !== "FactoryModeReceiptV1" || receipt.mode !== "ASSEMBLY") {
        failures.push(".uui/factory-mode.json must declare FactoryModeReceiptV1 ASSEMBLY");
      } else {
        factoryMode = receipt.mode;
        const { receiptFingerprint, ...receiptBody } = receipt;
        if (receiptFingerprint !== sha(Buffer.from(JSON.stringify(receiptBody)))) {
          failures.push(".uui/factory-mode.json receipt fingerprint mismatch");
        }
        if (!Array.isArray(receipt.ownedSources)) {
          failures.push(".uui/factory-mode.json ownedSources must be an array");
        } else {
          const seen = new Set();
          for (const source of receipt.ownedSources) {
            const ownedPath =
              typeof source.path === "string" &&
              (source.path.startsWith("src/components/") || source.path.startsWith("toolkit/"));
            if (!ownedPath || !/^sha256:[a-f0-9]{64}$/.test(source.sha256 ?? "") || seen.has(source.path)) {
              failures.push(".uui/factory-mode.json contains invalid or duplicate owned source evidence");
              continue;
            }
            seen.add(source.path);
            const artifact = artifactFilesByPath.get(source.path);
            if (
              artifact?.kind !== "copy" ||
              artifact?.sourceRoot !== "starter" ||
              artifact?.sourcePath !== source.path ||
              artifact?.sha256 !== source.sha256
            ) {
              failures.push(`${source.path} — assembly provenance mismatch between Factory receipt and artifact manifest`);
              continue;
            }
            emittedHashByPath.set(source.path, source.sha256);
          }
          for (const artifact of manifest?.files ?? []) {
            const artifactOwned =
              artifact?.kind === "copy" &&
              artifact?.sourceRoot === "starter" &&
              typeof artifact.path === "string" &&
              (artifact.path.startsWith("src/components/") || artifact.path.startsWith("toolkit/"));
            if (artifactOwned && !seen.has(artifact.path)) {
              failures.push(`${artifact.path} — artifact manifest has unreceipted ASSEMBLY owned source`);
            }
          }
        }
      }
    } catch {
      failures.push(".uui/factory-mode.json is not valid JSON");
    }
  } else failures.push(".uui/factory-mode.json missing — ASSEMBLY provenance is required");

  const sourceRoots = ["src", "toolkit"].map((name) => path.join(root, name)).filter(existsSync);
  let scanned = 0;
  let exempt = 0;
  for (const sourceRoot of sourceRoots) {
    for (const absolute of walk(sourceRoot)) {
      if (!SOURCE_EXTENSIONS.has(path.extname(absolute))) continue;
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      const buffer = readFileSync(absolute);
      const actualHash = sha(buffer);
      const emittedHash = emittedHashByPath.get(relative);
      const assemblyOwnedSource = relative.startsWith("src/components/") || relative.startsWith("toolkit/");
      if (factoryMode === "ASSEMBLY" && assemblyOwnedSource && emittedHash !== actualHash) {
        failures.push(
          emittedHash
            ? `${relative} — assembly-owned-source-drift: configure/compose the emitted UUI source; component changes require an owner-approved Factory COMPONENT_CREATION request`
            : `${relative} — assembly-component-creation: new components are forbidden in an emitted client; return to the Factory COMPONENT_CREATION gate`,
        );
      }
      if (emittedHash === actualHash) {
        exempt += 1; // Factory-emitted owned source — UUI primitives legitimately wrap native elements internally.
        continue;
      }
      scanned += 1;
      const source = buffer.toString("utf8");
      const lines = source.split("\n");
      for (const { id, pattern, allow, message } of SOURCE_RULES) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
          const lineIndex = source.slice(0, match.index).split("\n").length - 1;
          if (allow && (allow.test(lines[lineIndex]) || (lineIndex > 0 && allow.test(lines[lineIndex - 1])))) continue;
          failures.push(`${relative}:${lineIndex + 1} — ${id}: ${message}`);
        }
      }
      for (const { id, pattern } of NATIVE_CONTROL_PATTERNS) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
          const lineIndex = source.slice(0, match.index).split("\n").length - 1;
          if (ALLOW.test(lines[lineIndex]) || (lineIndex > 0 && ALLOW.test(lines[lineIndex - 1]))) continue;
          failures.push(`${relative}:${lineIndex + 1} — ${id}: use the owned UUI primitive (or annotate a genuine platform exception with \`uui-native-allow: <reason>\`)`);
        }
      }
    }
  }

  const distRoot = path.join(root, "dist");
  let pages = 0;
  if (existsSync(distRoot)) {
    for (const absolute of walk(distRoot)) {
      if (!absolute.endsWith(".html")) continue;
      pages += 1;
      if (DIST_ERRORS.test(readFileSync(absolute, "utf8"))) failures.push(`${path.relative(root, absolute)} — built page contains a preview/runtime error marker`);
    }
  }

  return { failures, scanned, exempt, pages };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const result = runClientQuality(process.cwd());
  if (result.failures.length) {
    console.error(`client-quality FAIL — ${result.failures.length} finding(s)`);
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`client-quality PASS — ${result.exempt} emitted source(s) verified, ${result.scanned} new/changed source(s) scanned, ${result.pages} built page(s) clean`);
}
