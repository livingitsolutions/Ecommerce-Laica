# Sprint 0.1 — foundation acceptance and build verification

Audit date: 2026-11-20 UTC. **Overall verdict: BLOCKED by the production-build gate.** Current-source automated and browser checks passed within the scopes below. No production deployment, migrations, database connection, accounts, real orders, payments, provider authorization or broadcasts occurred. Sprint 1 was not started.

## A. Executive summary

Reviewed the Sprint 0 audit, all architecture documents, source components, proposed schema, package manifest/lockfile and Netlify configuration. Executed the permitted quality checks and installed an isolated Chromium automation harness outside application dependencies. Browser verification reproduced and corrected insufficient text contrast, an accessible-name mismatch, nested-dialog Escape propagation and interception of native video arrow shortcuts. Added meaningful regression tests and explicit semantic groups for category/media navigation. Corrected the hero image's inaccurate color description.

All 12 domain/component tests and 30 browser checks passed on the final source. Eight real-browser axe scans included color contrast, with zero reported violations; contrast that axe could not determine remains manual work. The production build was **not executed** because this managed session prohibits agent-issued build commands and delegates build validation to the platform. Existing ignored output files were inspected and smoke-tested separately; these are not a source-matched release candidate and cannot establish a successful build. Sprint 0 therefore cannot receive PASS.

## B. Repository baseline and commit SHA

| Item            | Observed baseline                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch          | `main`, tracking `origin/main`, ahead by one commit                                                                                                                        |
| Commit          | `2e54ee84e0dd554695526aac49b227d435aaa1aa`                                                                                                                                 |
| Working tree    | Clean at preflight: `git status --short` returned no changes                                                                                                               |
| Branch evidence | `git status --porcelain=v1 --branch` returned `## main...origin/main [ahead 1]`                                                                                            |
| Commit evidence | `git rev-parse HEAD` returned the SHA above                                                                                                                                |
| Git limitation  | `git branch --show-current` and `git symbolic-ref --short HEAD` were refused by the environment's Git command wrapper; branch was obtained through supported status output |
| Application     | React/Vite, strict TypeScript, Tailwind v4, Zod; client-only sample data                                                                                                   |
| Lockfile        | Version 3; production and development dependency declarations both matched the manifest                                                                                    |
| Runtime         | Node v22.23.5 in this session; existing static application permits Node >=22.12                                                                                            |
| Existing output | Ignored `dist/index.html`, one hashed CSS file and one hashed JS file existed at preflight; ignored TypeScript build metadata also existed                                 |

Existing work, lockfile, schema, Netlify configuration and Sprint 0 audit were preserved. No Git commits or pull requests were created. Existing output was not regenerated or edited. Its original build logs, command exit status, and source provenance were not available. Outstanding Sprint 0 acceptance blockers were the production build and browser validation; this run improved browser evidence but cannot close the production-artifact gate.

## C. Production build command and exact result

| Field                                | Result                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Supported command                    | `npm run build`                                                                                                                            |
| Manifest expansion                   | `tsc -b && vite build`                                                                                                                     |
| Execution                            | **NOT EXECUTED — BLOCKED**                                                                                                                 |
| Exit code                            | N/A; no process was started                                                                                                                |
| Build stdout/stderr, warnings/errors | N/A; no build output was generated or available for this revision                                                                          |
| Exact reason                         | Managed-session execution policy prohibits all agent-issued build commands; the platform performs automatic build validation after changes |
| Configured publish directory         | `dist`                                                                                                                                     |
| Static source entry                  | Root `index.html` imports `/src/main.tsx`                                                                                                  |
| Vite base configuration              | Default root base; existing output references root-absolute `/assets/…` URLs                                                               |

Required external action: run `npm run build` against the final reviewed source in the platform's automatic validation or another authorized CI environment. Preserve the exact revision, command, full stdout/stderr, warnings and exit status. An explicit deployment is not required or authorized. After a successful build, inspect the new `dist` and rerun browser/CSP checks against those new assets. A build failure must be fixed before acceptance; no success is inferred from typechecking or file presence.

### Existing-artifact verification, separate from build acceptance

