// Sprint 0 DESIGN PROPOSAL. No client imports, connections, or deployment migrations.
import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  unique,
  check,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
const id = () => uuid("id").defaultRandom().primaryKey();
const utc = (name: string) =>
  timestamp(name, { withTimezone: true }).notNull().defaultNow();
const ownership = () => ({
  id: id(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id),
  createdAt: utc("created_at"),
  updatedAt: utc("updated_at"),
});
export const users = pgTable("users", {
  id: id(),
  authSubject: text("auth_subject").notNull().unique(),
  email: text("email").notNull(),
  createdAt: utc("created_at"),
  updatedAt: utc("updated_at"),
});
export const sellers = pgTable("sellers", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: utc("created_at"),
  updatedAt: utc("updated_at"),
});
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    ...ownership(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    recipient: text("recipient").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    region: text("region").notNull(),
    postalCode: text("postal_code").notNull(),
    countryCode: text("country_code").notNull(),
    phone: text("phone").notNull(),
  },
  (t) => [unique().on(t.sellerId, t.id), index().on(t.sellerId)],
);
export const sellerMembers = pgTable(
  "seller_members",
  {
    ...ownership(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    unique().on(t.sellerId, t.userId),
    check(
      "seller_role",
      sql`${t.role} in ('owner','admin','catalog','fulfillment','support')`,
    ),
  ],
);
export const categories = pgTable(
  "categories",
  {
    ...ownership(),
    parentId: uuid("parent_id"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.parentId],
      foreignColumns: [t.sellerId, t.id],
    }),
    unique().on(t.sellerId, t.slug),
    check(
      "category_not_self_parent",
      sql`${t.parentId} is null or ${t.parentId} <> ${t.id}`,
    ),
  ],
);
export const categoryAttributes = pgTable(
  "category_attributes",
  {
    ...ownership(),
    categoryId: uuid("category_id").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    type: text("type").notNull(),
    required: boolean("required").notNull().default(false),
    filterable: boolean("filterable").notNull().default(false),
    unit: text("unit"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.categoryId],
      foreignColumns: [categories.sellerId, categories.id],
    }),
    unique().on(t.sellerId, t.categoryId, t.key),
    check(
      "attribute_type",
      sql`${t.type} in ('text','numeric','boolean','select')`,
    ),
  ],
);
export const categoryAttributeOptions = pgTable(
  "category_attribute_options",
  {
    ...ownership(),
    attributeId: uuid("attribute_id").notNull(),
    value: text("value").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.attributeId],
      foreignColumns: [categoryAttributes.sellerId, categoryAttributes.id],
    }),
    unique().on(t.sellerId, t.attributeId, t.value),
    unique().on(t.sellerId, t.id, t.attributeId),
  ],
);
export const products = pgTable(
  "products",
  {
    ...ownership(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("draft"),
    visibility: text("visibility").notNull().default("public"),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    unique().on(t.sellerId, t.slug),
    check(
      "product_status",
      sql`${t.status} in ('draft','published','archived')`,
    ),
    check(
      "product_visibility",
      sql`${t.visibility} in ('public','unlisted','private')`,
    ),
    index().on(t.sellerId, t.status, t.visibility),
  ],
);
export const productCategories = pgTable(
  "product_categories",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    categoryId: uuid("category_id").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.categoryId],
      foreignColumns: [categories.sellerId, categories.id],
    }),
    unique().on(t.sellerId, t.productId, t.categoryId),
  ],
);
export const productAttributeValues = pgTable(
  "product_attribute_values",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    attributeId: uuid("attribute_id").notNull(),
    textValue: text("text_value"),
    numberValue: numeric("number_value"),
    booleanValue: boolean("boolean_value"),
    optionId: uuid("option_id"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.attributeId],
      foreignColumns: [categoryAttributes.sellerId, categoryAttributes.id],
    }),
    unique().on(t.sellerId, t.productId, t.attributeId),
    check(
      "exactly_one_attribute_value",
      sql`num_nonnulls(${t.textValue},${t.numberValue},${t.booleanValue},${t.optionId}) = 1`,
    ),
    foreignKey({
      columns: [t.sellerId, t.optionId, t.attributeId],
      foreignColumns: [
        categoryAttributeOptions.sellerId,
        categoryAttributeOptions.id,
        categoryAttributeOptions.attributeId,
      ],
    }),
  ],
);
export const productOptionTypes = pgTable(
  "product_option_types",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    unique().on(t.sellerId, t.productId, t.name),
    unique().on(t.sellerId, t.id, t.productId),
  ],
);
export const productOptionValues = pgTable(
  "product_option_values",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    optionTypeId: uuid("option_type_id").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    unique().on(t.sellerId, t.optionTypeId, t.value),
    unique().on(t.sellerId, t.id, t.optionTypeId, t.productId),
    foreignKey({
      columns: [t.sellerId, t.optionTypeId, t.productId],
      foreignColumns: [
        productOptionTypes.sellerId,
        productOptionTypes.id,
        productOptionTypes.productId,
      ],
    }),
  ],
);
export const productVariants = pgTable(
  "product_variants",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    sku: text("sku").notNull(),
    optionSignature: text("option_signature").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: text("currency").notNull().default("PHP"),
    active: boolean("active").notNull().default(true),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    unique().on(t.sellerId, t.sku),
    unique().on(t.sellerId, t.productId, t.optionSignature),
    unique().on(t.sellerId, t.id, t.productId),
    check("variant_price", sql`${t.priceMinor} >= 0`),
    check("variant_currency", sql`length(${t.currency}) = 3`),
  ],
);
export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    optionTypeId: uuid("option_type_id").notNull(),
    optionValueId: uuid("option_value_id").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    unique().on(t.sellerId, t.variantId, t.optionTypeId),
    foreignKey({
      columns: [t.sellerId, t.variantId, t.productId],
      foreignColumns: [
        productVariants.sellerId,
        productVariants.id,
        productVariants.productId,
      ],
    }),
    foreignKey({
      columns: [t.sellerId, t.optionValueId, t.optionTypeId, t.productId],
      foreignColumns: [
        productOptionValues.sellerId,
        productOptionValues.id,
        productOptionValues.optionTypeId,
        productOptionValues.productId,
      ],
    }),
  ],
);
export const productMedia = pgTable(
  "product_media",
  {
    ...ownership(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    kind: text("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    posterKey: text("poster_key"),
    alt: text("alt").notNull(),
    position: integer("position").notNull().default(0),
    processingStatus: text("processing_status")
      .notNull()
      .default("quarantined"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    check("media_kind", sql`${t.kind} in ('image','video')`),
    unique().on(t.sellerId, t.storageKey),
    foreignKey({
      columns: [t.sellerId, t.variantId, t.productId],
      foreignColumns: [
        productVariants.sellerId,
        productVariants.id,
        productVariants.productId,
      ],
    }),
    index().on(t.sellerId, t.productId, t.position),
  ],
);
export const collections = pgTable(
  "collections",
  {
    ...ownership(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    featured: boolean("featured").notNull().default(false),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    unique().on(t.sellerId, t.slug),
  ],
);
export const collectionProducts = pgTable(
  "collection_products",
  {
    ...ownership(),
    collectionId: uuid("collection_id").notNull(),
    productId: uuid("product_id").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.collectionId],
      foreignColumns: [collections.sellerId, collections.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    unique().on(t.sellerId, t.collectionId, t.productId),
  ],
);
export const inventory = pgTable(
  "inventory",
  {
    ...ownership(),
    variantId: uuid("variant_id").notNull(),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    version: integer("version").notNull().default(0),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.variantId],
      foreignColumns: [productVariants.sellerId, productVariants.id],
    }),
    unique().on(t.sellerId, t.variantId),
    check(
      "inventory_bounds",
      sql`${t.onHand} >= 0 and ${t.reserved} >= 0 and ${t.reserved} <= ${t.onHand}`,
    ),
  ],
);
export const carts = pgTable(
  "carts",
  {
    ...ownership(),
    userId: uuid("user_id").references(() => users.id),
    guestTokenHash: text("guest_token_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("active"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    check("cart_owner", sql`num_nonnulls(${t.userId},${t.guestTokenHash}) = 1`),
  ],
);
export const cartItems = pgTable(
  "cart_items",
  {
    ...ownership(),
    cartId: uuid("cart_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.cartId],
      foreignColumns: [carts.sellerId, carts.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.variantId],
      foreignColumns: [productVariants.sellerId, productVariants.id],
    }),
    unique().on(t.sellerId, t.cartId, t.variantId),
    check("cart_quantity", sql`${t.quantity} > 0`),
  ],
);
export const orders = pgTable(
  "orders",
  {
    ...ownership(),
    userId: uuid("user_id").references(() => users.id),
    orderNumber: text("order_number").notNull(),
    checkoutKey: text("checkout_key").notNull(),
    status: text("status").notNull().default("pending"),
    currency: text("currency").notNull(),
    subtotalMinor: integer("subtotal_minor").notNull(),
    shippingMinor: integer("shipping_minor").notNull(),
    taxMinor: integer("tax_minor").notNull().default(0),
    discountMinor: integer("discount_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull(),
    shippingSnapshot: jsonb("shipping_snapshot").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    unique().on(t.sellerId, t.orderNumber),
    unique().on(t.sellerId, t.checkoutKey),
    check(
      "order_totals",
      sql`${t.subtotalMinor} >= 0 and ${t.shippingMinor} >= 0 and ${t.taxMinor} >= 0 and ${t.discountMinor} >= 0 and ${t.totalMinor} >= 0 and ${t.totalMinor} = ${t.subtotalMinor} + ${t.shippingMinor} + ${t.taxMinor} - ${t.discountMinor}`,
    ),
  ],
);
export const orderItems = pgTable(
  "order_items",
  {
    ...ownership(),
    orderId: uuid("order_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),
    nameSnapshot: text("name_snapshot").notNull(),
    optionsSnapshot: jsonb("options_snapshot").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    currency: text("currency").notNull(),
    quantity: integer("quantity").notNull(),
    totalMinor: integer("total_minor").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.orderId],
      foreignColumns: [orders.sellerId, orders.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.variantId],
      foreignColumns: [productVariants.sellerId, productVariants.id],
    }),
    check(
      "order_item_totals",
      sql`${t.quantity} > 0 and ${t.unitPriceMinor} >= 0 and ${t.totalMinor} = ${t.unitPriceMinor} * ${t.quantity}`,
    ),
  ],
);
export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    ...ownership(),
    variantId: uuid("variant_id").notNull(),
    cartId: uuid("cart_id"),
    orderId: uuid("order_id"),
    quantity: integer("quantity").notNull(),
    status: text("status").notNull().default("active"),
    idempotencyKey: text("idempotency_key").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.variantId],
      foreignColumns: [productVariants.sellerId, productVariants.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.cartId],
      foreignColumns: [carts.sellerId, carts.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.orderId],
      foreignColumns: [orders.sellerId, orders.id],
    }),
    unique().on(t.sellerId, t.idempotencyKey),
    check("reservation_quantity", sql`${t.quantity} > 0`),
    check(
      "reservation_owner",
      sql`num_nonnulls(${t.cartId},${t.orderId}) >= 1`,
    ),
    check(
      "reservation_status",
      sql`${t.status} in ('active','consumed','released','expired')`,
    ),
    index().on(t.sellerId, t.status, t.expiresAt),
  ],
);
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    ...ownership(),
    orderId: uuid("order_id").notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.orderId],
      foreignColumns: [orders.sellerId, orders.id],
    }),
  ],
);
export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    ...ownership(),
    orderId: uuid("order_id").notNull(),
    provider: text("provider").notNull(),
    method: text("method").notNull(),
    providerReference: text("provider_reference"),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.orderId],
      foreignColumns: [orders.sellerId, orders.id],
    }),
    unique().on(t.sellerId, t.idempotencyKey),
    unique().on(t.provider, t.providerReference),
    check("payment_amount", sql`${t.amountMinor} >= 0`),
  ],
);
export const paymentEvents = pgTable(
  "payment_events",
  {
    ...ownership(),
    attemptId: uuid("attempt_id").notNull(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    payloadDigest: text("payload_digest").notNull(),
    eventType: text("event_type").notNull(),
    processingStatus: text("processing_status").notNull(),
    receivedAt: utc("received_at"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.attemptId],
      foreignColumns: [paymentAttempts.sellerId, paymentAttempts.id],
    }),
    unique().on(t.provider, t.providerEventId),
  ],
);
export const shipments = pgTable(
  "shipments",
  {
    ...ownership(),
    orderId: uuid("order_id").notNull(),
    carrier: text("carrier"),
    trackingReference: text("tracking_reference"),
    status: text("status").notNull().default("pending"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.orderId],
      foreignColumns: [orders.sellerId, orders.id],
    }),
  ],
);
export const liveSessions = pgTable(
  "live_sessions",
  {
    ...ownership(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    provider: text("provider"),
    providerSessionId: text("provider_session_id"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    unique().on(t.provider, t.providerSessionId),
  ],
);
export const liveFeaturedProducts = pgTable(
  "live_featured_products",
  {
    ...ownership(),
    sessionId: uuid("session_id").notNull(),
    productId: uuid("product_id").notNull(),
    position: integer("position").notNull().default(0),
    pinned: boolean("pinned").notNull().default(false),
    revision: integer("revision").notNull().default(1),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.sessionId],
      foreignColumns: [liveSessions.sellerId, liveSessions.id],
    }),
    foreignKey({
      columns: [t.sellerId, t.productId],
      foreignColumns: [products.sellerId, products.id],
    }),
    unique().on(t.sellerId, t.sessionId, t.productId),
  ],
);
export const liveChatMessages = pgTable(
  "live_chat_messages",
  {
    ...ownership(),
    sessionId: uuid("session_id").notNull(),
    userId: uuid("user_id").references(() => users.id),
    externalMessageId: text("external_message_id"),
    source: text("source").notNull(),
    body: text("body").notNull(),
    moderationStatus: text("moderation_status").notNull().default("pending"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    foreignKey({
      columns: [t.sellerId, t.sessionId],
      foreignColumns: [liveSessions.sellerId, liveSessions.id],
    }),
    unique().on(t.sellerId, t.sessionId, t.source, t.externalMessageId),
    check("chat_length", sql`length(${t.body}) between 1 and 2000`),
    index().on(t.sellerId, t.sessionId, t.createdAt),
  ],
);
export const auditLogs = pgTable(
  "audit_logs",
  {
    ...ownership(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    requestId: text("request_id").notNull(),
    redactedMetadata: jsonb("redacted_metadata"),
  },
  (t) => [
    unique().on(t.sellerId, t.id),
    index().on(t.sellerId),
    index().on(t.sellerId, t.createdAt),
  ],
);
