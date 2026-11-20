BEGIN;
SET LOCAL search_path = public;
SET LOCAL lock_timeout = '3s';
ALTER TABLE users ADD COLUMN identity_issuer text,
  ADD COLUMN status text NOT NULL DEFAULT 'suspended' CONSTRAINT user_status CHECK (status IN ('active','suspended'));
ALTER TABLE seller_members ADD COLUMN status text NOT NULL DEFAULT 'suspended' CONSTRAINT membership_status CHECK (status IN ('active','suspended'));
CREATE INDEX member_lookup_idx ON seller_members(user_id,status);
CREATE INDEX address_book_idx ON customer_addresses(seller_id,user_id);
CREATE TABLE customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id), display_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE platform_owners (
  user_id uuid PRIMARY KEY REFERENCES users(id), granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL,
  action text NOT NULL, outcome text NOT NULL CONSTRAINT identity_outcome CHECK (outcome IN ('allowed','denied')),
  actor_id uuid REFERENCES users(id), target_user_id uuid REFERENCES users(id), seller_id uuid REFERENCES sellers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identity_event_request_idx ON identity_events(request_id);
CREATE TABLE identity_limits (
  bucket text PRIMARY KEY, until timestamptz NOT NULL, hits integer NOT NULL CONSTRAINT positive_hits CHECK (hits > 0)
);
CREATE INDEX identity_limits_expiry_idx ON identity_limits(until);
COMMIT;
