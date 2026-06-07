import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PRODUCTS, CATEGORIES, type Product } from "@/data/products";
import {
  buildWhatsAppLink,
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  CONTACT_EMAIL,
  LOCATION,
} from "@/lib/whatsapp";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, MessageCircle, X, Heart, ArrowRight, Sparkles, User, ShoppingBag, Instagram, Mail, MapPin, Phone, Plus, Minus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jharva Fashion — Affordable Fashion That Looks Premium" },
      { name: "description", content: "Shop Jharva Fashion — premium kurtis, tops, dresses and co-ords at a flat ₹99 (MRP ₹299). Enquire by style code on WhatsApp." },
      { property: "og:title", content: "Jharva Fashion — Flat ₹99 Drop" },
      { property: "og:description", content: "Trendy outfits curated for modern everyday style. Made in India." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Lyb6zYaVQ6MB74D5Ph89lBj7Tee2/social-images/social-1780718174535-IMG_4795.webp" },
    ],
  }),
  component: CatalogPage,
});

const PAGE_SIZE = 24;

function CatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<Product | null>(null);

  // PM Improvements: Wishlist & Cart states
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("jharva_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<Array<{ product: Product; size: string; quantity: number }>>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("jharva_cart") || "[]");
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("jharva_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("jharva_cart", JSON.stringify(cart));
  }, [cart]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const addToCart = (product: Product, size: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id && item.size === size);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, size: string, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === productId && item.size === size);
      if (idx === -1) return prev;
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return next;
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)));
  };

  const buildGroupWhatsAppLink = () => {
    if (!WHATSAPP_NUMBER || cart.length === 0) return "#";
    let listStr = "";
    let totalItems = 0;
    cart.forEach((item) => {
      listStr += `\n- Code ${item.product.styleCode} (Size ${item.size}) x${item.quantity}`;
      totalItems += item.quantity;
    });
    const totalCost = totalItems * 99;
    const message = `Hello Jharva! I'd like to enquire about ordering these pieces:${listStr}\n\nTotal items: ${totalItems} (₹${totalCost}). Please share availability and payment details.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const inCat =
        category === "Favorites"
          ? favorites.includes(p.id)
          : category === "All" || p.category === category;
      const inQ = !q || p.styleCode.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [query, category, favorites]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [query, category]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd />
      <Hero />
      <Marquee />
      <section id="catalog" className="bg-cream pt-16 sm:pt-24 pb-24">
        <CatalogHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryPill active={category} onChange={setCategory} />
          <SearchBar query={query} setQuery={setQuery} count={filtered.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {filtered.slice(0, visible).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={() => setActive(p)}
                isFav={favorites.includes(p.id)}
                onFavToggle={(e) => toggleFavorite(p.id, e)}
              />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="flex justify-center mt-14">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-8 py-3.5 border border-maroon text-maroon hover:bg-maroon hover:text-cream transition-colors text-xs tracking-[0.25em] uppercase rounded-full"
              >
                Load more
              </button>
            </div>
          )}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-20 font-display text-2xl italic">
              {category === "Favorites"
                ? "You haven't favorited any pieces yet."
                : `No pieces match “${query}”.`}
            </p>
          )}
        </div>
      </section>
      <About />
      <Footer />
      <WhatsAppFab />
      <CartFloatingButton count={cart.reduce((a, c) => a + c.quantity, 0)} onClick={() => setIsCartOpen(true)} />
      <ProductDialog
        product={active}
        onClose={() => setActive(null)}
        isFav={active ? favorites.includes(active.id) : false}
        onFavToggle={() => active && toggleFavorite(active.id)}
        onAddToCart={addToCart}
      />
      <EnquiryCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQuantity}
        onRemove={removeFromCart}
        onSubmitLink={buildGroupWhatsAppLink()}
      />
    </div>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero() {
  return (
    <section className="relative hero-vignette text-cream overflow-hidden">
      {/* Top bar */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-cream/95 ring-2 ring-gold/70 shadow-lg shadow-black/30 font-display text-maroon text-2xl font-bold select-none">
            J
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl sm:text-3xl text-gold tracking-wide">Jharva</span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase text-cream/70 mt-1">Fashion</span>
          </span>
        </a>
        <div className="flex items-center gap-4 text-gold">
          <button aria-label="Account" className="p-2 hover:text-gold-soft transition-colors">
            <User className="w-5 h-5" strokeWidth={1.4} />
          </button>
          <button aria-label="Bag" className="p-2 hover:text-gold-soft transition-colors">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.4} />
          </button>
        </div>
      </div>

      {/* Headline */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-10 sm:pt-16 pb-20 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 border border-gold/60 rounded-full text-gold text-[11px] sm:text-xs tracking-[0.3em] uppercase animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" /> Drop 03 · Winter 26
        </div>

        <h1 className="mt-8 font-display leading-[0.95] animate-fade-in">
          <span className="block text-5xl sm:text-7xl lg:text-8xl text-cream">Affordable</span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl italic text-gold font-medium mt-1">Fashion</span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl text-cream mt-1">That Looks</span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl italic text-gold font-medium mt-1">Premium</span>
        </h1>

        <p className="mt-8 text-cream/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Trendy outfits curated for modern everyday style. Made in India. Loved on Instagram.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href="#catalog"
            className="group inline-flex items-center gap-3 gold-gradient text-maroon-deep px-10 py-4 rounded-full text-xs tracking-[0.3em] uppercase font-semibold shadow-lg shadow-black/30 hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Shop Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#catalog"
            className="inline-flex items-center gap-3 border border-gold/60 text-gold px-10 py-3.5 rounded-full text-xs tracking-[0.3em] uppercase hover:bg-gold/10 transition-colors"
          >
            Explore Collection
          </a>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-3 gap-6 max-w-md mx-auto">
          <Stat k="10k+" l="Happy Buyers" />
          <Stat k="4.8★" l="Avg Rating" />
          <Stat k={`${PRODUCTS.length}+`} l="Pieces" />
        </div>
      </div>
    </section>
  );
}

function Stat({ k, l }: { k: string; l: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl sm:text-4xl text-gold">{k}</p>
      <p className="mt-1 text-[10px] tracking-[0.25em] uppercase text-cream/60">{l}</p>
    </div>
  );
}

/* ───────────────────────── MARQUEE ───────────────────────── */

function Marquee() {
  const items = ["Flat ₹99", "MRP ₹299", "Limited Drop", "Enquire by Style Code", "Pan-India Delivery"];
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="bg-maroon-deep text-gold border-y border-gold/20 overflow-hidden">
      <div className="flex whitespace-nowrap marquee py-3 text-xs tracking-[0.3em] uppercase">
        {row.map((t, i) => (
          <span key={i} className="px-8 flex items-center gap-8 shrink-0">
            {t}<span className="text-gold/60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── CATALOG ───────────────────────── */

function CatalogHeader() {
  return (
    <div className="text-center px-4 mb-10 sm:mb-14">
      <p className="text-xs sm:text-sm tracking-[0.4em] uppercase text-gold font-medium">Our Collection</p>
      <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-maroon mt-4">Trending Styles</h2>
      <div className="mx-auto mt-5 h-px w-16 bg-gold" />
      <p className="mt-6 text-base sm:text-lg text-ink/70 max-w-xl mx-auto">
        Handpicked everyday luxe — flat <span className="text-maroon font-semibold">₹99</span> on every piece.
      </p>
    </div>
  );
}

function CategoryPill({ active, onChange }: { active: string; onChange: (c: string) => void }) {
  const tabs = [...CATEGORIES, "Favorites"];
  return (
    <div className="flex justify-center">
      <div className="inline-flex bg-card border border-border rounded-full p-1.5 overflow-x-auto max-w-full no-scrollbar no-scrollbar-webkit gap-1">
        {tabs.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`shrink-0 px-4 sm:px-6 py-2.5 text-[11px] sm:text-xs tracking-[0.25em] uppercase rounded-full transition-all flex items-center gap-1.5 ${
              active === c
                ? "bg-maroon text-cream shadow-md"
                : "text-ink/70 hover:text-maroon"
            }`}
          >
            {c === "Favorites" && (
              <Heart 
                className={`w-3.5 h-3.5 ${active === "Favorites" ? "fill-cream text-cream" : "text-maroon"}`} 
                strokeWidth={2}
              />
            )}
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchBar({ query, setQuery, count }: { query: string; setQuery: (s: string) => void; count: number }) {
  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
      <div className="flex items-center bg-card border border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 rounded-full px-5 h-12 w-full sm:max-w-sm transition-all">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by style code (e.g. JH-007)"
          className="bg-transparent outline-none px-3 text-sm flex-1 placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-[11px] tracking-[0.25em] uppercase text-ink/60">
        {count} piece{count === 1 ? "" : "s"} · all at ₹99
      </p>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
  isFav,
  onFavToggle,
}: {
  product: Product;
  onOpen: () => void;
  isFav: boolean;
  onFavToggle: (e: React.MouseEvent) => void;
}) {
  const discount = Math.round((1 - product.price / product.mrp) * 100);
  return (
    <article className="group card-cv bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-shadow flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <button onClick={onOpen} className="block w-full h-full text-left">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </button>
        {/* Badges */}
        <span
          className={`absolute top-3 left-3 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full font-semibold pointer-events-none select-none z-10 ${
            product.badge === "BESTSELLER"
              ? "bg-gold text-maroon-deep"
              : product.badge === "TRENDING"
              ? "bg-cream text-maroon-deep border border-gold/40"
              : "bg-maroon-deep/85 text-gold backdrop-blur"
          }`}
        >
          {product.badge}
        </span>
        <span className="absolute top-3 right-3 bg-maroon text-cream text-[9px] sm:text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 rounded-full font-semibold shadow-md pointer-events-none select-none z-10">
          Save {discount}%
        </span>
        <button
          onClick={onFavToggle}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-maroon-deep/85 text-gold flex items-center justify-center backdrop-blur hover:scale-110 active:scale-95 transition-transform z-10"
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-gold text-gold" : "text-gold"}`} strokeWidth={1.5} />
        </button>
      </div>
      <button onClick={onOpen} className="block w-full text-left p-3 sm:p-4 flex-1">
        <p className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-gold font-semibold">{product.category}</p>
        <h3 className="font-display text-lg sm:text-xl text-ink mt-1 leading-snug line-clamp-1">{product.name}</h3>
        <p className="text-[9px] tracking-[0.2em] uppercase text-ink/55 mt-0.5">{product.styleCode}</p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="flex flex-col leading-none">
            <span className="text-[9px] tracking-[0.25em] uppercase text-ink/45 line-through">MRP ₹{product.mrp}</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[10px] tracking-[0.2em] uppercase text-maroon/70 font-medium">Offer</span>
              <span className="font-display text-2xl sm:text-3xl text-maroon font-bold">₹{product.price}</span>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase bg-gold/20 text-maroon-deep px-2 py-1 rounded-full font-semibold whitespace-nowrap">
            Save ₹{product.mrp - product.price}
          </span>
        </div>
      </button>
      <button
        onClick={onOpen}
        className="m-3 sm:m-4 mt-0 inline-flex items-center justify-center gap-2 bg-maroon text-cream py-3 rounded-full text-[10px] sm:text-[11px] tracking-[0.25em] uppercase hover:bg-maroon-deep transition-colors"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Enquire / Add Size
      </button>
    </article>
  );
}

