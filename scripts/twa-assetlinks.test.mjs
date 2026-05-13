import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  EXPECTED_PACKAGE_NAME,
  PLACEHOLDER_FINGERPRINT,
  assertAssetLinksBody,
  buildAssetLinks,
  normalizeFingerprint,
  verifyAssetLinksUrl,
  writeAssetLinks,
} from "./twa-assetlinks.mjs";

const VALID_FINGERPRINT = "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";
const TEMPLATE = JSON.stringify([
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: EXPECTED_PACKAGE_NAME,
      sha256_cert_fingerprints: [PLACEHOLDER_FINGERPRINT],
    },
  },
]);

test("normalizes valid SHA-256 certificate fingerprints", () => {
  assert.equal(normalizeFingerprint(VALID_FINGERPRINT.toLowerCase()), VALID_FINGERPRINT);
  assert.equal(normalizeFingerprint(VALID_FINGERPRINT.replaceAll(":", "")), VALID_FINGERPRINT);
});

test("rejects placeholder, empty, and malformed fingerprints", () => {
  assert.throws(() => normalizeFingerprint(PLACEHOLDER_FINGERPRINT), /placeholder/);
  assert.throws(() => normalizeFingerprint(""), /missing|placeholder/);
  assert.throws(() => normalizeFingerprint("AA:BB:CC"), /64 hex/);
  assert.throws(() => normalizeFingerprint("ZZ".repeat(32)), /64 hex/);
});

test("builds the expected Digital Asset Links JSON", () => {
  const body = buildAssetLinks(TEMPLATE, { fingerprint: VALID_FINGERPRINT });
  assertAssetLinksBody(body, VALID_FINGERPRINT);

  const parsed = JSON.parse(body);
  assert.deepEqual(parsed[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(parsed[0].target.namespace, "android_app");
  assert.equal(parsed[0].target.package_name, EXPECTED_PACKAGE_NAME);
  assert.deepEqual(parsed[0].target.sha256_cert_fingerprints, [VALID_FINGERPRINT]);
});

test("rejects wrong package names instead of generating a misleading file", () => {
  const wrongTemplate = TEMPLATE.replace(EXPECTED_PACKAGE_NAME, "com.example.wrong");
  assert.throws(() => buildAssetLinks(wrongTemplate, { fingerprint: VALID_FINGERPRINT }), /Package name/);
  assert.throws(
    () => buildAssetLinks(TEMPLATE, { fingerprint: VALID_FINGERPRINT, packageName: "com.example.wrong" }),
    /Package name/,
  );
});

test("writes generated assetlinks output to the requested path", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "marginalia-assetlinks-"));
  try {
    const templatePath = path.join(dir, "assetlinks.template.json");
    const outputPath = path.join(dir, ".well-known", "assetlinks.json");
    await import("node:fs/promises").then((fs) => fs.writeFile(templatePath, TEMPLATE, "utf8"));

    await writeAssetLinks({ fingerprint: VALID_FINGERPRINT, templatePath, outputPath });
    const body = await readFile(outputPath, "utf8");
    assertAssetLinksBody(body, VALID_FINGERPRINT);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("verifies a deployed assetlinks response shape", async () => {
  const body = buildAssetLinks(TEMPLATE, { fingerprint: VALID_FINGERPRINT });
  const result = await verifyAssetLinksUrl({
    url: "https://example.test/.well-known/assetlinks.json",
    fingerprint: VALID_FINGERPRINT,
    fetchImpl: async () => new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.url, "https://example.test/.well-known/assetlinks.json");
});

test("rejects HTML 404s and non-JSON responses during live verification", async () => {
  await assert.rejects(
    () => verifyAssetLinksUrl({
      fingerprint: VALID_FINGERPRINT,
      fetchImpl: async () => new Response("<h1>404</h1>", {
        status: 404,
        headers: { "content-type": "text/html" },
      }),
    }),
    /return 200/,
  );

  await assert.rejects(
    () => verifyAssetLinksUrl({
      fingerprint: VALID_FINGERPRINT,
      fetchImpl: async () => new Response("[]", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    }),
    /JSON content type/,
  );
});
