export type MensCategory = "T-Shirts" | "Pants" | "Joggers";

export interface MensProduct {
  id: string;
  styleCode: string;
  name: string;
  category: MensCategory;
  price: number;
  mrp: number;
  frontImage: string;
  backImage: string;
  sizes: string[];
  description: string;
  baseColor: string;
  badge?: string;
  stock?: Record<string, number>;
  stock_total?: number;
  in_stock?: boolean;
}

export const MENS_PRODUCTS: MensProduct[] = [
  {
    id: "JM-001",
    styleCode: "JM-001",
    name: "Luffy Gear 5 Maroon Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-001.jpg",
    backImage: "/products/mens/JM-017.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Premium maroon oversized tee featuring Luffy's gear text on the front and a back graphic print. Made of heavy 220 GSM combed cotton.",
    baseColor: "Maroon"
  },
  {
    id: "JM-002",
    styleCode: "JM-002",
    name: "Zenitsu Thunderclap Charcoal Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-002.jpg",
    backImage: "/products/mens/JM-021.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Dark charcoal oversized graphic t-shirt featuring a minimal Zenitsu signature on the front and Thunder Breathing form on the back.",
    baseColor: "Charcoal"
  },
  {
    id: "JM-003",
    styleCode: "JM-003",
    name: "Goku Black Rose Lime Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-003.jpg",
    backImage: "/products/mens/JM-008.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Vibrant lime green t-shirt with front text 'Son Goku' and Goku Black Rose printed in detail on the back. Premium street wear fit.",
    baseColor: "Lime Green"
  },
  {
    id: "JM-004",
    styleCode: "JM-004",
    name: "Goku Super Saiyan Kanji Light Blue Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-004.jpg",
    backImage: "/products/mens/JM-006.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Relaxed fit sky blue tee with Goku minimal print on the front and full-detail power stance Goku graphic on the back.",
    baseColor: "Light Blue"
  },
  {
    id: "JM-005",
    styleCode: "JM-005",
    name: "Akaza Upper Moon Navy Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-005.jpg",
    backImage: "/products/mens/JM-020.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Classic deep navy blue oversized tee with clean front font and full back print of Akaza. Perfect for anime streetwear collections.",
    baseColor: "Navy Blue"
  },
  {
    id: "JM-006",
    styleCode: "JM-006",
    name: "Hawk-Eyes Mihawk Mint Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-013.jpg",
    backImage: "/products/mens/JM-007.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Sage mint green comfortable oversized tee featuring Dracule Mihawk front name logo and back character illustration.",
    baseColor: "Mint Green"
  },
  {
    id: "JM-007",
    styleCode: "JM-007",
    name: "Naruto Spin Your Destiny Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-009.jpg",
    backImage: "/products/mens/JM-015.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Warm olive-charcoal aesthetic tee featuring Naruto minimal front text and a cool skateboard graphic back print with the text 'Spin Your Destiny'.",
    baseColor: "Charcoal"
  },
  {
    id: "JM-008",
    styleCode: "JM-008",
    name: "Akatsuki Obito & Nagato Pink Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-010.jpg",
    backImage: "/products/mens/JM-014.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Soft pink oversized street tee with Nagato minimal text print on the front and Obito Uchiha's mask graphic detailed on the back.",
    baseColor: "Pink"
  },
  {
    id: "JM-009",
    styleCode: "JM-009",
    name: "Yondaime Namikaze Minato Brown Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-011.jpg",
    backImage: "/products/mens/JM-011.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Earth brown heavy cotton tee showcasing Minato Namikaze (Fourth Hokage) artwork on the back. A subtle, high-quality statement print.",
    baseColor: "Brown"
  },
  {
    id: "JM-010",
    styleCode: "JM-010",
    name: "Itachi Uchiha Crow Black Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-023.jpg",
    backImage: "/products/mens/JM-012.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Obsidian black graphic t-shirt with clean front print of Itachi Uchiha's name and high-quality detailed sharingan/crow back art.",
    baseColor: "Black"
  },
  {
    id: "JM-011",
    styleCode: "JM-011",
    name: "Roronoa Zoro Three-Sword Red Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-024.jpg",
    backImage: "/products/mens/JM-016.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Crimson red heavy cotton drop-shoulder tee showing Zoro front text logo and Zoro standing pose with his three swords on the back.",
    baseColor: "Red"
  },
  {
    id: "JM-012",
    styleCode: "JM-012",
    name: "Yuta Okkotsu Cursed Child Navy Tee",
    category: "T-Shirts",
    price: 299,
    mrp: 799,
    frontImage: "/products/mens/JM-019.jpg",
    backImage: "/products/mens/JM-018.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Midnight navy blue relaxed graphic t-shirt featuring Yuta Okkotsu Cursed Child minimal text on the front and full artwork on the back.",
    baseColor: "Navy Blue"
  }
];

export const MENS_CATEGORIES: ("All" | MensCategory)[] = ["All", "T-Shirts", "Pants", "Joggers"];
