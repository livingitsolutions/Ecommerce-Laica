import { ArrowUpRight } from "lucide-react";
import { photo, products } from "../catalog/sample-data";
import type { Product } from "../catalog/model";
export function Hero({
  onShop,
  onSelect,
}: {
  onShop: (category?: string) => void;
  onSelect: (product: Product) => void;
}) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">
          <span />
          THE ART OF EVERYDAY CARRY
        </p>
        <h1>
          Carry
          <br />
          your <em>style.</em>
        </h1>
        <p>
          Beautifully chosen. Effortlessly you.
          <br />
          Discover bags that belong in your story.
        </p>
        <button className="primary" onClick={() => onShop("Handbags")}>
          Explore the collection <ArrowUpRight size={18} />
        </button>
        <div className="hero-foot">
          <span className="little-line" />A LITTLE LUXURY. EVERY SINGLE DAY.
        </div>
      </div>
      <div className="hero-image">
        <img
          src={photo("photo-1548036328-c9fa89d128fa", 1600)}
          alt="Illustrative black quilted shoulder bag with a gold-tone chain"
          fetchPriority="high"
        />
        <span className="image-caption">THE NEW EVERYDAY ICONS</span>
        <div className="hero-product">
          <span>01 / THE SIGNATURE EDIT</span>
          <button onClick={() => onSelect(products[0])}>
            Meet your next favourite <ArrowUpRight size={19} />
          </button>
        </div>
        <div className="vertical-note">
          CURATED WITH INTENTION • CARRIED WITH CONFIDENCE
        </div>
      </div>
    </section>
  );
}