/* ───────────────────────── DIALOG ───────────────────────── */

function ProductDialog({
  product,
  onClose,
  isFav,
  onFavToggle,
  onAddToCart,
}: {
  product: Product | null;
  onClose: () => void;
  isFav: boolean;
  onFavToggle: () => void;
  onAddToCart: (product: Product, size: string) => void;
}) {
  if (!product) return null;
  const [selectedSize, setSelectedSize] = useState<string>("M");

  const getWhatsAppLink = () => {
    if (!WHATSAPP_NUMBER) return "#";
    const message = `Hello Jharva! I'm interested in Style Code ${product.styleCode} in Size ${selectedSize} (₹99). Please share availability.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const discount = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[calc(100vw-1.5rem)] sm:w-full p-0 overflow-hidden bg-card border-border rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.description}</DialogDescription>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-20 p-2 rounded-full bg-cream/95 hover:bg-cream shadow-md">
          <X className="w-4 h-4" />
        </button>
        <div className="grid md:grid-cols-2">
          <div className="bg-secondary">
            <div className="aspect-[3/4] md:aspect-auto md:h-full overflow-hidden max-h-[55vh] md:max-h-none">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold">
                {product.category} · {product.styleCode}
              </p>
              <h3 className="font-display text-3xl sm:text-4xl mt-2 text-maroon">{product.name}</h3>
              <div className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-ink/55 line-through">MRP ₹{product.mrp}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[11px] tracking-[0.25em] uppercase text-maroon/70 font-medium">Offer Price</span>
                      <span className="font-display text-4xl text-maroon font-bold leading-none">₹{product.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] tracking-[0.25em] uppercase bg-maroon text-cream px-2.5 py-1 rounded-full font-semibold">
                      {discount}% OFF
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-maroon-deep/80 font-medium">
                      You save ₹{product.mrp - product.price}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-ink/70">{product.description}</p>
              <div className="mt-6">
                <p className="text-[10px] tracking-[0.3em] uppercase text-ink/60 mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 border rounded-full text-xs transition-all uppercase tracking-wider ${
                        selectedSize === s
                          ? "bg-maroon text-cream border-maroon shadow-md font-semibold"
                          : "border-border hover:border-maroon text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 gold-gradient text-maroon-deep py-4 px-4 rounded-full text-[11px] tracking-[0.25em] uppercase font-semibold shadow-md hover:-translate-y-0.5 transition-all text-center"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Enquire
                </a>
                <button
                  onClick={() => {
                    onAddToCart(product, selectedSize);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-maroon text-cream hover:bg-maroon-deep py-4 px-4 rounded-full text-[11px] tracking-[0.25em] uppercase font-semibold shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Add to List
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-ink/55 px-1">
                <span>Code: {product.styleCode}</span>
                <button onClick={onFavToggle} className="hover:text-maroon flex items-center gap-1.5 transition-colors">
                  <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-maroon text-maroon" : "text-ink/60"}`} strokeWidth={isFav ? 0 : 1.5} />
                  {isFav ? "Favorited" : "Add Favorite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── ABOUT / FOOTER ───────────────────────── */

function About() {
  return (
    <section id="about" className="bg-card border-y border-border">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-gold font-medium">The Story</p>
        <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-tight text-maroon">
          Quiet craftsmanship,<br /> generously priced.
        </h2>
        <p className="mt-6 text-ink/70 leading-relaxed max-w-2xl mx-auto">
          Jharva is a small atelier that believes everyday clothing can feel considered. Each
          piece in the ₹99 drop is finished by hand in limited quantities — soft fabrics, honest
          cuts, and the small details that make a garment worth keeping.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  const waMsg = encodeURIComponent("Hello Jharva! I'd like to know more about your ₹99 collection.");
  const waLink = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}` : "#";
  return (
    <footer id="footer" className="bg-maroon-deep text-cream">
      {/* Contact strip */}
      <div className="border-b border-cream/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-cream/5 hover:bg-cream/10 border border-cream/10 hover:border-gold/40 p-4 sm:p-5 transition-all"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold">WhatsApp</p>
              <p className="text-sm sm:text-base text-cream font-medium mt-0.5 truncate">{WHATSAPP_DISPLAY}</p>
            </div>
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-cream/5 hover:bg-cream/10 border border-cream/10 hover:border-gold/40 p-4 sm:p-5 transition-all"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center">
              <Instagram className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold">Instagram</p>
              <p className="text-sm sm:text-base text-cream font-medium mt-0.5 truncate">@{INSTAGRAM_HANDLE}</p>
            </div>
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group flex items-center gap-4 rounded-2xl bg-cream/5 hover:bg-cream/10 border border-cream/10 hover:border-gold/40 p-4 sm:p-5 transition-all"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-gold text-maroon-deep flex items-center justify-center">
              <Mail className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold">Email</p>
              <p className="text-sm sm:text-base text-cream font-medium mt-0.5 truncate">{CONTACT_EMAIL}</p>
            </div>
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-cream ring-2 ring-gold/70 font-display text-maroon text-2xl font-bold select-none">
              J
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-3xl text-gold tracking-wide">Jharva</span>
              <span className="text-[10px] tracking-[0.4em] uppercase text-cream/70 mt-1">Fashion</span>
            </span>
          </div>
          <p className="mt-5 text-sm text-cream/70 leading-relaxed max-w-sm">
            Affordable fashion that looks premium. Flat ₹99 on every piece — MRP ₹299. Made in India, loved on Instagram.
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-4">Shop</p>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><a href="#catalog" className="hover:text-gold transition-colors">Catalog</a></li>
            <li><a href="#about" className="hover:text-gold transition-colors">About</a></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-4">Visit</p>
          <p className="inline-flex items-start gap-2.5 text-sm text-cream/80">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.6} />
            <span>{LOCATION}<br /><span className="text-cream/55 text-xs">DM or WhatsApp us with a style code to order.</span></span>
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-[10px] tracking-[0.3em] uppercase text-cream/50">
        © {new Date().getFullYear()} Jharva Fashion · {LOCATION}
      </div>
    </footer>
  );
}

function WhatsAppFab() {
  const msg = encodeURIComponent("Hello Jharva! I'd like to know more about your ₹99 collection.");
  const link = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}` : null;
  if (!link) return null;
  return (
    <a
      aria-label="Chat on WhatsApp"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-[#25D366] text-white shadow-xl shadow-black/30 hover:scale-105 transition-transform"
    >
      <span className="relative flex w-10 h-10 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-60" />
        <span className="relative w-10 h-10 rounded-full bg-white text-[#25D366] flex items-center justify-center">
          <MessageCircle className="w-5 h-5" strokeWidth={2} />
        </span>
      </span>
      <span className="text-xs font-semibold tracking-wide hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}

/* ───────────────────────── JSON-LD ───────────────────────── */

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Jharva Fashion — ₹99 Drop",
    numberOfItems: PRODUCTS.length,
    itemListElement: PRODUCTS.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        sku: p.styleCode,
        category: p.category,
        image: p.image,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/* ───────────────────────── PM IMPROVEMENTS: CART / SELECTION ───────────────────────── */

function CartFloatingButton({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      aria-label="View selection list"
      className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full gold-gradient text-maroon-deep shadow-xl shadow-black/30 hover:scale-105 active:scale-95 transition-transform"
    >
      <span className="relative flex w-9 h-9 items-center justify-center bg-maroon-deep text-gold rounded-full">
        <ShoppingBag className="w-4.5 h-4.5" strokeWidth={2} />
        <span className="absolute -top-1.5 -right-1.5 bg-maroon text-cream text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-gold shadow-md animate-bounce">
          {count}
        </span>
      </span>
      <span className="text-xs font-bold tracking-[0.15em] uppercase hidden sm:inline">My List</span>
    </button>
  );
}

function EnquiryCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  onSubmitLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: Array<{ product: Product; size: string; quantity: number }>;
  onUpdateQty: (id: string, size: string, delta: number) => void;
  onRemove: (id: string, size: string) => void;
  onSubmitLink: string;
}) {
  if (!isOpen) return null;

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = totalItems * 99;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />
      {/* Drawer content */}
      <div className="relative z-10 w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-maroon" />
            <h3 className="font-display text-2xl text-maroon">Enquiry List</h3>
            <span className="bg-gold/20 text-maroon-deep text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {totalItems} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <ShoppingBag className="w-12 h-12 text-ink/20 stroke-1 mb-4" />
              <p className="font-display text-xl text-ink/75">Your list is empty</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
                Add pieces from our trending catalog and enquire about them all in a single WhatsApp request.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.size}-${idx}`}
                className="flex gap-4 p-3 border border-border rounded-xl bg-card hover:border-gold/30 transition-colors"
              >
                <div className="w-16 h-20 bg-secondary rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-display text-base text-ink line-clamp-1 leading-tight">{item.product.name}</h4>
                      <button
                        onClick={() => onRemove(item.product.id, item.size)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] tracking-wider text-ink/50 mt-1 uppercase">
                      Code: {item.product.styleCode} · Size: <span className="font-semibold text-maroon">{item.size}</span>
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-display text-base text-maroon font-bold">₹{item.product.price * item.quantity}</span>
                    <div className="flex items-center border border-border rounded-full bg-secondary overflow-hidden">
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                        className="px-2.5 py-1 hover:bg-border text-ink transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold text-ink">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                        className="px-2.5 py-1 hover:bg-border text-ink transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-border bg-secondary/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs tracking-wider text-ink/65 uppercase">Est. Total Cost</span>
              <span className="font-display text-3xl text-maroon font-bold">₹{totalPrice}</span>
            </div>
            <a
              href={onSubmitLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 gold-gradient text-maroon-deep py-4 rounded-full text-xs tracking-[0.3em] uppercase font-bold shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-transform text-center"
            >
              <MessageCircle className="w-4.5 h-4.5" /> Enquire on WhatsApp
            </a>
            <p className="text-[9px] tracking-widest text-ink/55 text-center mt-3 uppercase">
              Sends selection with style codes & sizes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
