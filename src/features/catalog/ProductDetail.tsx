import { useState } from "react";
import type { Product } from "./model";
import { money, selectionSchema } from "./model";
import { MediaGallery } from "../media/MediaGallery";
export function ProductDetail({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, v: string, q: number) => void;
}) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId)!;
  return (
    <div className="detail-grid">
      <MediaGallery media={product.media} variantId={variantId} />
      <div className="detail-info">
        <p className="eyebrow">{product.category} / FICTIONAL SAMPLE</p>
        <h2>{product.name}</h2>
        <p className="detail-price">{money(variant.price)}</p>
        <p>{product.description}</p>
        <label>
          Choose a variant
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {Object.entries(v.options)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(" / ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantity
          <input
            type="number"
            min="1"
            max={Math.min(10, variant.stock)}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <button
          className="primary"
          disabled={
            !selectionSchema.safeParse({ variantId, quantity }).success ||
            quantity > variant.stock
          }
          onClick={() => onAdd(product, variantId, quantity)}
        >
          Add to demo bag
        </button>
        <button className="outline" disabled>
          Buy now — unavailable in demo
        </button>
        <small>
          Sample stock: {variant.stock} · SKU {variant.sku}
          <br />
          No checkout or stock reservation takes place.
        </small>
        <details>
          <summary>Details & specifications</summary>
          <dl>
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
        </details>
        <details>
          <summary>Delivery & returns</summary>
          <p>
            Shipping rates, service areas, and return policies are pending
            merchant approval. This demonstration accepts no orders.
          </p>
        </details>
      </div>
    </div>
  );
}
