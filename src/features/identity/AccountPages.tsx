import "./account.css";

const pages: Record<string, string> = {
  "/account": "Account overview",
  "/account/login": "Log in",
  "/account/register": "Create an account",
  "/account/verification": "Email verification",
  "/account/forgot": "Forgot password",
  "/account/reset": "Reset password",
  "/account/profile": "Customer profile",
  "/account/addresses": "Shipping addresses",
  "/account/logout": "Log out",
  "/seller": "Seller workspace",
};
const inputs: Record<string, readonly [string, string, string][]> = {
  "/account/login": [
    ["Email address", "email", "email"],
    ["Password", "password", "current-password"],
  ],
  "/account/register": [
    ["Email address", "email", "email"],
    ["Password", "password", "new-password"],
  ],
  "/account/forgot": [["Email address", "email", "email"]],
  "/account/reset": [["New password", "password", "new-password"]],
  "/account/profile": [["Display name", "text", "nickname"]],
  "/account/addresses": [
    ["Recipient", "text", "name"],
    ["Street address", "text", "address-line1"],
    ["Apartment or suite (optional)", "text", "address-line2"],
    ["City", "text", "address-level2"],
    ["State or region", "text", "address-level1"],
    ["Postal code", "text", "postal-code"],
    ["Country code", "text", "country"],
    ["Phone", "tel", "tel"],
  ],
};
export function SellerShell({
  state,
  membership,
}: {
  state: "denied" | "expired" | "authorized";
  membership?: { sellerId: string; role: "SELLER_STAFF" | "SELLER_ADMIN" };
}) {
  if (state !== "authorized" || !membership)
    return (
      <section>
        <h2>{state === "expired" ? "Session expired" : "Access denied"}</h2>
        <p>
          {state === "expired"
            ? "Log in again to check your membership."
            : "No verified seller membership is available."}
        </p>
        <a href="/account/login">Go to login</a>
      </section>
    );
  return (
    <section>
      <h2>Membership</h2>
      <p>
        {membership.role} · {membership.sellerId}
      </p>
      <nav aria-label="Seller operations">
        <ul>
          {["Products", "Orders", "Live selling"].map((label) => (
            <li key={label}>{label} — not available</li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
export function AccountPages({ path }: { path: string }) {
  const seller = path.startsWith("/seller");
  const title = seller ? pages["/seller"] : (pages[path] ?? "Page not found");
  return (
    <main className="account-page">
      <a className="account-back" href="/">
        ← Return to The Bag Gallery
      </a>
      <header>
        <span className="eyebrow">
          THE BAG GALLERY / {seller ? "SELLERS" : "CUSTOMERS"}
        </span>
        <h1>{title}</h1>
      </header>
      <div className="account-layout">
        <nav aria-label="Account navigation">
          {Object.entries(pages).map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={href === path ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="account-content">
          <p role="status" id="account-offline">
            Account services are not enabled. No personal details are collected.
          </p>
          {seller ? (
            <SellerShell state="denied" />
          ) : path === "/account" ? (
            <section>
              <h2>Your account</h2>
              <p>
                Your profile and saved addresses will appear here after account
                access opens. You can still browse the collection and use the
                demo bag.
              </p>
            </section>
          ) : path === "/account/verification" ? (
            <p>
              Email verification is unavailable. No verification message has
              been sent.
            </p>
          ) : path === "/account/logout" ? (
            <button disabled>Log out</button>
          ) : inputs[path] ? (
            <form
              aria-label={title}
              onSubmit={(event) => event.preventDefault()}
            >
              <fieldset disabled aria-describedby="account-offline">
                <legend>
                  {path === "/account/addresses"
                    ? "Address details"
                    : title + " details"}
                </legend>
                {inputs[path].map(([label, type, autoComplete]) => (
                  <label key={label}>
                    {label}
                    <input type={type} autoComplete={autoComplete} />
                  </label>
                ))}
                <button type="button" disabled>
                  {path === "/account/forgot"
                    ? "Request reset email"
                    : path === "/account/profile" ||
                        path === "/account/addresses"
                      ? "Save details"
                      : title}
                </button>
              </fieldset>
            </form>
          ) : (
            <p>This account page does not exist.</p>
          )}
        </div>
      </div>
    </main>
  );
}
