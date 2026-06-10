// Bundled image fallback by sku — used when DB image_url is empty (initial seed).
import p02 from "@/assets/catalog/p02.jpg";
import p03 from "@/assets/catalog/p03.jpg";
import p04 from "@/assets/catalog/p04.jpg";
import p05 from "@/assets/catalog/p05.jpg";
import p06 from "@/assets/catalog/p06.jpg";
import p07 from "@/assets/catalog/p07.jpg";
import p08 from "@/assets/catalog/p08.jpg";
import p09 from "@/assets/catalog/p09.jpg";
import p10 from "@/assets/catalog/p10.jpg";
import p11 from "@/assets/catalog/p11.jpg";
import p12 from "@/assets/catalog/p12.jpg";
import p13 from "@/assets/catalog/p13.jpg";
import p14 from "@/assets/catalog/p14.jpg";
import p15 from "@/assets/catalog/p15.jpg";
import p16 from "@/assets/catalog/p16.jpg";
import p17 from "@/assets/catalog/p17.jpg";
import p18 from "@/assets/catalog/p18.jpg";
import p19 from "@/assets/catalog/p19.jpg";
import p21 from "@/assets/catalog/p21.jpg";

export const SKU_IMAGE_FALLBACK: Record<string, string> = {
  "jh-101": p02,
  "jh-102": p03,
  "jh-103": p04,
  "jh-104": p05,
  "jh-105": p06,
  "jh-106": p07,
  "jh-107": p08,
  "jh-108": p09,
  "jh-109": p10,
  "jh-110": p11,
  "jh-111": p12,
  "jh-112": p15,
  "jh-113": p21,
  "jh-201": p13,
  "jh-202": p14,
  "jh-203": p16,
  "jh-204": p17,
  "jh-205": p18,
  "jh-206": p19,
};

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20400%20500'%3E%3Crect%20width='400'%20height='500'%20fill='%23eee'/%3E%3Ctext%20x='50%25'%20y='50%25'%20text-anchor='middle'%20dy='.3em'%20fill='%23999'%20font-family='sans-serif'%20font-size='18'%3ENo%20image%3C/text%3E%3C/svg%3E";

export function resolveImage(sku: string, image_url?: string | null): string {
  if (image_url && image_url.trim().length > 0) return image_url;
  return SKU_IMAGE_FALLBACK[sku] ?? PLACEHOLDER_IMAGE;
}

// Storefront-facing product shape (id = sku for stable URLs).
export type Product = {
  id: string; // sku, used in cart + URL
  uuid: string; // DB id, used by admin operations
  sku: string;
  name: string;
  description?: string;
  category: string;
  gender: "women" | "men" | "unisex";
  price: number;
  mrp: number;
  image: string; // resolved (DB url or fallback)
  badge?: string | null;
  sizes: string[];
  collection_id?: string | null;
  is_published?: boolean;
  sort_order?: number;
  stock?: Record<string, number>;
  stock_total?: number;
  in_stock?: boolean;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  sort_order: number;
  is_published: boolean;
};

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export type DbProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  gender: string;
  price: number;
  mrp: number;
  image_url: string | null;
  badge: string | null;
  sizes: string[];
  collection_id: string | null;
  is_published: boolean;
  sort_order: number;
};

export function mapDbProduct(row: DbProductRow): Product {
  return {
    id: row.sku,
    uuid: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description ?? "",
    category: row.category,
    gender: (row.gender as Product["gender"]) ?? "women",
    price: row.price,
    mrp: row.mrp,
    image: resolveImage(row.sku, row.image_url),
    badge: row.badge,
    sizes: row.sizes ?? [],
    collection_id: row.collection_id,
    is_published: row.is_published,
    sort_order: row.sort_order,
  };
}
