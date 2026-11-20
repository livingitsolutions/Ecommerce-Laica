import { Hero } from "./Hero";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  ShoppingBag,
  Menu,
  X,
  Heart,
  Radio,
  Truck,
  ShieldCheck,
  PackageCheck,
  Instagram,
  Play,
} from "lucide-react";
import { categories, photo, products } from "../catalog/sample-data";
import { filterProducts, money, type Product } from "../catalog/model";
import { ProductDetail } from "../catalog/ProductDetail";
import { Modal } from "../../shared/Modal";
import { Cart, type CartLine } from "../cart/Cart";
import { LiveSelling } from "../live-selling/LiveSelling";
export default function Storefront() {
  const [page, setPage] = useState<"home" | "shop">("home");
  const [category, setCategory] = useState("All pieces");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [sort, setSort] = useState("curated");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [overlay, setOverlay] = useState<"cart" | "live" | "about" | null>(
    null,
  );
  const [menu, setMenu] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlySaved, setOnlySaved] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const list = useMemo(() => {
    const found = filterProducts(products, query, category, maxPrice).filter(
      (p) => !onlySaved || favorites.includes(p.id),
    );
    return sort === "low"
      ? [...found].sort((a, b) => a.variants[0].price - b.variants[0].price)
      : sort === "high"
        ? [...found].sort((a, b) => b.variants[0].price - a.variants[0].price)
        : found;
  }, [query, category, maxPrice, sort, onlySaved, favorites]);
  const shop = (cat = "All pieces") => {
    setCategory(cat);
    setPage("shop");
    setMenu(false);
    setOnlySaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const add = (product: Product, variantId: string, quantity: number) => {
    setCart((c) => [...c, { product, variantId, quantity }]);
    setAnnouncement(`${product.name} added to demo bag.`);
  };
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div
        className="announcement"
        role="region"
        aria-label="Store announcement"
      >
        <span>CONSIDERED PIECES. EVERYDAY POSSIBILITIES.</span>
        <span>THE GALLERY EDIT — VOL. 01</span>
      </div>
      <header>
        <div className="header-top">
          <button
            className="mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <button
            className="brand"
            onClick={() => {
              setPage("home");
              setOnlySaved(false);
            }}
          >
            <span className="brand-mark">BG</span>
            <span>
              THE BAG GALLERY<small>PREMIUM BAG COLLECTIONS</small>
            </span>
          </button>
          <div className="header-note">
            Objects of desire.
            <br />
            <em>Made for your everyday.</em>
          </div>
          <div className="header-actions">
            <button
              aria-label="Search products"
              onClick={() => {
                shop();
                setTimeout(() => document.getElementById("search")?.focus(), 0);
              }}
            >
              <Search />
            </button>
            <button
              aria-label="View saved pieces"
              onClick={() => {
                setPage("shop");
                setOnlySaved(true);
              }}
            >
              <Heart />
              {favorites.length > 0 && <span>{favorites.length}</span>}
            </button>
            <button
              className="bag-button"
              aria-label={`Open demo bag, ${cart.length} items`}
              onClick={() => setOverlay("cart")}
            >
              <ShoppingBag />
              <span>{cart.length}</span>
            </button>
          </div>
        </div>
        <nav
          className={menu ? "navigation open" : "navigation"}
          aria-label="Main navigation"
        >
          <div>
            <button
              className={page === "home" ? "active" : ""}
              onClick={() => {
                setPage("home");
                setMenu(false);
              }}
            >
              The Gallery
            </button>
            <button onClick={() => shop()}>Shop All</button>
            <button onClick={() => shop("Handbags")}>Bags & Totes</button>
            <button onClick={() => shop("Jewelry")}>Accessories</button>
            <button onClick={() => shop("Home")}>Lifestyle</button>
            <button onClick={() => setOverlay("about")}>Our Story</button>
          </div>
          <button className="live-link" onClick={() => setOverlay("live")}>
            <span className="live-dot" />
            The Gallery Live
            <ArrowUpRight size={14} />
          </button>
        </nav>
      </header>
      <main id="main">
        {page === "home" ? (
          <>
            <Hero onShop={shop} onSelect={setSelected} />
            <div className="trust-strip">
              <span>
                <PackageCheck />
                Thoughtfully curated
              </span>
              <span>
                <ShieldCheck />
                Quality in every detail
              </span>
              <span>
                <Truck />
                Made for everyday journeys
              </span>
              <span className="trust-last">
                THE BAG GALLERY <i>✧</i> CARRY YOUR STYLE
              </span>
            </div>
            <section className="section collections">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A WORLD OF POSSIBILITIES</p>
                  <h2>
                    Find your kind of <em>beautiful.</em>
                  </h2>
                </div>
                <button className="text-link" onClick={() => shop()}>
                  Explore all collections <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="collection-grid">
                <button
                  className="collection-card large"
                  onClick={() => shop("Handbags")}
                >
                  <img
                    src={photo("photo-1584917865442-de89df76afd3", 1000)}
                    loading="lazy"
                    alt="Structured bag in a quiet editorial setting"
                  />
                  <div>
                    <span>THE SIGNATURE COLLECTION</span>
                    <h3>Bags with character.</h3>
                    <p>
                      From first light to late nights. <ArrowUpRight />
                    </p>
                  </div>
                </button>
                <button
                  className="collection-card"
                  onClick={() => shop("Jewelry")}
                >
                  <img
                    src={photo("photo-1617038220319-276d3cfab638", 800)}
                    loading="lazy"
                    alt="Gold-tone jewelry with sculptural details"
                  />
                  <div>
                    <span>THE FINISHING TOUCH</span>
                    <h3>
                      Small details.
                      <br />
                      Lasting impressions.
                    </h3>
                    <p>
                      Discover accessories <ArrowUpRight />
                    </p>
                  </div>
                </button>
                <button
                  className="collection-card"
                  onClick={() => shop("Home")}
                >
                  <img
                    src={photo("photo-1578749556568-bc2c40e68b61", 800)}
                    loading="lazy"
                    alt="Decorative ceramic objects for the home"
                  />
                  <div>
                    <span>LIFE, BEAUTIFULLY CONSIDERED</span>
                    <h3>Beyond the bag.</h3>
                    <p>
                      Explore lifestyle <ArrowUpRight />
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </>
        ) : (
          <div className="shop-title section">
            <p className="eyebrow">THE CONSIDERED COLLECTION</p>
            <h1>
              {onlySaved
                ? "Your saved pieces."
                : category === "All pieces"
                  ? "A piece of your story."
                  : category + "."}
            </h1>
            <p>
              Beautiful objects for the way you live. All products and prices
              are fictional samples.
            </p>
          </div>
        )}
        <section className="section product-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {page === "home" ? "THE PIECES WE LOVE" : "EXPLORE THE GALLERY"}
              </p>
              <h2>
                {page === "home" ? (
                  <>
                    The everyday <em>edit.</em>
                  </>
                ) : onlySaved ? (
                  "Saved for later"
                ) : (
                  "Our collection"
                )}
              </h2>
            </div>
            {page === "home" && (
              <button className="text-link" onClick={() => shop()}>
                View all pieces <ArrowUpRight size={17} />
              </button>
            )}
          </div>
          <div
            className="category-tabs"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((c) => (
              <button
                className={category === c ? "active" : ""}
                key={c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {page === "shop" && (
            <div className="filters">
              <label className="search-field">
                <Search size={18} />
                <input
                  id="search"
                  placeholder="Search pieces, categories…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search products"
                />
              </label>
              <label>
                Maximum price
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                >
                  <option value={1000000}>All prices</option>
                  <option value={300000}>₱3,000</option>
                  <option value={500000}>₱5,000</option>
                </select>
              </label>
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="curated">Curated order</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
              </label>
              <span>{list.length} pieces</span>
            </div>
          )}
          <div className="product-grid">
            {(page === "home" && category === "All pieces"
              ? list.slice(0, 4)
              : list
            ).map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-image">
                  <button
                    className="product-open"
                    aria-label={`View ${p.name}`}
                    onClick={() => setSelected(p)}
                  >
                    <img src={p.media[0].src} alt={p.name} loading="lazy" />
                    <span className="quick-view">
                      Discover the piece <ArrowUpRight size={17} />
                    </span>
                  </button>
                  <span className="product-label">{p.label}</span>
                  <button
                    className={
                      "favorite " + (favorites.includes(p.id) ? "saved" : "")
                    }
                    aria-label={`${favorites.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
                    aria-pressed={favorites.includes(p.id)}
                    onClick={() =>
                      setFavorites((f) =>
                        f.includes(p.id)
                          ? f.filter((id) => id !== p.id)
                          : [...f, p.id],
                      )
                    }
                  >
                    <Heart size={17} />
                  </button>
                </div>
                <p className="product-category">{p.category}</p>
                <button className="product-name" onClick={() => setSelected(p)}>
                  {p.name}
                </button>
                <div className="product-bottom">
                  <span>{money(p.variants[0].price)}</span>
                  <div className="swatches">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </article>
            ))}
          </div>
          {list.length === 0 && (
            <div className="empty">
              <h3>No pieces found.</h3>
              <p>Try another category or price range.</p>
              <button
                className="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("All pieces");
                  setMaxPrice(1000000);
                  setOnlySaved(false);
                }}
              >
                Reset filters
              </button>
            </div>
          )}
          <p className="sample-note">
            A curated demonstration. All product names, prices, and stock are
            fictional. Photography is illustrative.
          </p>
        </section>
        {page === "home" && (
          <>
            <section className="live-banner">
              <div className="live-banner-image">
                <img
                  src={photo("photo-1590874103328-eac38a683ce7", 1000)}
                  loading="lazy"
                  alt="An up-close look at a leather bag"
                />
                <button
                  aria-label="Open live studio demonstration"
                  onClick={() => setOverlay("live")}
                >
                  <Play />
                </button>
                <span>THE GALLERY, UP CLOSE</span>
              </div>
              <div className="live-banner-copy">
                <p className="eyebrow">
                  <Radio size={15} /> THE GALLERY LIVE
                </p>
                <h2>
                  A closer look.
                  <br />A new way to <em>discover.</em>
                </h2>
                <p>
                  See the details. Find your favourites.
                  <br />
                  Step inside our live shopping experience.
                </p>
                <button
                  className="cream-button"
                  onClick={() => setOverlay("live")}
                >
                  Explore the live preview <ArrowUpRight size={18} />
                </button>
                <small>OFFLINE DEMONSTRATION · NO LIVE BROADCAST</small>
              </div>
            </section>
            <section className="story section">
              <p className="eyebrow">MORE THAN SOMETHING YOU CARRY</p>
              <h2>
                A reflection of who you are.
                <br />
                And everywhere you’re <em>going.</em>
              </h2>
              <button className="text-link" onClick={() => setOverlay("about")}>
                The story behind the gallery <ArrowRight size={17} />
              </button>
            </section>
          </>
        )}
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-brand">THE BAG GALLERY</div>
            <p>
              Premium Bag Collections
              <br />
              <em>Carry your style.</em>
            </p>
          </div>
          <div>
            <h3>THE COLLECTION</h3>
            <button onClick={() => shop("Handbags")}>Bags & totes</button>
            <button onClick={() => shop("Jewelry")}>Accessories</button>
            <button onClick={() => shop()}>All pieces</button>
          </div>
          <div>
            <h3>THE GALLERY</h3>
            <a href="/account">Customer account</a>
            <button onClick={() => setOverlay("about")}>Our story</button>
            <button onClick={() => setOverlay("live")}>Live preview</button>
            <button onClick={() => setOverlay("about")}>
              Delivery & returns
            </button>
          </div>
          <div className="footer-message">
            <p>
              A considered collection.
              <br />
              An everyday companion.
            </p>
            <span>
              <Instagram size={17} /> SOCIAL CHANNELS COMING SOON
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} The Bag Gallery</span>
          <span>SPRINT 0 · FICTIONAL STOREFRONT DEMONSTRATION</span>
          <button onClick={() => setOverlay("about")}>Privacy & terms</button>
        </div>
      </footer>
      <div className="sr-only" role="status">
        {announcement}
      </div>
      {selected && (
        <Modal
          title="Discover the piece"
          onClose={() => setSelected(null)}
          wide
        >
          <ProductDetail product={selected} onAdd={add} />
          <p role="status">{announcement}</p>
        </Modal>
      )}
      {overlay === "cart" && (
        <Modal
          title={`Your demo bag (${cart.length})`}
          onClose={() => setOverlay(null)}
        >
          <Cart
            lines={cart}
            onRemove={(i) => setCart((c) => c.filter((_, n) => n !== i))}
          />
        </Modal>
      )}
      {overlay === "live" && (
        <Modal title="The Gallery Live" onClose={() => setOverlay(null)} wide>
          <LiveSelling onAdd={add} />
          <p role="status">{announcement}</p>
        </Modal>
      )}
      {overlay === "about" && (
        <Modal title="A considered beginning" onClose={() => setOverlay(null)}>
          <div className="about">
            <p className="eyebrow">THE BAG GALLERY</p>
            <h3>Carry your style.</h3>
            <p>
              A demonstration of a premium destination for bags and beautifully
              chosen everyday objects. The underlying catalog welcomes any
              physical product category.
            </p>
            <p>
              This Sprint 0 preview uses fictional products, prices, and stock.
              The bag and saved pieces reset on refresh. Orders, customer
              accounts, shipping, returns, social channels, and payments are not
              available.
            </p>
            <h3>Privacy & terms preview</h3>
            <p>
              No personal information is collected by this application. External
              imagery and fonts request resources from Unsplash and Google;
              those providers receive standard connection information. Final
              merchant policies require review before launch.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
