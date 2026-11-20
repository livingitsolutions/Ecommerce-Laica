import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localRequire = createRequire(import.meta.url);
const { chromium } = localRequire(
  process.env.TBG_PLAYWRIGHT_MODULE || "playwright",
);
const target = "http://localhost:8889";
const report = {
  note: "Pre-existing ignored artifacts only. No build executed; these do not contain Sprint 0.1 fixes and are not a source-matched release candidate.",
  bypassCSP: false,
  assets: [],
  routes: [],
  consoleErrors: [],
  pageErrors: [],
};
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") report.consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => report.pageErrors.push(e.message));
  const entry = fs.readFileSync(path.join(root, "dist/index.html"), "utf8");
  const assets = [
    "/index.html",
    ...Array.from(
      entry.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
      (m) => m[1],
    ),
  ];
  assert.equal(assets.length, 3);
  for (const asset of assets) {
    const disk = fs.readFileSync(path.join(root, "dist", asset));
    const response = await context.request.get(target + asset);
    assert.equal(response.status(), 200);
    assert.equal((await response.body()).equals(disk), true);
    report.assets.push({
      path: asset,
      bytes: disk.length,
      status: response.status(),
      contentType: response.headers()["content-type"],
      sha256: createHash("sha256").update(disk).digest("hex"),
    });
  }
  for (const route of ["/", "/catalog/example", "/products/example"]) {
    const response = await page.goto(target + route, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "Carry your style." }).waitFor();
    report.routes.push({
      path: route,
      status: response.status(),
      spaEntryMatches:
        (await (await context.request.get(target + route)).text()) === entry,
      csp: response.headers()["content-security-policy"],
    });
  }
  assert.equal(
    report.routes.every((r) => r.spaEntryMatches),
    true,
  );
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.pageErrors, []);
  report.status = "PASS";
} catch (error) {
  report.status = "FAIL";
  report.error = error.message;
  process.exitCode = 1;
} finally {
  await browser.close();
  fs.writeFileSync(
    path.join(root, "docs/qa/sprint-0.1-existing-artifacts.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify(report, null, 2));
