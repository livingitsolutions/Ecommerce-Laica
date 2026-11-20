# Authentication boundary

No sign-up, sign-in, customer accounts or admin login is implemented. Sprint 0 collects no credentials. Future app authentication should use @netlify/identity following the then-current official integration instructions, including platform activation. Do not use deprecated identity widgets or confuse dashboard/team SSO with shopper identity. No service has been authorized in this run.

Validate tokens on the Netlify server with issuer, audience, signature, expiry and current trusted user identity. Map the provider subject to users.auth_subject; never authorize by user-supplied email or seller role. Require seller_members for every admin action and user ownership for addresses, carts and orders. Enforce verified-email policy and MFA for privileged accounts where supported. Do not expose service credentials or trust browser role assertions.

Choose secure HttpOnly, Secure, SameSite cookies and rotate sessions; add CSRF defenses for cookie-authenticated mutations and validate Origin. Define logout, password recovery, revoked-user behavior, account deletion, and guest-order access before launch. Guest carts use high-entropy capabilities stored only as hashes in the database. Rate-limit login and recovery; use generic failure responses and avoid account enumeration. These are future controls, not Sprint 0 authentication guarantees.
