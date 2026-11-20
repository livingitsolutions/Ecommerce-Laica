// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import axe from "axe-core";
import { AccountPages, SellerShell } from "./AccountPages";
afterEach(cleanup);
it.each(["login", "register", "forgot", "reset", "profile", "addresses"])(
  "keeps %s labeled and inert",
  (path) => {
    render(<AccountPages path={"/account/" + path} />);
    expect(
      screen.getByRole("form").querySelectorAll("input:disabled").length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button").matches(":disabled")).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("not enabled");
    expect(
      screen
        .getByRole("navigation")
        .querySelector('[aria-current="page"]')
        ?.getAttribute("href"),
    ).toBe("/account/" + path);
  },
);
it("offers navigation without fabricating account data", () => {
  render(<AccountPages path="/account" />);
  expect(
    screen
      .getByRole("link", { name: "Shipping addresses" })
      .getAttribute("href"),
  ).toBe("/account/addresses");
  expect(
    screen.getByRole("link", { name: /Return/ }).getAttribute("href"),
  ).toBe("/");
});
it("always denies deep seller routes including forged links", () => {
  render(<AccountPages path="/seller/orders" />);
  expect(screen.getByRole("heading", { name: "Access denied" })).toBeTruthy();
  expect(
    screen.queryByRole("navigation", { name: "Seller operations" }),
  ).toBeNull();
});
it("distinguishes expired sessions from authorized placeholder navigation", () => {
  const view = render(<SellerShell state="expired" />);
  expect(screen.getByRole("heading", { name: "Session expired" })).toBeTruthy();
  view.rerender(
    <SellerShell
      state="authorized"
      membership={{ sellerId: "gallery", role: "SELLER_STAFF" }}
    />,
  );
  expect(
    screen
      .getByRole("navigation", { name: "Seller operations" })
      .querySelectorAll("li"),
  ).toHaveLength(3);
});
it("has no automated structural accessibility violations on login", async () => {
  const { container } = render(<AccountPages path="/account/login" />);
  expect(
    (
      await axe.run(container, {
        rules: { "color-contrast": { enabled: false } },
      })
    ).violations,
  ).toHaveLength(0);
});
