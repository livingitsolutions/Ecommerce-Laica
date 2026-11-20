# Proposed schema — NOT active

`schema.ts` is a typed, normalized design artifact only. No migration files, database client, connection, provisioning, or seed operation are included. The UI imports only fictional TypeScript fixtures. Do not connect runtime queries until the migration proposal, tenancy policies, and business rules have been reviewed.

After explicit migration authorization, configure Drizzle Kit output as `netlify/database/migrations`, generate named migrations, review SQL, and allow Netlify to apply them in its deployment lifecycle. Do not run `push` or `migrate`. See `docs/architecture/database.md` for the staged plan and remaining integrity rules.
