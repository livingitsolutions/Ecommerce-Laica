# Ecommerce-Laica

# The Bag Gallery — Sprint 0

A React + Vite, strict TypeScript and Tailwind CSS v4 storefront demonstration for a product-neutral commerce platform. The existing repository title above is preserved. The initial brand uses a replaceable text lockup because no logo was present.

## Local development

Use Node 22.12+ (the project site currently uses Node 24), then `npm ci` and `npm run dev`. For Netlify emulation use `netlify dev --port 8889`. Checks: `npm run typecheck`, `npm run lint`, `npm test`. The configured production command is `npm run build`; the agent run leaves build validation to the platform. `dist` is the publish directory. No deployment is authorized by this document.

## Demonstration boundaries

All product names, prices and stock are fictional; photographs are illustrative Unsplash assets. The MDN CC0 flower clip only demonstrates video playback. The bag and saved items are temporary UI state. No checkout, persisted cart, sign-in, uploads, broadcasts, chat transport, or provider integrations are active. No credentials are required for this preview. Google Fonts and external media require network access.

`db/schema.ts` is a dormant Drizzle proposal. No migration or database connection is included, deliberately preventing schema activation. Read [database design](docs/architecture/database.md) before creating migration files. Runtime integrations must use Netlify infrastructure and reviewed authorization.

See [architecture overview](docs/architecture/overview.md), [roadmap](docs/roadmap.md), and [Sprint 0 audit](docs/sprint-0-audit.md) for implemented scope, checks, limitations, and release blockers. Feature folders distinguish implemented UI from documented future service boundaries. No Sprint 1 workflows are included.
