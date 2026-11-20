import { describe, expect, it, vi } from "vitest";
import { identityBoundary, sessionCookie, type Settings } from "./boundary";
import type { IdentityPorts, Session } from "./contracts";
import {
  customerAccess,
  platformAccess,
  sellerRole,
  type Membership,
} from "./policy";
const origin = "https://gallery.test";
const reference = crypto.randomUUID();
const password = crypto.randomUUID();
const email = "sample@example.invalid";
const settings: Settings = {
  context: "isolated-test",
  origin,
  enabled: true,
  providerReady: true,
  databaseReady: true,
  securityReady: true,
  registration: false,
  sellerId: "gallery",
};
function setup(overrides: Partial<Settings> = {}) {
  const person: Session["person"] = {
    userId: "customer",
    status: "active",
    verified: true,
    platformOwner: false,
  };
  const session: Session = {
    reference,
    person,
    absoluteExpiry: Date.now() + 3600000,
    accessExpiry: Date.now() + 60000,
    purpose: "account",
  };
  const member: Membership = {
    sellerId: "gallery",
    userId: "customer",
    sellerActive: true,
    status: "active",
    role: "catalog",
  };
  const ports = {
    ready: vi.fn(async () => true),
    allow: vi.fn(async () => true),
    audit: vi.fn(async () => {}),
    register: vi.fn(async () => {}),
    recover: vi.fn(async () => {}),
    login: vi.fn<IdentityPorts["login"]>(async () => session),
    confirm: vi.fn<IdentityPorts["confirm"]>(async () => session),
    resolve: vi.fn<IdentityPorts["resolve"]>(async () => session),
    refresh: vi.fn<IdentityPorts["refresh"]>(async () => null),
    revoke: vi.fn(async () => {}),
    reset: vi.fn(async () => true),
    profile: vi.fn(async () => null),
    addresses: vi.fn(async () => []),
    memberships: vi.fn(async () => [member]),
  } satisfies IdentityPorts;
  const handle = identityBoundary({ ...settings, ...overrides }, ports);
  const call = (
    action: string,
    method = "GET",
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    handle(
      new Request(origin + "/api/identity/" + action, {
        method,
        headers: {
          origin,
          "x-gallery-request": "1",
          "content-type": "application/json",
          cookie: `__Host-gallery=${reference}`,
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      "trusted-peer",
    );
  return { person, ports, session, member, call };
}
describe("portable, isolated identity boundary", () => {
  it.each([
    { context: "production" },
    { context: "deploy-preview" },
    { enabled: false },
    { providerReady: false },
    { databaseReady: false },
    { securityReady: false },
    { origin: "" },
    { sellerId: "" },
  ])("fails closed with %o", async (settings) => {
    const { call, ports } = setup(settings);
    const response = await call("session");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(ports.resolve).not.toHaveBeenCalled();
  });
  it("denies a failed readiness probe or rate limiter outage", async () => {
    const { ports, call } = setup();
    ports.ready.mockResolvedValueOnce(false);
    expect((await call("session")).status).toBe(503);
    ports.allow.mockRejectedValueOnce(Error());
    expect((await call("session")).status).toBe(503);
  });
  it("keeps registration separate and rejects privilege fields", async () => {
    expect(
      (await setup().call("register", "POST", { email, password })).status,
    ).toBe(403);
    const { call, ports } = setup({ registration: true });
    expect(
      (
        await call("register", "POST", {
          email,
          password,
          role: "PLATFORM_OWNER",
        })
      ).status,
    ).toBe(400);
    expect((await call("register", "POST", { email, password })).status).toBe(
      202,
    );
    expect(ports.register).toHaveBeenCalledOnce();
    expect((await call("bootstrap", "POST", {})).status).toBe(404);
  });
  it("validates recovery and rate-limits before contacting provider", async () => {
    const { call, ports } = setup();
    expect((await call("recover", "POST", { email: "invalid" })).status).toBe(
      400,
    );
    ports.allow.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await call("recover", "POST", { email })).status).toBe(429);
    expect(ports.recover).not.toHaveBeenCalled();
    expect((await call("recover", "POST", { email })).status).toBe(202);
  });
  it("returns the same denial for invalid credentials, unverified and suspended users", async () => {
    const { call, ports, person } = setup();
    ports.login.mockResolvedValueOnce(null);
    for (const state of ["invalid", "unverified", "suspended"]) {
      person.status = state === "suspended" ? "suspended" : "active";
      person.verified = state !== "unverified";
      const response = await call("login", "POST", { email, password });
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Authentication required.",
      });
    }
  });
  it("issues a bounded HttpOnly cookie, no JSON tokens, and redacted audit data", async () => {
    const { call, ports } = setup();
    const response = await call("login", "POST", { email, password });
    expect(await response.json()).toEqual({ authenticated: true });
    expect(response.headers.get("set-cookie")).toMatch(
      /__Host-gallery=.*; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=\d+/,
    );
    expect(sessionCookie(reference, 999999)).toContain("Max-Age=28800");
    expect(ports.audit).toHaveBeenCalledWith({
      action: "login",
      outcome: "allowed",
      requestId: response.headers.get("x-request-id"),
    });
  });
  it.each([
    ["origin", "https://untrusted.invalid"],
    ["x-gallery-request", ""],
    ["content-type", "text/plain"],
  ])("rejects CSRF %s", async (name, value) => {
    const { call, ports } = setup();
    expect((await call("logout", "POST", {}, { [name]: value })).status).toBe(
      403,
    );
    expect(ports.revoke).not.toHaveBeenCalled();
  });
  it("revokes before clearing the cookie and refuses replay of a revoked session", async () => {
    const { ports, call } = setup();
    const response = await call("logout", "POST", {});
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(ports.revoke).toHaveBeenCalledWith(reference);
    ports.resolve.mockResolvedValueOnce(null);
    expect((await call("profile")).status).toBe(401);
  });
  it("never refreshes an expired absolute session", async () => {
    const { call, ports, session } = setup();
    session.absoluteExpiry = Date.now() - 1;
    expect((await call("session")).status).toBe(401);
    expect(ports.refresh).not.toHaveBeenCalled();
  });
  it("requires revalidation after refresh and rejects subject or expiry changes", async () => {
    const { call, session, ports } = setup();
    session.accessExpiry = 0;
    const renewed = { ...session, accessExpiry: Date.now() + 60000 };
    ports.refresh
      .mockResolvedValueOnce(renewed)
      .mockResolvedValueOnce({
        ...renewed,
        absoluteExpiry: renewed.absoluteExpiry + 1000,
      })
      .mockResolvedValueOnce({
        ...renewed,
        person: { ...renewed.person, userId: "other" },
      });
    for (const status of [200, 401, 401, 401])
      expect((await call("session")).status).toBe(status);
  });
  it("isolates recovery sessions from ordinary account sessions", async () => {
    const { call, ports, session } = setup();
    expect((await call("reset", "POST", { password })).status).toBe(401);
    session.purpose = "recovery";
    expect((await call("profile")).status).toBe(401);
    expect(
      (await call("confirm", "POST", { type: "signup", proof: reference }))
        .status,
    ).toBe(401);
    expect(
      (await call("confirm", "POST", { type: "recovery", proof: reference }))
        .status,
    ).toBe(200);
    expect((await call("reset", "POST", { password })).status).toBe(200);
    expect(ports.reset).toHaveBeenCalledWith(reference, password);
  });
  it("scopes customer data to verified user and trusted storefront", async () => {
    const { call, ports, person } = setup();
    expect(
      (
        await call("profile", "PATCH", {
          displayName: "Customer",
          userId: "other",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("addresses", "GET", undefined, {
          "x-user-id": "other",
          "x-seller-id": "other",
        })
      ).status,
    ).toBe(200);
    expect(ports.addresses).toHaveBeenCalledWith(
      "customer",
      "gallery",
      undefined,
    );
    expect(customerAccess(person, "other", "gallery", "gallery")).toBe(false);
    expect(customerAccess(person, "customer", "gallery", "other")).toBe(false);
  });
  it("rejects absent, forged, unscoped or suspended authority", async () => {
    const { call, ports, member, person } = setup();
    for (const invalid of [
      { sellerId: "other" },
      { role: "PLATFORM_OWNER" },
      { userId: "other" },
      { status: "suspended" as const },
      { sellerActive: false },
    ]) {
      ports.memberships.mockResolvedValueOnce([{ ...member, ...invalid }]);
      expect(
        (
          await call("seller-admin", "GET", undefined, {
            "x-role": "PLATFORM_OWNER",
          })
        ).status,
      ).toBe(403);
    }
    expect(sellerRole(person, "gallery", null)).toBeNull();
    expect(platformAccess(person)).toBe(false);
    for (const [role, result] of [
      ["catalog", "SELLER_STAFF"],
      ["admin", "SELLER_ADMIN"],
      ["owner", "SELLER_ADMIN"],
    ])
      expect(sellerRole(person, "gallery", { ...member, role })).toBe(result);
    person.platformOwner = true;
    expect(platformAccess(person)).toBe(true);
    expect(sellerRole(person, "gallery", null)).toBeNull();
    person.status = "suspended";
    expect(platformAccess(person)).toBe(false);
  });
  it("fails closed on oversize data, repeated cookies, missing audit sink and wrong method", async () => {
    const { call, ports } = setup();
    expect(
      (await call("recover", "POST", { email: "x".repeat(5000) })).status,
    ).toBe(400);
    expect(
      (
        await call("session", "GET", undefined, {
          cookie: `__Host-gallery=${reference}; __Host-gallery=${reference}`,
        })
      ).status,
    ).toBe(401);
    ports.audit.mockRejectedValueOnce(Error());
    expect((await call("session")).status).toBe(503);
    expect((await call("logout")).status).toBe(405);
  });
});
