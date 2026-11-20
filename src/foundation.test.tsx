// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import App from "./App";
import { products } from "./features/catalog/sample-data";
import { filterProducts, selectionSchema } from "./features/catalog/model";
import { ProductDetail } from "./features/catalog/ProductDetail";
import { LiveSelling } from "./features/live-selling/LiveSelling";
import { MediaGallery } from "./features/media/MediaGallery";
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => null,
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  window.scrollTo = () => {};
});
afterEach(cleanup);
describe("category-neutral commerce contracts", () => {
  it("searches unrelated categories and excludes unpublished products", () => {
    expect(
      filterProducts(products, "Bluetooth", "Electronics", 1000000).map(
        (p) => p.id,
      ),
    ).toEqual(["speaker"]);
    expect(
      filterProducts(products, "", "Clothing", 300000).map((p) => p.id),
    ).toEqual(["shirt"]);
    expect(
      filterProducts(
        [{ ...products[0], status: "draft" }],
        "",
        "All pieces",
        1000000,
      ),
    ).toEqual([]);
  });
  it("rejects fractional, missing, negative and excessive quantities", () => {
    for (const quantity of [0, -1, 1.5, 11, NaN])
      expect(
        selectionSchema.safeParse({ variantId: "x", quantity }).success,
      ).toBe(false);
    expect(
      selectionSchema.safeParse({ variantId: "", quantity: 1 }).success,
    ).toBe(false);
    expect(
      selectionSchema.safeParse({ variantId: "x", quantity: 2 }).success,
    ).toBe(true);
  });
  it("contains six categories, unique SKUs, priced variants and media", () => {
    expect(new Set(products.map((p) => p.category)).size).toBe(6);
    const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
    expect(new Set(skus).size).toBe(skus.length);
    for (const p of products) {
      expect(p.variants.length).toBeGreaterThan(1);
      expect(p.media.some((m) => m.kind === "video")).toBe(true);
      expect(
        p.variants.every((v) => Number.isInteger(v.price) && v.price > 0),
      ).toBe(true);
    }
  });
});
describe("interactive foundations", () => {
  it("selects a multidimensional shoe variant with quantity, using the shared detail component", async () => {
    let selection: unknown;
    render(
      <ProductDetail
        product={products[4]}
        onAdd={(p, v, q) => {
          selection = [p.category, v, q];
        }}
      />,
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Choose a variant"),
      "loafer-b",
    );
    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "2" },
    });
    await userEvent.click(screen.getByText("Add to demo bag"));
    expect(selection).toEqual(["Shoes", "loafer-b", 2]);
    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "4" },
    });
    expect(
      (screen.getByText("Add to demo bag") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
  it("navigates media by keyboard and displays controlled video", () => {
    const { container } = render(
      <MediaGallery media={products[0].media} variantId="arc-b" />,
    );
    fireEvent.keyDown(screen.getByLabelText("Next media"), {
      key: "ArrowRight",
    });
    expect(
      screen.getByLabelText("View image 2").getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByLabelText("View video 3"));
    expect(container.querySelector("video")?.hasAttribute("controls")).toBe(
      true,
    );
  });
  it("keeps variant-specific media out of other variants", () => {
    render(
      <MediaGallery
        media={[
          ...products[0].media,
          {
            id: "private-variant",
            kind: "image",
            src: "/sample.jpg",
            alt: "Natural finish only",
            position: 3,
            variantId: "arc-b",
          },
        ]}
        variantId="arc-a"
      />,
    );
    expect(screen.queryByLabelText("View image 4")).toBeNull();
  });
  it("filters the storefront, opens a product and adds only to the demo bag", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Shop All"));
    await userEvent.click(screen.getByRole("button", { name: "Electronics" }));
    expect(screen.getByText("The Tempo Speaker")).toBeTruthy();
    expect(screen.queryByText("The Arc Shoulder Bag")).toBeNull();
    await userEvent.click(screen.getByText("The Tempo Speaker"));
    await userEvent.click(screen.getByText("Add to demo bag"));
    expect(
      screen.getByRole("button", { name: "Open demo bag, 1 items" }),
    ).toBeTruthy();
    await userEvent.click(screen.getByLabelText("Close dialog"));
    await userEvent.click(
      screen.getByRole("button", { name: "Open demo bag, 1 items" }),
    );
    expect(
      screen.getByText("Checkout unavailable — demonstration only"),
    ).toBeTruthy();
  });
  it("supports swipe, zoom and a fullscreen dialog", async () => {
    const { container } = render(
      <MediaGallery media={products[0].media} variantId="arc-b" />,
    );
    const main = container.querySelector(".gallery-main")!;
    fireEvent.touchStart(main, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(main, { changedTouches: [{ clientX: 80 }] });
    expect(
      screen.getByLabelText("View image 2").getAttribute("aria-pressed"),
    ).toBe("true");
    await userEvent.click(screen.getByLabelText("Toggle image zoom"));
    expect(container.querySelector(".zoomed")).toBeTruthy();
    await userEvent.click(screen.getByLabelText("Open fullscreen viewer"));
    expect(
      screen.getByRole("dialog", { name: "Product media viewer" }),
    ).toBeTruthy();
    await userEvent.click(screen.getByLabelText("Close dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("features unrelated products in the offline live interface", async () => {
    render(<LiveSelling onAdd={() => {}} />);
    await userEvent.selectOptions(
      screen.getByLabelText("Featured product preview"),
      "speaker",
    );
    expect(screen.getByText("The Tempo Speaker")).toBeTruthy();
    expect(screen.getByText("Buy now — unavailable in demo")).toBeTruthy();
    expect(
      (screen.getByLabelText("Chat message") as HTMLInputElement).disabled,
    ).toBe(true);
  });
  it("has no detectable axe violations on homepage or product dialog (color contrast needs browser review)", async () => {
    render(<App />);
    const options = { rules: { "color-contrast": { enabled: false } } };
    let result = await axe.run(document.body, options);
    expect(result.violations.map((v) => v.id)).toEqual([]);
    await userEvent.click(
      screen.getByRole("button", { name: "View The Arc Shoulder Bag" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("The Arc Shoulder Bag")).toBeTruthy();
    result = await axe.run(dialog, options);
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
