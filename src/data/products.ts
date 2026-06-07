// Auto-generated product catalog. Images live as CDN asset pointers under src/assets/products/.

export type Category = "Tops" | "Kurtis" | "Dresses" | "Co-ords";
export type Badge = "BESTSELLER" | "TRENDING" | "NEW";

export interface Product {
  id: string;
  styleCode: string;
  name: string;
  category: Category;
  badge: Badge;
  price: number;
  mrp: number;
  image: string;
  sizes: string[];
  description: string;
}

// Product images are served statically from /public/products/ folder.

const NAMES = [
  "Marigold Bloom", "Rose Pink Whisper", "Indigo Floral", "Sandstone Halter",
  "Aurora Print", "Champagne Glow", "Crimson Petal", "Olive Mosaic",
  "Pearl Linen", "Ivory Mull", "Sapphire Tile", "Coral Garden",
  "Saffron Mirror", "Mauve Drift", "Onyx Geometry", "Teal Tide",
  "Plum Sequin", "Bronze Bloom", "Sage Whisper", "Terracotta Tile",
  "Lilac Daydream", "Sand Dune", "Cinnamon Spice", "Forest Vine",
  "Sunset Halter", "Cloud Wrap", "Ember Diamond", "Mist Floral",
  "Garnet Print", "Wheat Field", "Cobalt Petal", "Maple Leaf",
  "Pearl Keyhole", "Velvet Rose", "Tangerine Tile", "Smoke Sage",
  "Apricot Bloom", "Slate Stripe", "Berry Crush", "Honey Comb",
  "Powder Blush", "Jade Mosaic", "Rust Garden", "Linen Pearl",
  "Marble White", "Cocoa Print", "Sand Halter", "Aqua Drift",
  "Mocha Bloom", "Glacier Mint", "Brass Vine",
];

const CATS: Category[] = ["Tops", "Kurtis", "Dresses", "Co-ords"];

function inferCategory(i: number): Category {
  // Spread categories across the catalog
  return CATS[i % CATS.length];
}

function inferBadge(i: number): Badge {
  if (i % 7 === 0) return "BESTSELLER";
  if (i % 5 === 0) return "TRENDING";
  return "NEW";
}

const DESCRIPTIONS = [
  "Hand-finished silhouette with a soft, breathable feel. A timeless pick.",
  "Effortless drape with delicate detailing — easy to dress up or down.",
  "Curated for everyday luxe. Premium fabric, considered cut.",
  "A statement piece, quietly. Pairs beautifully with denim or palazzos.",
];

const TOTAL_IMAGES = 46;

export const PRODUCTS: Product[] = NAMES.map((name, idx) => {
  const num = (idx % TOTAL_IMAGES) + 1;
  const code = `JH-${String(num).padStart(3, "0")}`;
  return {
    id: `JH-${String(idx + 1).padStart(3, "0")}`,
    styleCode: code,
    name: name,
    category: inferCategory(idx),
    badge: inferBadge(idx),
    price: 99,
    mrp: 299,
    image: `/products/${code}.jpg`,
    sizes: ["S", "M", "L", "XL"],
    description: DESCRIPTIONS[idx % DESCRIPTIONS.length],
  };
});

export const CATEGORIES: ("All" | Category)[] = ["All", "Tops", "Kurtis", "Dresses", "Co-ords"];
