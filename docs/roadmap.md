# Delivery roadmap

Sprint 0 delivers a branded responsive demonstration and a typed, inactive relational proposal. Launch is single-seller and one storefront. No accounts, checkout, live broadcasting, upload or database activation occurs.

Sprint 1 recommendation, subject to separate authorization: resolve API runtime and approved auth/payment/streaming choices; review tenant/RLS and schema constraints; generate staged migrations only after approval; test isolation/concurrency on a preview database; implement seller-protected catalog/category/attribute/variant and stock administration; implement validated media quarantine/processing and a durable cart. Add CI typecheck, lint, build, browser accessibility and integration gates. Do not start payment acceptance until authoritative pricing, idempotent orders/reservations, verified webhooks and reconciliation tests pass.

Subsequent work: hosted GCash and COD workflows, shipping/service-area policy and fulfillment, refund/return ledger, audit/observability/recovery, streaming provider and moderated durable chat, then reviewed Meta integration. Multi-seller onboarding, commissions, payouts and marketplace checkout require separate business/financial design and are not Sprint 0 features.

Release gates: approved merchant policies, licensed product assets, auth and seller-isolation penetration checks, reliable upload processing, transaction race tests, webhook replay tests, browser/mobile/screen-reader review, production build validation, provider sandbox tests and explicit deployment/migration authorization. Keep all sample indicators until real authoritative services replace fixtures.
