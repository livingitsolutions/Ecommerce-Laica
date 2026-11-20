import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TBG_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  for (const width of [360, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      bypassCSP: true,
    });
    const page = await context.newPage();
    const mutations = [];
    page.on("request", (request) => {
      if (request.method() !== "GET") mutations.push(request.method());
    });
    await page.route(/^https:\/\//, (route) => route.abort());
    for (const path of [
      "login",
      "register",
      "verification",
      "forgot",
      "reset",
      "profile",
      "addresses",
      "logout",
    ]) {
      await page.goto("http://localhost:8889/account/" + path);
      await page
        .getByRole("navigation", { name: "Account navigation" })
        .waitFor();
      assert.equal(
        await page.locator("input:enabled, form button:enabled").count(),
        0,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (path === "login") {
        await page.addScriptTag({
          path: require.resolve("axe-core/axe.min.js"),
        });
        const issues = await page.evaluate(async () =>
          (await window.axe.run()).violations.map((item) => item.id),
        );
        assert.deepEqual(issues, []);
      }
    }
    await page.getByRole("link", { name: "Seller workspace" }).click();
    await page.getByRole("heading", { name: "Access denied" }).waitFor();
    assert.deepEqual(mutations, []);
    await context.close();
    console.log(
      `PASS: ${width}px account navigation, disabled forms, no overflow or writes, seller denial and login axe scan (development CSP bypass).`,
    );
  }
} finally {
  await browser.close();
}
