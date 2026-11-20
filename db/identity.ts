import { sql } from "drizzle-orm";
import type { Address } from "../server/identity/contracts";

export function consumeLimit(
  bucketDigest: string,
  seconds: number,
  maximum: number,
) {
  if (
    !/^[a-f0-9]{64}$/.test(bucketDigest) ||
    !Number.isSafeInteger(seconds) ||
    seconds < 1 ||
    seconds > 86400 ||
    !Number.isSafeInteger(maximum) ||
    maximum < 1 ||
    maximum > 10000
  )
    throw new Error("Invalid rate policy");
  return sql`INSERT INTO identity_limits(bucket,until,hits) VALUES (${bucketDigest},now()+${seconds} * interval '1 second',1)
    ON CONFLICT (bucket) DO UPDATE SET hits=CASE WHEN identity_limits.until<=now() THEN 1 ELSE identity_limits.hits+1 END,
    until=CASE WHEN identity_limits.until<=now() THEN excluded.until ELSE identity_limits.until END
    WHERE identity_limits.until<=now() OR identity_limits.hits<${maximum} RETURNING hits`;
}

export function addressBook(userId: string, sellerId: string) {
  return sql`SELECT recipient,line1,line2,city,region,postal_code,country_code,phone FROM customer_addresses
    WHERE user_id=${userId} AND seller_id=${sellerId} AND ${activeScope(userId, sellerId)} ORDER BY created_at DESC,id LIMIT 100`;
}
function activeScope(userId: string, sellerId: string) {
  return sql`EXISTS(SELECT 1 FROM users WHERE id=${userId} AND status='active' AND identity_issuer IS NOT NULL) AND EXISTS(SELECT 1 FROM sellers WHERE id=${sellerId} AND status='active')`;
}
export function addAddress(userId: string, sellerId: string, address: Address) {
  return sql`INSERT INTO customer_addresses(user_id,seller_id,recipient,line1,line2,city,region,postal_code,country_code,phone)
    SELECT ${userId}::uuid,${sellerId}::uuid,${address.recipient},${address.line1},${address.line2 ?? null},${address.city},${address.region},${address.postalCode},${address.countryCode},${address.phone} WHERE ${activeScope(userId, sellerId)} RETURNING id`;
}

export function activeMemberships(userId: string) {
  return sql`SELECT member.seller_id, member.user_id, member.role, member.status FROM seller_members member JOIN sellers ON sellers.id=member.seller_id JOIN users ON users.id=member.user_id WHERE member.user_id=${userId} AND member.status='active' AND sellers.status='active' AND users.status='active' AND users.identity_issuer IS NOT NULL ORDER BY member.seller_id`;
}

export function customerProfile(userId: string, displayName?: string) {
  const scope = sql`user_id=${userId} AND EXISTS(SELECT 1 FROM users WHERE id=${userId} AND status='active' AND identity_issuer IS NOT NULL)`;
  return displayName === undefined
    ? sql`SELECT display_name FROM customer_profiles WHERE ${scope}`
    : sql`UPDATE customer_profiles SET display_name=${displayName},updated_at=now() WHERE ${scope} RETURNING display_name`;
}

export function provisionVerifiedCustomer(
  issuer: string,
  subject: string,
  email: string,
) {
  return sql`WITH identity AS (
    INSERT INTO users(identity_issuer,auth_subject,email,status)
    VALUES (${issuer},${subject},${email},'active')
    ON CONFLICT (auth_subject) DO UPDATE SET email = excluded.email, updated_at = now()
    WHERE users.identity_issuer = excluded.identity_issuer AND users.status = 'active'
    RETURNING id
  ), profile AS (
    INSERT INTO customer_profiles(user_id) SELECT id FROM identity ON CONFLICT (user_id) DO NOTHING
  ) SELECT id FROM identity`;
}
