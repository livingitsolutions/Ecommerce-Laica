# Dormant PostgreSQL model

`schema.ts` describes the catalog and staged identity model. `identity.ts` constructs parameterized SQL; it opens no connections. The delta under `review/` is not an automatically discovered migration. Do not push the model, seed live users, or move the SQL into a deploy path. See `docs/operations/migration-review.md` for reconciliation and recovery requirements.
