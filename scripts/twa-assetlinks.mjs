import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_PACKAGE_NAME = "com.radiansnail.marginalia";
export const PLACEHOLDER_FINGERPRINT = "YOUR:SHA256:FINGERPRINT:HERE";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_TEMPLATE = path.join(ROOT, "public", ".well-known", "assetlinks.template.json");
const DEFAULT_OUTPUT = path.join(ROOT, "public", ".well-known", "assetlinks.json");
const DEFAULT_DEPLOY_URL = "https://marginalia-co.vercel.app/.well-known/assetlinks.json";

function usage() {
  return [
    "Usage:",
    "  npm run twa:assetlinks -- --fingerprint AA:BB:...:FF",
    "  npm run twa:verify -- --fingerprint AA:BB:...:FF [--url https://.../.well-known/assetlinks.json]",
    "",
    "The fingerprint must be the final SHA-256 signing certificate fingerprint from Bubblewrap or Play signing.",
  ].join("\n");
}

export function normalizeFingerprint(value) {
  if (typeof value !== "string") throw new Error("Missing SHA-256 fingerprint.");
  const trimmed = value.trim().toUpperCase();
  if (!trimmed || trimmed === PLACEHOLDER_FINGERPRINT) {
    throw new Error("Refusing to use a missing or placeholder SHA-256 fingerprint.");
  }

  const compact = trimmed.replace(/:/g, "");
  if (!/^[0-9A-F]{64}$/.test(compact)) {
    throw new Error("SHA-256 fingerprint must be 64 hex characters, with optional colon separators.");
  }

  return compact.match(/.{2}/g).join(":");
}

export function validatePackageName(packageName) {
  if (packageName !== EXPECTED_PACKAGE_NAME) {
    throw new Error(`Package name must be ${EXPECTED_PACKAGE_NAME}. Received ${packageName || "(empty)"}.`);
  }
}

export function buildAssetLinks(template, { fingerprint, packageName = EXPECTED_PACKAGE_NAME } = {}) {
  validatePackageName(packageName);
  const normalizedFingerprint = normalizeFingerprint(fingerprint);
  const parsed = JSON.parse(template);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Asset links template must be a non-empty JSON array.");
  }

  for (const entry of parsed) {
    if (!entry?.relation?.includes("delegate_permission/common.handle_all_urls")) {
      throw new Error("Asset links template must delegate handle_all_urls.");
    }
    if (entry?.target?.namespace !== "android_app") {
      throw new Error("Asset links template target namespace must be android_app.");
    }
    validatePackageName(entry?.target?.package_name);
    entry.target.sha256_cert_fingerprints = [normalizedFingerprint];
  }

  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export async function writeAssetLinks({
  fingerprint,
  packageName = EXPECTED_PACKAGE_NAME,
  templatePath = DEFAULT_TEMPLATE,
  outputPath = DEFAULT_OUTPUT,
} = {}) {
  const template = await fs.readFile(templatePath, "utf8");
  const body = buildAssetLinks(template, { fingerprint, packageName });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, body, "utf8");
  return { outputPath, body };
}

export function assertAssetLinksBody(body, fingerprint, packageName = EXPECTED_PACKAGE_NAME) {
  validatePackageName(packageName);
  const normalizedFingerprint = normalizeFingerprint(fingerprint);
  const parsed = JSON.parse(body);
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error("Asset links response must be a one-entry JSON array.");
  }

  const [entry] = parsed;
  if (!entry.relation?.includes("delegate_permission/common.handle_all_urls")) {
    throw new Error("Asset links response is missing handle_all_urls delegation.");
  }
  if (entry.target?.namespace !== "android_app") {
    throw new Error("Asset links response target namespace is not android_app.");
  }
  if (entry.target?.package_name !== packageName) {
    throw new Error(`Asset links package mismatch. Expected ${packageName}.`);
  }
  if (entry.target?.sha256_cert_fingerprints?.[0] !== normalizedFingerprint) {
    throw new Error("Asset links SHA-256 fingerprint mismatch.");
  }
}

export async function verifyAssetLinksUrl({
  url = DEFAULT_DEPLOY_URL,
  fingerprint,
  packageName = EXPECTED_PACKAGE_NAME,
  fetchImpl = fetch,
} = {}) {
  const res = await fetchImpl(url, { headers: { accept: "application/json" } });
  if (res.status !== 200) throw new Error(`Expected ${url} to return 200, got ${res.status}.`);

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("json")) {
    throw new Error(`Expected JSON content type from ${url}, got ${contentType || "(missing)"}.`);
  }

  const body = await res.text();
  assertAssetLinksBody(body, fingerprint, packageName);
  return { url, status: res.status, contentType };
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const fingerprint = args.fingerprint;
  const packageName = args.package ?? EXPECTED_PACKAGE_NAME;

  if (command === "generate") {
    const { outputPath } = await writeAssetLinks({
      fingerprint,
      packageName,
      templatePath: args.template ?? DEFAULT_TEMPLATE,
      outputPath: args.out ?? DEFAULT_OUTPUT,
    });
    console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
    return;
  }

  if (command === "verify") {
    const result = await verifyAssetLinksUrl({
      url: args.url ?? DEFAULT_DEPLOY_URL,
      fingerprint,
      packageName,
    });
    console.log(`Verified ${result.url}`);
    return;
  }

  throw new Error(`Unknown command: ${command || "(missing)"}\n\n${usage()}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
