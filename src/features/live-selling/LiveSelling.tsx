import { useState } from "react";
import { Play, Radio, Send } from "lucide-react";
import { products } from "../catalog/sample-data";
import { ProductDetail } from "../catalog/ProductDetail";
import type { Product } from "../catalog/model";
export function LiveSelling({
  onAdd,
}: {
  onAdd: (p: Product, v: string, q: number) => void;
}) {
  const [selected, setSelected] = useState(products[0].id);
  return (
    <div className="live-demo">
      <p className="notice">
        Live studio preview · offline · no stream, chat, or purchase connection
      </p>
      <div className="live-grid">
        <div>
          <div className="stream-placeholder">
            <Radio />
            <span>THE GALLERY LIVE</span>
            <Play size={42} />
            <h3>A closer look. A personal touch.</h3>
            <p>Streaming provider integration planned.</p>
            <span className="pill">OFFLINE DEMO</span>
          </div>
          <div className="chat">
            <h3>In the conversation</h3>
            <p>
              <strong>
                Gallery host <small>SAMPLE</small>
              </strong>
              <br />
              Welcome to a closer look at our latest edit.
            </p>
            <p>
              <strong>
                Guest preview <small>SAMPLE</small>
              </strong>
              <br />
              Could we see the different finishes?
            </p>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                aria-label="Chat message"
                placeholder="Chat is unavailable in this preview"
                disabled
              />
              <button disabled aria-label="Send message">
                <Send size={18} />
              </button>
            </form>
            <small>Real-time messaging and moderation are not connected.</small>
          </div>
          <details>
            <summary>Seller controls — planned</summary>
            <p>
              Start / end stream, pin product, moderate chat, and inspect
              reservations. These controls require authorized seller membership
              and provider integration.
            </p>
          </details>
        </div>
        <div>
          <label>
            Featured product preview
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.category} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <ProductDetail
            key={selected}
            product={products.find((p) => p.id === selected)!}
            onAdd={onAdd}
          />
        </div>
      </div>
    </div>
  );
}
