# Ecommerce-Laica

# The Bag Gallery

A React + Vite, strict TypeScript and Tailwind CSS v4 storefront demonstration for a product-neutral commerce platform. The existing repository title above is preserved. The initial brand uses a replaceable text lockup because no logo was present.

## Local development

Use Node 22.12+ (the project site currently uses Node 24), then `npm ci` and `npm run dev`. For Netlify emulation use `netlify dev --port 8889`. Checks: `npm run typecheck`, `npm run lint`, `npm test`. The configured production command is `npm run build`; the agent run leaves build validation to the platform. `dist` is the publish directory. No deployment is authorized by this document.

## Demonstration boundaries

All product names, prices and stock are fictional; photographs are illustrative Unsplash assets. The MDN CC0 flower clip only demonstrates video playback. The bag and saved items are temporary UI state. No checkout, persisted cart, sign-in, uploads, broadcasts, chat transport, or provider integrations are active. No credentials are required for this preview. Google Fonts and external media require network access.

`db/schema.ts` is a dormant Drizzle proposal. Sprint 1 added a review-only migration outside Netlify's discovery path, isolated identity/access contracts and disabled customer pages at `/account`. The `/seller` route displays access denied. No account provider or API runtime is connected. Read [migration review](docs/operations/migration-review.md) before considering activation.

See [architecture overview](docs/architecture/overview.md), [roadmap](docs/roadmap.md), and [Sprint 1 audit](docs/sprint-1-audit.md) for implemented scope, verification evidence and release blockers.
