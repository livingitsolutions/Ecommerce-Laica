# Sprint 1 release audit — November 20, 2026

**Verdict: BLOCKED for production authentication.** The approved provider-neutral scope was staged: disabled customer and seller screens, portable request and authorization logic, parameterized queries, review-only SQL, automated checks and operator runbooks. Supabase remains the sole selected provider. Conventional Netlify Functions remain the required API runtime; no alternative, second identity provider or deployment was introduced. There are no callable account or administrative APIs in this revision.

## Baseline and evidence

At initial preflight: clean `main` tracking `origin/main`, SHA `68eed1ff9988c65f323df9f07de68869247f7384`. The continuation started with the preflight audit as an untracked file. React/Vite SPA, strict TypeScript, Tailwind v4, Zod, fictional client fixtures. Scripts: `dev`, `build` (`tsc -b && vite build`), `typecheck`, `lint`, `test`, `format:check`. Netlify publishes `dist`, rewrites all routes to the SPA and supplies CSP and security headers. The baseline contained a dormant Drizzle schema but no auth implementation, DB connection, migration files or active Drizzle Kit config.

Read the Sprint 0 and 0.1 audits and architecture overview, tenancy, database, authentication and security documents. `docs/sprint-0.2-audit.md` was not present. The supplied production deployment record shows a ready, published Vite deployment for the baseline SHA. The build transcript/command exit status and historical production CSP browser results could not be independently confirmed. The supplied deployment excerpt reported **no new migrations applied in that deployment**; it is not a historical ledger. Manual screen-reader, contrast and keyboard review remains open.

A read-only Chromium smoke check loaded the production homepage (HTTP 200, gallery heading present, CSP header present, bypass disabled). It observed one enforced `script-src` violation on initial load. This is **not** a passing production CSP suite or evidence about the origin of the blocked script. Investigate with a clean browser, inspect initiator and compare with the exact release artifact; do not loosen CSP as a workaround. The staged identity UI was not deployed or tested on production.

## Files and delivery

| Area            | Created or modified                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI              | `src/App.tsx`, `src/features/storefront/Storefront.tsx`, `src/features/identity/AccountPages.tsx`, `account.css` and `AccountPages.test.tsx` in the same folder |
| Portable server | `server/identity/boundary.ts`, `contracts.ts`, `policy.ts`, `boundary.test.ts`                                                                                  |
| Database        | `db/schema.ts`, `db/identity.ts`, `db/review/0001_identity_access.sql`, `db/README.md`                                                                          |
| Quality         | `tsconfig.json`, `package.json`, `scripts/verify-identity-browser.mjs`, `scripts/verify-identity-db.mjs`                                                        |
| Architecture    | `docs/architecture/authentication.md`, `identity-access.md`, `database.md`, `tenancy.md`, `security.md`                                                         |
| Operations      | `docs/operations/supabase-auth-setup.md`, `netlify-auth-configuration.md`, `identity-bootstrap.md`, `migration-review.md`                                       |
| Release         | `README.md`, this audit and run summary                                                                                                                         |

## Access, sessions and APIs

| Authority      | Permitted                                                                          | Denied                                                  |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| CUSTOMER       | Verified active user's profile and seller-scoped address book                      | Other customers, other seller address books, admin      |
| SELLER_STAFF   | Assigned active seller shell; no business writes                                   | Unassigned/inactive sellers and management actions      |
| SELLER_ADMIN   | Assigned active seller shell; distinct role for future administrative capabilities | Platform authority, automatic onboarding, other sellers |
| PLATFORM_OWNER | Separately recorded global authority; no public platform endpoint                  | Implicit seller or customer-data access                 |

The server contract uses an injected provider and data ports. No browser ID, email, role or seller claim grants access. Suspended identities, stale memberships and unverifiable sessions deny. Role changes and owner bootstrap require a separate audited administrative transaction. No online role-management routes exist. See `docs/architecture/identity-access.md` for the legacy seller-role mapping.

Staged methods under `/api/identity/` cover registration, login, confirmation, logout, current session, verification status, recovery/reset, profile read/update, address list/add, membership list and seller-shell authorization. No runtime routes are registered. Tests exercise JSON size/shape validation, same-origin mutation checks, correlation IDs, generic errors, no-store, separate signup control, rate and audit failures. No production flag can activate the contract: only the isolated test context and reserved test origin are accepted, and provider, DB, security and adapter readiness must all pass. Stale, missing or fake adapter data is not a substitute for live provider verification.

The staged session policy uses a bounded host-only HttpOnly/Secure/Lax cookie. It distinguishes account and recovery sessions, enforces absolute expiry, requests refresh through a trusted port and rejects identity or lifetime changes after refresh. No browser tokens, localStorage or credentials are used. Actual provider validation, vault encryption and rotation, transactional refresh locking, multi-session reset invalidation and remote logout are **not implemented or verified**. Recovery email deliverability and anti-enumeration at the provider remain unverified. See `docs/architecture/authentication.md` for port obligations.