Executed `TBG_PLAYWRIGHT_MODULE=/tmp/tbg-qa/node_modules/playwright node scripts/verify-existing-artifacts.mjs` against local Netlify static emulation. Exit **0**. No CSP bypass was used. Results and SHA-256 identities are in [the artifact evidence](qa/sprint-0.1-existing-artifacts.json).

| Existing asset               |  Bytes | Local HTTP result                            |
| ---------------------------- | -----: | -------------------------------------------- |
| `/index.html`                |    650 | 200, HTML; response bytes matched disk       |
| `/assets/index-Bg357qIu.js`  | 338193 | 200, JavaScript; response bytes matched disk |
| `/assets/index-jCky8RX9.css` |  26395 | 200, CSS; response bytes matched disk        |

Local `/`, `/catalog/example` and `/products/example` returned 200 with the same SPA entry. Chromium rendered the homepage at each route under the configured production CSP with zero console/page errors. The fallback returns the homepage shell; these paths are not implemented product/category deep links. Netlify's configured `/* → /index.html` status-200 rule was exercised locally. This is not validation of a live deployment or the final source build. These old assets still contain the pre-fix accessibility behavior.

## D. Automated test results

Final executed results after application fixes:

| Command                                                                                     | Exit | Exact result                                                                                   |
| ------------------------------------------------------------------------------------------- | ---: | ---------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                                                         |    0 | Strict TypeScript passed, including application, tests and dormant schema                      |
| `npm run lint`                                                                              |    0 | No ESLint errors or warnings                                                                   |
| `npm run format:check`                                                                      |    0 | All matched files passed Prettier; coverage now includes QA scripts                            |
| `npm test`                                                                                  |    0 | One test file, **12 passed, 0 failed, 0 skipped**; final application run reported 1.45 seconds |
| `npm audit --json`                                                                          |    0 | **0 info, 0 low, 0 moderate, 0 high, 0 critical**; reported dependency total 394               |
| `TBG_PLAYWRIGHT_MODULE=/tmp/tbg-qa/node_modules/playwright node scripts/verify-browser.mjs` |    0 | **30 passed, 0 failed**; Chromium 159.0.8154.6, two viewports                                  |
| Existing-artifact command in section C                                                      |    0 | Three assets and three SPA routes passed local checks without CSP bypass                       |

The two added component regressions verify that cancellation closes only the topmost nested modal, and video arrow keys do not switch gallery media. Existing tests cover invalid quantities, category-neutral filtering, SKU/fixture integrity, variants, gallery interaction, sample cart and offline live UI. JSDOM accessibility tests still exclude contrast and mock native dialog methods; browser results are separate evidence, not an expansion of those tests' capabilities.

Earlier checks failed and were corrected: real-browser contrast/name checks, nested modal cancellation, and ESLint's CommonJS import rule on the first QA harness version. The harness was converted to ESM. An initial focus assertion was also corrected to allow Chromium's browser-chrome boundary, which reports `body` as active while the native modal remains open; underlying page controls did not receive focus. Intermediate failures and dependent timeouts are not reported as final passes.

Warnings during local Netlify/Vite startup included `NO_COLOR` being ignored because `FORCE_COLOR` was set and Netlify CLI's deprecated `util._extend` use. The first startup could not auto-open a browser in the container; subsequent commands used `--no-open`, and headless Chromium ran successfully. These were not build warnings. Existing Drizzle beta/ESLint maintenance notices from Sprint 0 were not resolved by a package upgrade; no application dependencies were changed or reinstalled.

Not executed: production build, PostgreSQL/RLS/concurrency tests, provider sandbox tests, physical mobile devices, Firefox/WebKit/Safari, screen readers, exhaustive control/link enumeration, or production deployment checks. None are marked passed.

## E. Browser/mobile verification matrix

Chromium **159.0.8154.6** through an isolated Playwright install. Desktop: **1440 × 1000**. Mobile emulation: **390 × 844**, touch-capable context. Both final source runs used Netlify development on port 8889. Screenshots were inspected for representative composition and overflow: [desktop](qa/desktop-home.png), [mobile](qa/mobile-home.png). Machine-readable evidence is [sprint-0.1-browser.json](qa/sprint-0.1-browser.json).

