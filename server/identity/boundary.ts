import { forms, type IdentityPorts, type Session } from "./contracts";
import { active, sellerRole } from "./policy";

const cookieName = "__Host-gallery";
const referencePattern = /^[A-Za-z0-9_-]{32,128}$/;
export function sessionCookie(reference: string, seconds: number) {
  if (reference && !referencePattern.test(reference))
    throw new Error("Invalid session reference");
  return `${cookieName}=${reference}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.min(28800, Math.floor(seconds)))}`;
}
function referenceFrom(request: Request) {
  const entries = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${cookieName}=`));
  const reference =
    entries.length === 1 ? entries[0].slice(cookieName.length + 1) : "";
  return referencePattern.test(reference) ? reference : null;
}
const routes: Record<string, readonly string[]> = {
  register: ["POST"],
  login: ["POST"],
  logout: ["POST"],
  session: ["GET"],
  verification: ["GET"],
  confirm: ["POST"],
  recover: ["POST"],
  reset: ["POST"],
  profile: ["GET", "PATCH"],
  addresses: ["GET", "POST"],
  memberships: ["GET"],
  "seller-admin": ["GET"],
};
export type Settings = {
  context: string;
  origin: string;
  enabled: boolean;
  providerReady: boolean;
  databaseReady: boolean;
  securityReady: boolean;
  registration: boolean;
  sellerId: string;
};
function enabled(settings: Settings) {
  return (
    settings.context === "isolated-test" &&
    settings.origin === "https://gallery.test" &&
    settings.enabled === true &&
    settings.providerReady === true &&
    settings.databaseReady === true &&
    settings.securityReady === true &&
    Boolean(settings.sellerId)
  );
}
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return {};
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 4096) {
      await reader.cancel();
      throw new Error("size");
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}
export function identityBoundary(settings: Settings, ports: IdentityPorts) {
  return async (request: Request, trustedPeer: string) => {
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const action = url.pathname.replace(/^\/api\/identity\//, "");
    function reply(status: number, data: unknown, cookie?: string) {
      return Response.json(data, {
        status,
        headers: {
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          "x-request-id": requestId,
          ...(cookie ? { "set-cookie": cookie } : {}),
        },
      });
    }
    const unavailable = () =>
      reply(503, { error: "Account services unavailable." });
    const end = async (status: number, data: unknown, cookie?: string) => {
      try {
        await ports.audit({
          requestId,
          action,
          outcome: status < 400 ? "allowed" : "denied",
        });
      } catch {
        return unavailable();
      }
      return reply(status, data, cookie);
    };
    const denied = () =>
      end(401, { error: "Authentication required." }, sessionCookie("", 0));
    const current = (session: Session | null): session is Session =>
      !!session &&
      referencePattern.test(session.reference) &&
      active(session.person) &&
      Number.isFinite(session.accessExpiry) &&
      session.absoluteExpiry > Date.now() &&
      session.absoluteExpiry <= Date.now() + 28800000;
    const issue = (session: Session | null, purpose: Session["purpose"]) =>
      current(session) &&
      session.accessExpiry > Date.now() &&
      session.purpose === purpose
        ? end(
            200,
            { authenticated: purpose === "account" },
            sessionCookie(
              session.reference,
              (session.absoluteExpiry - Date.now()) / 1000,
            ),
          )
        : denied();
    try {
      if (!enabled(settings) || !(await ports.ready())) return unavailable();
      if (
        !url.pathname.startsWith("/api/identity/") ||
        !Object.hasOwn(routes, action)
      )
        return reply(404, { error: "Not found." });
      if (!routes[action].includes(request.method))
        return reply(405, { error: "Method not allowed." });
      if (url.origin !== settings.origin || url.search)
        return end(400, { error: "Invalid request." });
      if (
        request.method !== "GET" &&
        (request.headers.get("origin") !== settings.origin ||
          request.headers.get("x-gallery-request") !== "1" ||
          request.headers.get("content-type")?.split(";")[0] !==
            "application/json")
      )
        return end(403, { error: "Request denied." });
      if (!trustedPeer || !(await ports.allow(trustedPeer, action)))
        return end(429, { error: "Please try again later." });
      let body: unknown = {};
      if (request.method !== "GET") {
        try {
          body = await readBody(request);
        } catch {
          return end(400, { error: "Invalid request." });
        }
      }
      if (action === "register" || action === "login" || action === "recover") {
        if (action === "register" && !settings.registration)
          return end(403, { error: "Registration unavailable." });
        const input = forms[action].safeParse(body);
        if (!input.success) return end(400, { error: "Invalid request." });
        const email = input.data.email.toLowerCase();
        if (!(await ports.allow(trustedPeer, action, email)))
          return end(429, { error: "Please try again later." });
        if (action === "login" || action === "register") {
          if (
            !("password" in input.data) ||
            typeof input.data.password !== "string"
          )
            return end(400, { error: "Invalid request." });
          if (action === "login")
            return await issue(
              await ports.login(email, input.data.password),
              "account",
            );
          await ports.register(email, input.data.password);
        } else await ports.recover(email);
        return await end(202, { message: "If eligible, check your email." });
      }
      if (action === "confirm") {
        const input = forms.confirm.safeParse(body);
        if (!input.success) return end(400, { error: "Invalid request." });
        return await issue(
          await ports.confirm(input.data.type, input.data.proof),
          input.data.type === "signup" ? "account" : "recovery",
        );
      }
      const reference = referenceFrom(request);
      if (action === "logout") {
        if (
          !body ||
          typeof body !== "object" ||
          Array.isArray(body) ||
          Object.keys(body).length
        )
          return end(400, { error: "Invalid request." });
        if (reference) await ports.revoke(reference);
        return await end(200, { authenticated: false }, sessionCookie("", 0));
      }
      if (!reference) return await denied();
      let session = await ports.resolve(reference);
      if (!current(session) || session.reference !== reference)
        return await denied();
      if (session.accessExpiry <= Date.now()) {
        const prior = session;
        session = await ports.refresh(reference);
        if (
          !current(session) ||
          session.accessExpiry <= Date.now() ||
          session.reference !== reference ||
          session.purpose !== prior.purpose ||
          session.person.userId !== prior.person.userId ||
          session.absoluteExpiry > prior.absoluteExpiry
        )
          return await denied();
      }
      if (action === "reset") {
        const input = forms.reset.safeParse(body);
        if (session.purpose !== "recovery") return await denied();
        if (!input.success) return end(400, { error: "Invalid request." });
        if (!(await ports.reset(reference, input.data.password)))
          return await denied();
        return await end(200, { authenticated: false }, sessionCookie("", 0));
      }
      if (session.purpose !== "account") return await denied();
      const userId = session.person.userId;
      if (action === "session" || action === "verification")
        return await end(200, { authenticated: true, verified: true });
      if (action === "profile") {
        const input = forms.profile.safeParse(body);
        if (request.method === "PATCH" && !input.success)
          return end(400, { error: "Invalid request." });
        const profile = await ports.profile(
          userId,
          request.method === "PATCH" ? input.data : undefined,
        );
        return await end(200, {
          profile: profile === null ? null : forms.profile.parse(profile),
        });
      }
      if (action === "addresses") {
        const input = forms.address.safeParse(body);
        if (request.method === "POST" && !input.success)
          return end(400, { error: "Invalid request." });
        const list = await ports.addresses(
          userId,
          settings.sellerId,
          request.method === "POST" ? input.data : undefined,
        );
        return await end(200, { addresses: forms.address.array().parse(list) });
      }
      const memberships = (await ports.memberships(userId)).flatMap(
        (member) => {
          const role = sellerRole(session.person, member.sellerId, member);
          return role ? [{ sellerId: member.sellerId, role }] : [];
        },
      );
      if (action === "memberships") return await end(200, { memberships });
      const membership = memberships.find(
        (entry) => entry.sellerId === settings.sellerId,
      );
      return membership
        ? await end(200, { membership })
        : await end(403, { error: "Access denied." });
    } catch {
      return unavailable();
    }
  };
}
