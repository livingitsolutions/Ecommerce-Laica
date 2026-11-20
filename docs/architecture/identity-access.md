# Access policy

| Logical role   | Authority in Netlify PostgreSQL                             | Permissions in this stage                                                                                              |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CUSTOMER       | Active verified mapped user                                 | Own global profile and own addresses within the trusted storefront. No admin access.                                   |
| SELLER_STAFF   | Active membership with catalog, fulfillment or support role | View assigned seller shell only. No writes. Future operations require finer capability checks.                         |
| SELLER_ADMIN   | Active membership with admin or seller-local owner role     | View assigned seller shell. Products, orders and live operations are placeholders, not grants.                         |
| PLATFORM_OWNER | Dedicated platform owner record plus active verified user   | Global authority predicate only; no platform endpoints. No implicit seller membership or access to customer addresses. |

Inactive sellers, suspended users/memberships, unknown roles and identity/tenant mismatches deny. Never infer an owner from registration order, email, URL, a token's app metadata or a frontend flag. Preserve multiple seller memberships; check user, seller, seller status and membership on each operation. Mutations require fresh transactional authorization and a durable audit. Browser rendering is not authorization: the only shipped seller state is denied; the isolated authorized shell takes no real data and exposes no operations.