**Important boundary:** the unmodified production CSP blocks Vite React's inline development preamble. The first normal development run therefore failed to render. The source harness explicitly uses Playwright `bypassCSP: true` only for its development browser context. No CSP header was weakened, no application setting was changed to bypass CSP, and the old static artifact was separately tested without bypass. Consequently source functionality passes do not prove CSP compatibility of a new production build. The development tooling/CSP incompatibility remains documented, not silently treated as resolved.

| Executed check                              | Desktop | Mobile | Evidence/limit                                                                                                  |
| ------------------------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Homepage render and horizontal overflow     | PASS    | PASS   | Heading rendered; document width did not exceed viewport                                                        |
| Keyboard skip link                          | PASS    | PASS   | Tab reached link; Enter reached `#main`                                                                         |
| Homepage axe, contrast enabled              | PASS    | PASS   | Zero violations; manual contrast items remain                                                                   |
| Desktop/mobile navigation                   | PASS    | PASS   | Shop All opened listing; mobile expanded state toggled and closed                                               |
| Listing axe, contrast enabled               | PASS    | PASS   | Zero violations; manual contrast items remain                                                                   |
| Search and empty/reset state                | PASS    | PASS   | Bluetooth found speaker; unmatched query empty; reset restored nine products                                    |
| Six category catalog/details/gallery        | PASS    | PASS   | All six opened shared details; variant switch changed thumbnails from 2 to 3; alternate image URL selected      |
| Zoom, fullscreen dialog, keyboard and focus | PASS    | PASS   | Arrow navigation, zoom class, native modal Tab isolation, Escape preserved parent and restored invoking control |
| Product-detail axe, contrast enabled        | PASS    | PASS   | Zero violations; one incomplete contrast node per viewport                                                      |
| Video controls and actual playback          | PASS    | PASS   | Controlled video played and currentTime advanced; paused afterward; arrow key retained video                    |
| Demo cart labeling/disabled checkout        | PASS    | PASS   | Added sample UI line; no-order notice present; checkout disabled                                                |
| Offline live studio and unrelated category  | PASS    | PASS   | Offline label, electronics feature selection, disabled chat and Buy Now                                         |
| Live-studio axe, contrast enabled           | PASS    | PASS   | Zero violations and no incomplete checks in this view                                                           |
| Local anchor targets/policy preview         | PASS    | PASS   | Rendered fragment targets existed; policy dialog opened; not exhaustive button testing                          |
| Console/page/network errors                 | PASS    | PASS   | Zero page errors, console errors, failed requests or HTTP >=400 responses in final observed flows               |

The mobile runs are browser emulation, not real-device certification. Synthetic unit tests additionally cover swipe gestures; native physical-device swipe was not tested. No stream playback was attempted: the live player is deliberately offline, while product video used the labeled generic flower clip.

### Reproduction without modifying application dependencies

Install QA tooling separately: `npm install --prefix /tmp/tbg-qa --no-save playwright`, then `/tmp/tbg-qa/node_modules/.bin/playwright install chromium`. Start `netlify dev --port 8889 --no-open` and execute the source harness command in section D. The harness requires the repository's installed axe-core. Browser installation did not alter package-lock.json.

For pre-existing static artifacts, stop the dev server by its specific PID and start `netlify dev --port 8889 --dir dist --framework '#static' --no-open`, then run the artifact harness. After an authorized fresh build, run the full browser harness with `TBG_QA_MODE=production` in addition to the Playwright module setting against static emulation; that disables the development CSP bypass. It writes new evidence, so archive the prior report first. No harness invokes a build, migration, deployment or commerce endpoint.

## F. Accessibility findings

Corrected six muted text colors: hero description/footer note, product categories, sample notice, footer metadata and chat sample labels. Baseline browser contrast ratios included 4.33, 3.69, 3.99, 4.35, 3.91 and 4.23 where at least 4.5 was required. Removed the brand's overriding aria-label so its accessible name derives from all visible brand text. Labeled category/media containers now have explicit group semantics. Fixed native nested-dialog cancel propagation and preserved native video keyboard controls. Corrected the hero image's black-versus-burgundy alt description.

