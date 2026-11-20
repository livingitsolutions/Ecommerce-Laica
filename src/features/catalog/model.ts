import { z } from "zod";
export const selectionSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});
export type Media = {
  id: string;
  kind: "image" | "video";
  src: string;
  alt: string;
  position: number;
  poster?: string;
  variantId?: string;
};
export type Variant = {
  id: string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>;
};
export type Product = {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  description: string;
  label: string;
  featured: boolean;
  status: "published" | "draft";
  specs: Record<string, string | number | boolean>;
  variants: Variant[];
  media: Media[];
};
export const money = (minor: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(minor / 100);
export function filterProducts(
  products: Product[],
  query: string,
  category: string,
  maxPrice: number,
) {
  return products.filter(
    (p) =>
      p.status === "published" &&
      (category === "All pieces" || p.category === category) &&
      `${p.name} ${p.category} ${p.description} ${Object.values(p.specs).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      p.variants.some((v) => v.price <= maxPrice),
  );
}
