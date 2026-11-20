# Controlled platform-owner bootstrap

No bootstrap code, public handler, first-user rule or automatic grant is provided. The application database role must have no write grant on `platform_owners` or `seller_members` and no ability to modify or delete identity audit events. Ordinary signups may only establish customer identity and profile.

After approvals, two authorized operators verify the target using an independently confirmed provider subject, pinned issuer, verified email, active app user and enrolled MFA. Never select by email alone. Record ticket, target and reason outside public logs. Through a restricted, time-limited administrative DB role, lock/recheck the user, add the unique owner row and record a redacted identity event with target UUID and correlation UUID **in the same transaction**. Abort if evidence or audit is missing. A platform grant must not create a seller membership. Verify via a separate audited read; revoke temporary access afterward.

To remove access, delete the approved grant under the same controls and audit it atomically; revoke all local/provider sessions and test denial. Emergency suspension must deny even while a grant remains. Maintain a separately controlled recovery operator, alert on grants/removals and test break-glass recovery without manufacturing a production administrator.