Final browser axe scans reported **zero violations across eight scans** with contrast enabled. Axe still could not decide contrast for 19 homepage nodes at each viewport, 9 desktop/10 mobile listing nodes, and one detail node at each viewport; live-studio scans had no incomplete checks. These incomplete results include content on imagery/complex backgrounds and require a manual contrast review rather than a claim of full compliance. The code remains usable with native focus handling; screen-reader announcements, 200%/400% zoom, physical touch targets and cross-browser dialog behavior were not certified. Some editorial labels are very small; readable-size review remains advisable. This is **PARTIAL accessibility acceptance**, not a WCAG conformance statement.

## G. Product-agnostic architecture assessment

**PASS for the exercised demonstration.** The same catalog, ProductDetail and MediaGallery supported Handbags, Shoes, Clothing, Jewelry, Electronics and Home in both browser viewports. No bag-shaped fields or category-specific branching were found in the reusable gallery/detail/domain validation models or dormant schema. Shoes/clothing conditions exist only in fixture construction to supply different option dimensions. Branding and the phrase demo bag refer to the shopping container, not a restriction on product types.

The frontend Product type is a simplified read projection with one category string and a generic specification record; the normalized proposal supports multiple category assignments and typed attributes. Future API DTOs must map that distinction explicitly. APIs do not exist yet, so there is no API behavior to execute or certify. Active-variant minimum-price sorting, multi-currency handling, pagination, visibility enforcement and dynamic attribute facets remain future runtime work. The sample price formatter shows whole PHP pesos; fractional minor-unit display must be addressed before real prices require it.

## H. Database design findings

**PARTIAL — static design review only.** Reviewed all **31** table definitions. There are 29 seller-owned business tables plus global users and sellers. Business ownership is defined through the shared non-null seller FK, unique `(seller_id,id)` keys and seller indexes; 33 composite seller relationship FKs are declared. The proposal was typechecked, not applied or validated against PostgreSQL. No database resource was created or queried.

| Area                  | Existing proposal                                                                                 | Remaining weakness before activation                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seller relationships  | Composite keys prevent cross-seller relational references; global user references are intentional | No SELECT isolation/RLS or member/customer authorization; actor membership is not established by a user FK                                                                        |
| Foreign keys          | Products, options, media, inventory, carts, orders, payments and live relationships are declared  | PostgreSQL DDL validity, deletion behavior and performance still need generated-SQL/database tests                                                                                |
| Variant options/media | Composite product/variant/dimension keys keep associations within product and seller              | Complete option coverage, canonical signatures and media readiness/ownership need transactional validation                                                                        |
| Variant inventory     | One row per variant; nonnegative counts and reserved <= on_hand                                   | Aggregate reserved count is not automatically tied to active reservations; no executed atomic reserve/release/consume or reconciliation proof                                     |
| Category attributes   | Typed definitions, choices and exactly-one-value check                                            | Cross-table type compatibility, category applicability, inherited requirements, and recursive category-cycle prevention are incomplete                                            |
| Historical orders     | Item name/SKU/options/price/currency and shipping address snapshots                               | JSON shape/immutability, total reconciliation across items and currency compatibility are not database-enforced; archive referenced variants                                      |
| Payment identities    | Unique provider event IDs, provider references, checkout/attempt/reservation idempotency keys     | State transitions and webhook verification unimplemented; event.provider can differ from attempt.provider; provider account/environment scoping needs review for multi-seller use |
| Webhook inbox         | Payment event must reference an existing attempt                                                  | No unlinked/quarantine inbox for an early or unknown verified event; define reconciliation before accepting webhooks                                                              |
| Reservations/checkout | Positive quantities, status check, expiry and documented lock ordering                            | No proof cart and order references belong to the same checkout/customer; expiry validity, intent replay comparison, race handling and deadlock retry tests absent                 |
| Audit/history         | Owned audit and status-history tables                                                             | Append-only privileges/immutable snapshots and updated_at maintenance are not implemented                                                                                         |

