/* Isolated QA harness; see docs/sprint-0.1-audit.md for installation and scope. */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRequire = createRequire(path.join(root, "package.json"));
const { chromium } = repoRequire(
  process.env.TBG_PLAYWRIGHT_MODULE || "playwright",
);
const mode = process.env.TBG_QA_MODE || "source-development";
const bypassCSP = mode === "source-development";
const report = {
  mode,
  bypassCSP,
  target: "http://localhost:8889",
  viewports: [],
  browser: "",
  note: "This harness never builds or deploys. Development CSP bypass is limited to the browser context; production configuration is unchanged.",
};
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  report.browser = await browser.version();
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const mobile = viewport.width < 700;
      const context = await browser.newContext({
        viewport,
        isMobile: mobile,
        hasTouch: mobile,
        bypassCSP,
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const result = {
        viewport,
        checks: [],
        pageErrors: [],
        consoleErrors: [],
        failedRequests: [],
        httpErrors: [],
        accessibility: [],
      };
      report.viewports.push(result);
      page.on("pageerror", (e) => result.pageErrors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") result.consoleErrors.push(m.text());
      });
      page.on("requestfailed", (r) =>
        result.failedRequests.push({
          url: r.url(),
          failure: r.failure()?.errorText,
        }),
      );
      page.on("response", (r) => {
        if (r.status() >= 400)
          result.httpErrors.push({ url: r.url(), status: r.status() });
      });
      async function check(name, fn) {
        try {
          const detail = await fn();
          result.checks.push({ name, status: "PASS", detail });
        } catch (e) {
          result.checks.push({ name, status: "FAIL", error: e.message });
        }
        fs.writeFileSync(
          path.join(root, "docs/qa/sprint-0.1-browser.json"),
          JSON.stringify(report, null, 2) + "\n",
        );
        console.log(viewport.width, name, result.checks.at(-1).status);
      }
      async function axeScan(name) {
        await page.evaluate(
          fs.readFileSync(repoRequire.resolve("axe-core/axe.min.js"), "utf8"),
        );
        const a = await page.evaluate(async () => {
          const r = await window.axe.run(document, { preload: false });
          return {
            violations: r.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
            incomplete: r.incomplete.map((v) => ({
              id: v.id,
              nodes: v.nodes.length,
            })),
          };
        });
        result.accessibility.push({ name, ...a });
        assert.equal(a.violations.length, 0, JSON.stringify(a.violations));
        return a;
      }
      const dialog = () =>
        page.getByRole("dialog", { name: "Discover the piece" });
      await check("Homepage rendering and horizontal layout", async () => {
        await page.goto(report.target, { waitUntil: "networkidle" });
        await page
          .getByRole("heading", { name: "Carry your style." })
          .waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.screenshot({
          path: path.join(
            root,
            `docs/qa/${mobile ? "mobile" : "desktop"}-home.png`,
          ),
          fullPage: true,
        });
        return "Current source rendered; no document horizontal overflow";
      });
      await check("Homepage keyboard skip link", async () => {
        await page.keyboard.press("Tab");
        assert.equal(
          await page
            .getByRole("link", { name: "Skip to content" })
            .evaluate((e) => e === document.activeElement),
          true,
        );
        await page.keyboard.press("Enter");
        assert.equal(new URL(page.url()).hash, "#main");
      });
      await check("Homepage accessibility including contrast", () =>
        axeScan("homepage"),
      );
      await check(
        mobile ? "Mobile navigation" : "Desktop navigation",
        async () => {
          if (mobile) {
            const toggle = page.getByRole("button", {
              name: "Toggle navigation",
            });
            await toggle.click();
            assert.equal(await toggle.getAttribute("aria-expanded"), "true");
          }
          await page
            .getByRole("navigation")
            .getByRole("button", { name: "Shop All", exact: true })
            .click();
          await page
            .getByRole("heading", { name: "A piece of your story." })
            .waitFor();
          if (mobile)
            assert.equal(
              await page
                .getByRole("button", { name: "Toggle navigation" })
                .getAttribute("aria-expanded"),
              "false",
            );
        },
      );
      await check("Listing accessibility including contrast", () =>
        axeScan("listing"),
      );
      await check("Search and empty state", async () => {
        const search = page.getByRole("textbox", { name: "Search products" });
        await search.fill("Bluetooth");
        assert.equal(await page.locator(".product-card").count(), 1);
        await page
          .getByRole("button", { name: "View The Tempo Speaker", exact: true })
          .waitFor();
        await search.fill("no-matching-fictional-product");
        await page.getByText("No pieces found.").waitFor();
        await page
          .getByRole("button", { name: "Reset filters", exact: true })
          .click();
        assert.equal(await page.locator(".product-card").count(), 9);
      });
      await check(
        "Six categories share catalog, detail and variant gallery",
        async () => {
          const items = [
            ["Handbags", "The Arc Shoulder Bag", "arc"],
            ["Shoes", "The Sunday Loafer", "loafer"],
            ["Clothing", "The Linen Edit Shirt", "shirt"],
            ["Jewelry", "The Orbit Earrings", "earrings"],
            ["Electronics", "The Tempo Speaker", "speaker"],
            ["Home", "The Still Ceramic Vase", "vase"],
          ];
          for (const [category, name, id] of items) {
            await page
              .getByRole("button", { name: category, exact: true })
              .click();
            await page
              .getByRole("button", { name: `View ${name}`, exact: true })
              .click();
            await dialog()
              .getByRole("heading", { name, exact: true })
              .waitFor();
            assert.equal(
              await dialog().locator(".thumbnails button").count(),
              2,
            );
            await dialog()
              .getByLabel("Choose a variant")
              .selectOption(`${id}-b`);
            assert.equal(
              await dialog().locator(".thumbnails button").count(),
              3,
            );
            await dialog()
              .getByRole("button", { name: "View image 2", exact: true })
              .click();
            assert.match(
              await dialog().locator(".gallery-main > img").getAttribute("src"),
              /w=1500/,
            );
            await page.keyboard.press("Escape");
            assert.equal(await page.getByRole("dialog").count(), 0);
          }
          return "Handbags, Shoes, Clothing, Jewelry, Electronics, Home";
        },
      );
      await check(
        "Zoom, nested dialog, focus restoration and gallery keyboard",
        async () => {
          await page
            .getByRole("button", {
              name: "View The Still Ceramic Vase",
              exact: true,
            })
            .click();
          await dialog().getByLabel("Choose a variant").selectOption("vase-b");
          const next = dialog().getByRole("button", {
            name: "Next media",
            exact: true,
          });
          await next.focus();
          await page.keyboard.press("ArrowRight");
          assert.equal(
            await dialog()
              .getByRole("button", { name: "View image 2", exact: true })
              .getAttribute("aria-pressed"),
            "true",
          );
          await dialog()
            .getByRole("button", { name: "Toggle image zoom", exact: true })
            .click();
          assert.equal(
            await dialog().locator(".gallery-main > .zoomed").count(),
            1,
          );
          const full = dialog().getByRole("button", {
            name: "Open fullscreen viewer",
            exact: true,
          });
          await full.click();
          const viewer = page.getByRole("dialog", {
            name: "Product media viewer",
          });
          await viewer.waitFor();
          for (let i = 0; i < 8; i++) {
            await page.keyboard.press("Tab");
            assert.equal(
              await viewer.evaluate(
                (e) =>
                  e.matches(":modal") &&
                  (e.contains(document.activeElement) ||
                    document.activeElement === document.body),
              ),
              true,
            );
          }
          await page.keyboard.press("Escape");
          assert.equal(await viewer.count(), 0);
          assert.equal(
            await full.evaluate((e) => e === document.activeElement),
            true,
          );
        },
      );
      await check("Product dialog accessibility including contrast", () =>
        axeScan("product detail"),
      );
      await check("Native video controls and actual playback", async () => {
        await dialog()
          .getByRole("button", { name: "View video 3", exact: true })
          .click();
        const video = dialog().locator("video");
        assert.equal(await video.getAttribute("controls"), "");
        await video.evaluate(async (e) => {
          await Promise.race([
            e.play(),
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(new Error("Playback did not start within 10 seconds")),
                10000,
              ),
            ),
          ]);
        });
        await page.waitForFunction(
          () =>
            document.querySelector("dialog[open] video")?.currentTime > 0.05,
          {},
          { timeout: 15000 },
        );
        const state = await video.evaluate((e) => ({
          currentTime: e.currentTime,
          paused: e.paused,
          readyState: e.readyState,
        }));
        await video.evaluate((e) => e.pause());
        await video.focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await dialog().locator("video").count(), 1);
        return state;
      });
      await check("Demo cart cannot check out", async () => {
        await dialog()
          .getByRole("button", { name: "Add to demo bag", exact: true })
          .click();
        await page.keyboard.press("Escape");
        await page
          .getByRole("button", { name: "Open demo bag, 1 items", exact: true })
          .click();
        const cart = page.getByRole("dialog", {
          name: "Your demo bag (1)",
          exact: true,
        });
        await cart
          .getByText(
            "Demonstration bag · resets on refresh · no orders are created.",
            { exact: true },
          )
          .waitFor();
        assert.equal(
          await cart
            .getByRole("button", {
              name: "Checkout unavailable — demonstration only",
            })
            .isDisabled(),
          true,
        );
        await page.keyboard.press("Escape");
      });
      await check(
        "Offline live studio and arbitrary-category feature selection",
        async () => {
          await page
            .getByRole("navigation")
            .getByRole("button", { name: "The Gallery Live", exact: true })
            .click();
          const live = page.getByRole("dialog", {
            name: "The Gallery Live",
            exact: true,
          });
          await live
            .getByText(
              "Live studio preview · offline · no stream, chat, or purchase connection",
              { exact: true },
            )
            .waitFor();
          await live
            .getByLabel("Featured product preview")
            .selectOption("speaker");
          await live
            .getByRole("heading", { name: "The Tempo Speaker", exact: true })
            .waitFor();
          assert.equal(
            await live
              .getByRole("button", { name: "Buy now — unavailable in demo" })
              .isDisabled(),
            true,
          );
          assert.equal(
            await live.getByLabel("Chat message").isDisabled(),
            true,
          );
        },
      );
      await check("Live studio accessibility including contrast", () =>
        axeScan("live studio"),
      );
      await check("Local link targets and demo policies", async () => {
        await page.keyboard.press("Escape");
        const invalid = await page
          .locator("a[href]")
          .evaluateAll((links) =>
            links
              .map((e) => e.getAttribute("href"))
              .filter(
                (h) =>
                  h.startsWith("#") && !document.getElementById(h.slice(1)),
              ),
          );
        assert.deepEqual(invalid, []);
        await page
          .getByRole("button", { name: "Privacy & terms", exact: true })
          .click();
        await page
          .getByRole("dialog", { name: "A considered beginning", exact: true })
          .waitFor();
        await page.keyboard.press("Escape");
        return "All rendered anchor fragments resolve; policy preview opens. This is not exhaustive testing of every button.";
      });
      await check(
        "No unexpected JavaScript, console, request or HTTP errors",
        async () => {
          assert.deepEqual(result.pageErrors, []);
          assert.deepEqual(result.consoleErrors, []);
          assert.deepEqual(result.failedRequests, []);
          assert.deepEqual(result.httpErrors, []);
        },
      );
      await context.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(
      path.join(root, "docs/qa/sprint-0.1-browser.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
  }
  const failed = report.viewports.flatMap((v) =>
    v.checks
      .filter((c) => c.status === "FAIL")
      .map((c) => ({ viewport: v.viewport.width, ...c })),
  );
  console.log(
    JSON.stringify(
      {
        browser: report.browser,
        checks: report.viewports.reduce((n, v) => n + v.checks.length, 0),
        failures: failed,
      },
      null,
      2,
    ),
  );
  if (failed.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