The public account pages cover login, registration, verification, forgot/reset, profile, addresses, logout and account navigation. Disabled controls do not submit. The seller URL always shows denial; expired and authorized placeholder layouts are isolated component states. No real memberships or administrative data are embedded in the frontend. The original catalog, galleries, temporary cart and offline live UI remain independent of identity.

## Data and migration decision

Reused unique external subjects, global users, two-owner address scope and unique seller/user memberships. Added issuer binding, suspension, one profile per customer, a separate platform-owner table, redacted identity audit events, durable limit buckets and scoped indexes. Verified provisioning SQL is idempotent, does not match on email, does not reactivate suspended users and never inserts privileged roles. Existing memberships default to suspended; no legacy subject or authority was backfilled.

**BLOCKED FOR DATABASE ACTIVATION.** A read-only platform migration-list request did not yield an authoritative production history; there was no direct production DB query. Only a disposable local PostgreSQL-compatible fixture ran the versioned delta. There is no deploy-discovered SQL or migration configuration. Reconcile actual schema, ledger and grants, test locks/backups/restore, then obtain separate approval. Production migration, RLS, session vault and restricted runtime grants remain outstanding.

## Environment presence

| Candidate input               | Local process | Production CLI variable inventory |
| ----------------------------- | ------------- | --------------------------------- |
| `SUPABASE_URL`                | MISSING       | MISSING                           |
| `SUPABASE_PUBLISHABLE_KEY`    | MISSING       | MISSING                           |
| `AUTH_COOKIE_SECRET`          | MISSING       | MISSING                           |
| `AUTH_ORIGIN`                 | MISSING       | MISSING                           |
| `AUTH_ENABLED`                | MISSING       | MISSING                           |
| `PUBLIC_REGISTRATION_ENABLED` | MISSING       | MISSING                           |

`NETLIFY_DATABASE_URL` (local process): MISSING. This does not test the managed database runtime binding. The CLI check returned an empty production-context variable map; these are presence checks, not validation of live function, SMTP or provider configuration. No values were displayed, supplied or changed.

## Verification

| Check                                      | Result and scope                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                        | Exit 0; strict TypeScript includes portable server, UI and DB code.                                                                                                                                                                                                                                       |
| `npm run lint`                             | Exit 0.                                                                                                                                                                                                                                                                                                   |
| `npm run format:check`                     | Exit 0.                                                                                                                                                                                                                                                                                                   |
| `npm test`                                 | 3 test files passed; 45 tests passed. Includes 23 isolated boundary/policy cases, 10 account component cases and all 12 existing storefront/domain regressions (category-neutral search, variant and media behavior, cart, live UI and accessibility).                                                    |
| `node scripts/verify-identity-db.mjs`      | Exit 0 on disposable PGlite 0.5.17 and a minimal legacy fixture. Applied the review SQL, exercised foreign-key/unique/check failures, repeat callbacks, issuer collision, suspension, multi-membership, scoped address access and the rate window. Not a production snapshot, RLS or concurrency test.    |
| `node scripts/verify-identity-browser.mjs` | Exit 0 with Playwright 1.65.1/Chromium at 360px and 1440px. Eight account detail paths per width, disabled inputs, no mutation requests, no horizontal overflow, seller denial and zero login axe violations at either width. External assets were blocked; development CSP bypass was used only locally. |
| `npm audit --json`                         | Exit 0; 0 info, low, moderate, high or critical findings for the application dependency tree. Not a code security certification.                                                                                                                                                                          |
| Sprint 1 production build                  | Not run. Build validation is reserved for the platform. No source-matched production artifact or production smoke result for these changes.                                                                                                                                                               |

For independent reproduction, install PGlite and Playwright at the versions above in an external QA directory, install Playwright Chromium, set `TBG_PGLITE_MODULE` and `TBG_PLAYWRIGHT_MODULE` to the corresponding package directories, and run the two scripts with Node 24 (native TypeScript stripping for the SQL harness). The browser check expects `netlify dev --port 8889`. Neither test needs a provider project, credentials, email or a remote DB.

## Release gates and next steps

1. Obtain the missing Sprint 0.2 evidence, investigate the observed production CSP event, complete manual accessibility review and validate the platform build on the staged source.
2. Use an environment approved for Supabase-only Auth and conventional Netlify Functions. Implement the missing adapters, secure mail confirmation landing, vault, transactional audit/revocation and independent rate buckets. Preserve the existing SPA and prove API routing precedence, including no-store denial/error responses.
3. Reconcile and rehearse DB changes as documented in `docs/operations/migration-review.md`; test active/suspended users across two sellers with the actual restricted role. Verify refresh races, recovery replay, logout failures, provider enumeration, rate thresholds and privileged bootstrap in isolation.
4. Configure a separate provider project and capture-only SMTP. Verify integration before requesting distinct approvals for production migration, deployment, controlled account smoke and public signup. No production admin/customer was created, no mail was sent, no production data or settings were changed, and no migration or deployment was issued to production.
5. Keep Sprint 2 deferred. After Sprint 1 acceptance, prioritize granular seller catalog permissions and audited product drafts before adding order or live-selling operations. No Sprint 2 work was started.