Most operational status columns are free text without transition enforcement. Variants only check currency length, not ISO validity; order/payment currencies can disagree. Integer minor units require strict overflow/maximum-total validation. A durable canonical request digest or equivalent intent-comparison design is needed when an idempotency key is reused with a different payload. Refund ledger, shipment-item allocation and inventory adjustment ledger remain known future extensions. These are findings for reviewed design/activation work, not production defects in a currently connected service. The schema was left unchanged and dormant.

## I. Security findings

A limited credential-pattern scan inspected 43 source/schema/documentation/manifest files and flagged zero files. It checked representative private-key, cloud/GitHub/payment credential and credentialed PostgreSQL URI patterns without printing matched values. No environment values, credential files or Git internals were read. No tracked credential-like filenames or client runtime secret references were found in the additional targeted checks. This is not a complete history/entropy secret scan or a guarantee that all possible credential formats are absent.

Static inspection found no client fetch/WebSocket/XMLHttpRequest calls, database imports, external provider SDK integration or raw HTML injection. Executed browser flows confirmed checkout/Buy Now/chat remained disabled and sample cart actions only changed UI state. No backend is present to create orders or broadcasts. A live feature selector changes fictional products; its seller controls are descriptive, with no start-stream action. No production write was attempted.

External requests remain Google Fonts, Unsplash images and the MDN CC0 sample video. They succeeded in observed final browser flows, but availability is external. Photography is not an accurate merchandise feed, and some assets visibly contain third-party luxury trademarks. Asset copyright/license provenance, trademark use, merchant product rights, final alt descriptions and production-hosting rights require approval or replacement before commercial launch. The flower clip is labeled generic and does not prove product quality. Self-host approved fonts/media where appropriate; loading external resources exposes normal connection metadata to those hosts.

Production CSP and other security headers were observed locally on old static output, not on a new build or a deployed response. Production CSP was preserved. The source development browser bypass was explicitly recorded and does not certify production protections. Authentication, authorization, RLS, upload processing, rate limiting, payment signature/idempotency enforcement, CSRF and runtime audit logging remain planned. No production security approval was granted.

## J. Netlify runtime recommendation

**PARTIAL readiness; recommendation only, no runtime change.** Verified the following public official documentation over HTTPS on 2026-11-20; each cited page returned HTTP 200. Unlike the earlier audit, this review explicitly accounts for Netlify Server's Early Access restrictions. Platform capabilities were verified from documentation, not by deploying or invoking a backend.

| Workload                        | Recommendation                                            | Boundary                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated commerce APIs     | Netlify Server, conditional on approved availability/plan | Shared authentication, trusted seller context and validated services; runtime authorization required                                                                                                                |
| Checkout/inventory transactions | Same Server service with Netlify Database/Drizzle         | Short database transactions and deterministic row locking; no in-memory inventory; separate external provider calls with idempotent orchestration                                                                   |
| Payment webhooks                | Server route sharing payment/reservation services         | Raw-body signature verification, durable inbox/event uniqueness, fast acknowledgement; standalone Functions are also officially supported for webhooks and are an architectural alternative, not an unsupported API |
| Long background tasks           | Netlify Background Functions                              | Up to 15 minutes, immediate 202, retries; durable job identities and idempotent handlers; do not store results only in memory                                                                                       |
| Scheduled reservation cleanup   | Netlify Scheduled Function with bounded database batches  | 30-second scheduled execution limit, UTC schedule; published deploys only for automatic scheduling; preview testing requires explicit/manual invocation                                                             |
| Live-selling control APIs       | Server with verified seller capabilities                  | Normal durable application state; WebSockets/SSE supported for control synchronization, not a substitute for video streaming infrastructure                                                                         |

