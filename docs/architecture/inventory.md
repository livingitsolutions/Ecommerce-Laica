# Inventory and reservations

Inventory belongs to a purchasable variant and seller, one row per variant at launch. on_hand counts physical units, reserved counts committed temporary holds, and available = on_hand − reserved. Database checks prevent negative values and reserved above on_hand. A future multi-location stock model can extend allocation without changing product categories.

Planned reservation transaction: validate trusted seller/variant, lock affected inventory rows in deterministic UUID order, look up the unique reservation idempotency key, then atomically update reserved only where on_hand − reserved ≥ requested quantity. Insert reservation and create the pending order in the same transaction. If any SKU fails, roll back the entire operation. Do not read availability then blindly decrement. Retry serialization/deadlock failures with bounded backoff. Cart previews alone never reserve stock.

Expiration uses a scheduled Netlify Function and transactional row locks (SKIP LOCKED for batches). Transition active → expired once, decrement reserved in the same transaction. Payment success locks reservation/order, confirms active ownership and amount, transitions active → consumed once, and decrements both on_hand and reserved. Cancellation releases once. Late successful payment after expiry must enter reconciliation/refund flow rather than oversell. COD confirmation follows a reviewed hold/commit policy and delivery refusal restock policy. Keep append-only inventory adjustments and actor audit records in Sprint 1 (a dedicated adjustment ledger is a planned schema extension).

No reservations, scheduled jobs or stock writes run in Sprint 0. Concurrency and expiration tests against PostgreSQL are launch blockers, not claimed passes.
