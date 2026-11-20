import type { Product } from "../catalog/model";
import { money } from "../catalog/model";
export type CartLine = {
  product: Product;
  variantId: string;
  quantity: number;
};
export function Cart({
  lines,
  onRemove,
}: {
  lines: CartLine[];
  onRemove: (index: number) => void;
}) {
  return (
    <>
      <p className="notice">
        Demonstration bag · resets on refresh · no orders are created.
      </p>
      {lines.length === 0 ? (
        <div className="empty">
          <h3>A little room for something lovely.</h3>
          <p>Explore the collection and add a sample piece.</p>
        </div>
      ) : (
        lines.map((line, i) => {
          const v = line.product.variants.find((v) => v.id === line.variantId)!;
          return (
            <div className="cart-line" key={`${v.id}-${i}`}>
              <img src={line.product.media[0].src} alt="" />
              <div>
                <h3>{line.product.name}</h3>
                <p>
                  {Object.values(v.options).join(" / ")} · Qty {line.quantity}
                </p>
                <strong>{money(v.price * line.quantity)}</strong>
              </div>
              <button onClick={() => onRemove(i)}>Remove</button>
            </div>
          );
        })
      )}
      <div className="cart-total">
        <span>Demo subtotal</span>
        <strong>
          {money(
            lines.reduce(
              (sum, l) =>
                sum +
                l.product.variants.find((v) => v.id === l.variantId)!.price *
                  l.quantity,
              0,
            ),
          )}
        </strong>
      </div>
      <p>Shipping and taxes are not calculated. Prices are fictional.</p>
      <button className="primary" disabled>
        Checkout unavailable — demonstration only
      </button>
    </>
  );
}
