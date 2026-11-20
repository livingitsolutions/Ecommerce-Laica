import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import {
  addAddress,
  activeMemberships,
  customerProfile,
  addressBook,
  consumeLimit,
  provisionVerifiedCustomer,
} from "../db/identity.ts";
import {
  users,
  sellerMembers,
  customerAddresses,
  identityEvents,
} from "../db/schema.ts";
const { PGlite } = createRequire(import.meta.url)(
  process.env.TBG_PGLITE_MODULE || "@electric-sql/pglite",
);
const database = new PGlite();
const dialect = new PgDialect();
const execute = (statement) => {
  const { sql, params } = dialect.sqlToQuery(statement);
  return database.query(sql, params);
};
try {
  assert(
    getTableConfig(users).columns.find(
      (column) => column.name === "auth_subject",
    ).isUnique,
  );
  assert(
    getTableConfig(sellerMembers).uniqueConstraints.some(
      (constraint) =>
        constraint.columns.map((column) => column.name).join(",") ===
        "seller_id,user_id",
    ),
  );
  assert.equal(getTableConfig(customerAddresses).foreignKeys.length, 2);
  assert.equal(getTableConfig(identityEvents).foreignKeys.length, 3);
  await database.exec(`CREATE TABLE users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),auth_subject text UNIQUE NOT NULL,email text NOT NULL,updated_at timestamptz DEFAULT now());
    CREATE TABLE sellers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),status text NOT NULL DEFAULT 'active');
    CREATE TABLE seller_members(seller_id uuid REFERENCES sellers(id),user_id uuid REFERENCES users(id),role text CHECK(role IN ('owner','admin','catalog','fulfillment','support')),UNIQUE(seller_id,user_id));
    CREATE TABLE customer_addresses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES users(id),seller_id uuid REFERENCES sellers(id),recipient text,line1 text,line2 text,city text,region text,postal_code text,country_code text,phone text,created_at timestamptz DEFAULT now());`);
  const migration = await readFile(
    new URL("../db/review/0001_identity_access.sql", import.meta.url),
    "utf8",
  );
  assert(!/\b(DROP|TRUNCATE|DELETE|UPDATE)\b/i.test(migration));
  await database.exec(migration);
  const subject = crypto.randomUUID();
  const provision = (issuer = "gallery.test") =>
    execute(
      provisionVerifiedCustomer(issuer, subject, "sample@example.invalid"),
    );
  const userId = (await provision()).rows[0].id;
  assert.equal((await provision()).rows[0].id, userId);
  assert.equal((await provision("other.test")).rows.length, 0);
  assert.equal(
    (await database.query("SELECT * FROM customer_profiles")).rows.length,
    1,
  );
  assert.equal(
    (await database.query("SELECT * FROM platform_owners")).rows.length,
    0,
  );
  const first = (
    await database.query("INSERT INTO sellers DEFAULT VALUES RETURNING id")
  ).rows[0].id;
  const second = (
    await database.query("INSERT INTO sellers DEFAULT VALUES RETURNING id")
  ).rows[0].id;
  for (const seller of [first, second]) {
    const record = await database.query(
      "INSERT INTO seller_members(seller_id,user_id,role) VALUES($1,$2,$3) RETURNING status",
      [seller, userId, "admin"],
    );
    assert.equal(record.rows[0].status, "suspended");
  }
  await assert.rejects(
    database.query(
      "INSERT INTO seller_members(seller_id,user_id,role) VALUES($1,$2,'admin')",
      [first, userId],
    ),
  );
  await assert.rejects(
    database.query("UPDATE seller_members SET status='unknown'"),
  );
  await assert.rejects(
    database.query("INSERT INTO platform_owners(user_id) VALUES($1)", [
      crypto.randomUUID(),
    ]),
  );
  await execute(
    addAddress(userId, first, {
      recipient: "Fixture",
      line1: "Test",
      city: "Test",
      region: "Test",
      postalCode: "00000",
      countryCode: "US",
      phone: "000",
    }),
  );
  assert.equal((await execute(addressBook(userId, first))).rows.length, 1);
  assert.equal((await execute(addressBook(userId, second))).rows.length, 0);
  assert.equal(
    (await execute(addressBook(crypto.randomUUID(), first))).rows.length,
    0,
  );
  await database.query("UPDATE users SET status='suspended' WHERE id=$1", [
    userId,
  ]);
  assert.equal((await provision()).rows.length, 0);
  assert.equal(
    (await execute(customerProfile(userId, "Denied"))).rows.length,
    0,
  );
  assert.equal((await execute(addressBook(userId, first))).rows.length, 0);
  assert.equal((await execute(activeMemberships(userId))).rows.length, 0);
  const bucket = "a".repeat(64);
  for (const count of [1, 1, 0])
    assert.equal(
      (await execute(consumeLimit(bucket, 60, 2))).rows.length,
      count,
    );
  await database.exec(
    "UPDATE identity_limits SET until=now()-interval '1 minute'",
  );
  assert.equal((await execute(consumeLimit(bucket, 60, 2))).rows[0].hits, 1);
  console.log(
    "PASS: review migration, schema constraints, idempotent provisioning, issuer and tenant isolation, suspension, durable rate window. Disposable fixture only.",
  );
} finally {
  await database.close();
}