Sources: [Server overview and Early Access](https://docs.netlify.com/build/server/), [Server configuration/routing and Node requirements](https://docs.netlify.com/build/server/configuration/), [Server limits](https://docs.netlify.com/build/server/limits/), [Server lifecycle](https://docs.netlify.com/build/server/lifecycle/), [Functions overview](https://docs.netlify.com/build/functions/overview/), [Background Functions](https://docs.netlify.com/build/functions/background-functions/), [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/).

Server requires Node **24+**, while this execution environment is Node 22. Its Early Access availability depends on credit-based plan eligibility (or Enterprise with credits); this project's entitlement was not established from the supplied plan label. Early Access is intended for evaluation and low-volume production, with APIs/behavior subject to change. Obtain an explicit runtime decision before committing commerce workloads to it; do not interpret a recommendation as authorization to add a server. If unavailable, resolve the approved supported runtime strategy rather than silently changing architecture.

Documented Server limits include scale-to-zero after five idle minutes, at most three instances on applicable paid plans, 20 seconds to response status/headers, and up to 90 seconds for in-flight/background work when shutting down. WebSocket connections can be terminated and need reconnect/backfill. Process memory is per-instance and disposable, so authoritative stock/chat/order state belongs in Netlify Database; media belongs in object/streaming storage. A durable cross-instance fanout strategy remains necessary for real-time synchronization.

The current catch-all SPA rewrite runs before a future Server and would swallow API requests; routing must be redesigned and tested with an explicitly scoped frontend fallback when backend implementation is authorized. Vite is a client SPA, so it does not require a full-stack framework adapter. Functions remain supported for standalone requests/webhooks, background jobs, schedules and platform events; their support is not confused with a requirement to migrate this application now. No server/function entrypoint, Node-version change, provider connection or routing migration was implemented.

## K. Files modified

Modified existing files:

- `package.json`: extended formatting coverage to QA scripts; dependencies unchanged.
- `src/features/storefront/Storefront.tsx`: visible-name-derived brand button and category filter group semantics.
- `src/features/storefront/Hero.tsx`: corrected illustrative image alt description.
- `src/features/media/MediaGallery.tsx`: preserved native video keys and labeled media group semantics.
- `src/shared/Modal.tsx`: isolated nested cancel handling and retained explicit controlled closure.
- `src/styles.css`: corrected six muted text colors for measured contrast.
- `src/foundation.test.tsx`: added two regression tests.
- The run changes summary was updated.

Created `scripts/verify-browser.mjs`, `scripts/verify-existing-artifacts.mjs`, this audit, `docs/qa/sprint-0.1-browser.json`, `docs/qa/sprint-0.1-existing-artifacts.json`, `docs/qa/desktop-home.png`, and `docs/qa/mobile-home.png`. Package lockfile, database schema and Netlify configuration were unchanged. No unrelated pre-existing working-tree changes were present or overwritten.

## L. Remaining blockers

1. **BLOCKED — required production-build gate:** authorized platform/CI execution of `npm run build` at the final source revision with exit code and full logs is still required. The existing dist is not the current source output.
2. **PARTIAL — release artifact/browser gate:** rerun the full desktop/mobile browser suite against that newly built output with production CSP enforced, not the development bypass. Current source functionality and old-artifact CSP checks cannot be combined into a claim of final-artifact acceptance.
3. **PARTIAL — accessibility:** resolve axe-incomplete contrast checks and perform manual keyboard/screen-reader/zoom and physical-device review as required for release confidence. Current automation is not full WCAG certification.
4. The ordinary Netlify/Vite development path conflicts with production CSP's inline-script restriction. The QA bypass is explicit and isolated; normal development remains affected. A reviewed development-only configuration may be introduced separately without weakening production policy.

Runtime eligibility, database/RLS/transaction gaps, provider integrations, asset rights and final operational policies are future commerce activation gates. They were documented, not implemented as Sprint 1 work in this acceptance sprint.

## M. Sprint 0 acceptance recommendation

**BLOCKED — do not award PASS.** The foundation is reviewable, source/browser quality improved, and all executed final automated checks passed within their documented scopes. The required production build did not execute and final production assets were not browser-tested. Preserve the Sprint 0 historical audit; use this audit as the current verification record. Close the blocked gates with recorded evidence before changing acceptance to PASS. No production deployment is authorized by this report.

## N. Sprint 1 readiness verdict

**BLOCKED for the acceptance-based handoff.** Sprint 0 build acceptance remains incomplete. Architectural planning is available, but it is not a readiness approval. After acceptance gates succeed, obtain the separate requested scope/authorization, confirm runtime eligibility and review security/database findings before beginning Sprint 1. No Sprint 1 services or workflows were implemented.
