import type { Product } from "./model";
export const photo = (id: string, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const items = [
  [
    "arc",
    "The Arc Shoulder Bag",
    "Handbags",
    "A sculptural silhouette, made for the everyday. Supple leather meets quiet gold-tone details.",
    "EDITOR’S PICK",
    "photo-1548036328-c9fa89d128fa",
    485000,
    { Material: "Leather", Lining: "Cotton", Width: "28 cm" },
  ],
  [
    "weekender",
    "The Weekend Tote",
    "Handbags",
    "Room for a little more. A generous carryall for slow mornings and spontaneous departures.",
    "EVERYDAY ICON",
    "photo-1553062407-98eeb64c6a62",
    620000,
    { Material: "Canvas", Capacity: "24 L" },
  ],
  [
    "mini",
    "The Mini Form",
    "Handbags",
    "Small in scale. Full of character. An evening companion with a considered finish.",
    "NEW ARRIVAL",
    "photo-1584917865442-de89df76afd3",
    365000,
    { Material: "Vegan leather", Width: "19 cm" },
  ],
  [
    "saddle",
    "The Heritage Crossbody",
    "Handbags",
    "Warm tones, timeless lines. A hands-free classic with an adjustable strap.",
    "LIMITED EDIT",
    "photo-1590874103328-eac38a683ce7",
    540000,
    { Material: "Leather", Strap: "Adjustable" },
  ],
  [
    "loafer",
    "The Sunday Loafer",
    "Shoes",
    "A soft, polished flat for days that move at your pace.",
    "THE ESSENTIALS",
    "photo-1543163521-1bf539c55dd2",
    425000,
    { Material: "Suede", Sole: "Rubber" },
  ],
  [
    "shirt",
    "The Linen Edit Shirt",
    "Clothing",
    "An easy silhouette in airy linen, designed for warm afternoons.",
    "NATURAL TEXTURES",
    "photo-1598554747436-c9293d6a588f",
    280000,
    { Fabric: "Linen", Care: "Cold wash" },
  ],
  [
    "earrings",
    "The Orbit Earrings",
    "Jewelry",
    "An understated pair with a softly sculpted finish.",
    "SMALL TREASURES",
    "photo-1535632066927-ab7c9ab60908",
    195000,
    { Metal: "Gold plated brass", Hypoallergenic: true },
  ],
  [
    "speaker",
    "The Tempo Speaker",
    "Electronics",
    "Thoughtful sound in a compact, tactile form.",
    "CONSIDERED TECH",
    "photo-1608043152269-423dbba4e7e1",
    580000,
    { Connectivity: "Bluetooth", Battery: "12 hours" },
  ],
  [
    "vase",
    "The Still Ceramic Vase",
    "Home",
    "Organic curves and an earthy glaze for a quieter corner.",
    "AT HOME",
    "photo-1578749556568-bc2c40e68b61",
    165000,
    { Material: "Ceramic", Height: "24 cm" },
  ],
] as const;
export const products: Product[] = items.map(
  (
    [id, name, category, description, label, img, price, specs],
    i,
  ): Product => ({
    id,
    sellerId: "bag-gallery",
    name,
    category,
    description,
    label,
    featured: i < 4,
    status: "published",
    specs,
    variants: [
      {
        id: `${id}-a`,
        sku: `TBG-${id.toUpperCase()}-A`,
        price,
        stock: 8,
        options:
          category === "Shoes"
            ? { Size: "37", Color: "Sand" }
            : category === "Clothing"
              ? { Size: "S", Color: "Ivory" }
              : { Color: "Classic" },
      },
      {
        id: `${id}-b`,
        sku: `TBG-${id.toUpperCase()}-B`,
        price: price + 20000,
        stock: 3,
        options:
          category === "Shoes"
            ? { Size: "38", Color: "Sand" }
            : category === "Clothing"
              ? { Size: "M", Color: "Ivory" }
              : { Color: "Natural" },
      },
    ],
    media: [
      {
        id: `${id}-1`,
        kind: "image",
        src: photo(img),
        alt: `${name}, editorial sample photograph`,
        position: 0,
      },
      {
        id: `${id}-2`,
        kind: "image",
        src: photo(img, 1500),
        alt: `${name}, enlarged editorial photograph for the alternate sample variant`,
        position: 1,
        variantId: `${id}-b`,
      },
      {
        id: `${id}-3`,
        kind: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster: photo(img, 600),
        alt: "Generic flower video — playback demonstration, not product footage",
        position: 2,
      },
    ],
  }),
);
export const categories = [
  "All pieces",
  "Handbags",
  "Shoes",
  "Clothing",
  "Jewelry",
  "Electronics",
  "Home",
];
