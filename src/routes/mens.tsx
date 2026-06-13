import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MENS_PRODUCTS, MENS_CATEGORIES, type MensProduct } from "@/data/mens_products";
import {
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  CONTACT_EMAIL,
  LOCATION,
} from "@/lib/whatsapp";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, MessageCircle, X, Heart, ArrowRight, Sparkles, User, ShoppingBag, Instagram, Mail, MapPin, Plus, Minus, Trash2, Info, Check, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublishedProducts } from "@/lib/catalog.functions";
import { useAuth } from "@/hooks/use-auth";
import { placeOrder } from "@/lib/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/mens")({
  head: () => ({
    meta: [
      { title: "Jharva Men — Premium Anime Printed Oversized Tees" },
      { name: "description", content: "Shop Jharva Men — premium anime printed oversized t-shirts at flat ₹299 (MRP ₹799). Luffy, Zoro, Goku, Naruto, Itachi & more." },
      { property: "og:title", content: "Jharva Men — Anime Streetwear Drop" },
      { property: "og:description", content: "Flat ₹299 anime oversized tees. Heavy 220 GSM combed cotton. Enquire on WhatsApp." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/products/mens/JM-001.jpg" },
    ],
  }),
  component: MensCatalogPage,
});

const PAGE_SIZE = 12;

function MensCatalogPage() {
  const { user, isAdmin, signOut } = useAuth();
  const fetchProducts = useServerFn(listPublishedProducts);
  const { data: dbData } = useQuery({
    queryKey: ["products", "published"],
    queryFn: () => fetchProducts(),
  });

  const productsList = useMemo(() => {
    const dbProducts = dbData?.products || [];
    const dbMenProducts = dbProducts.filter((p: any) => p.gender === "men" || p.gender === "unisex");
    const dbSkus = new Set(dbMenProducts.map((p: any) => p.sku.toLowerCase()));
    const remainingStatic = MENS_PRODUCTS.filter(p => !dbSkus.has(p.styleCode.toLowerCase()));
    
    return [...dbMenProducts, ...remainingStatic].map((p: any) => ({
      id: p.id || p.sku,
      styleCode: p.styleCode || p.sku,
      name: p.name,
      category: p.category,
      badge: p.badge || "",
      price: p.price,
      mrp: p.mrp,
      frontImage: p.frontImage || p.image || p.image_url,
      backImage: p.backImage || "",
      sizes: p.sizes || [],
      description: p.description || "",
      baseColor: p.baseColor || "Default",
      stock: p.stock || {},
      stock_total: p.stock_total !== undefined ? p.stock_total : 100,
      in_stock: p.in_stock !== undefined ? p.in_stock : true,
    }));
  }, [dbData]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sizeFilter, setSizeFilter] = useState<string>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<MensProduct | null>(null);

  // Pre-checkout details form states
  const [customerName, setCustomerName] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Local Storage states (Separated from women's to avoid interference)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<Array<{ product: MensProduct; size: string; quantity: number }>>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load state safely on mount
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("jharva_mens_favorites");
      if (storedFavs) setFavorites(JSON.parse(storedFavs));

      const storedCart = localStorage.getItem("jharva_mens_cart");
      if (storedCart) setCart(JSON.parse(storedCart));
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("jharva_mens_favorites", JSON.stringify(favorites));
  }, [favorites, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("jharva_mens_cart", JSON.stringify(cart));
  }, [cart, isLoaded]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const addToCart = (product: MensProduct, size: string) => {
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
    let totalCost = 0;
    cart.forEach((item) => {
      listStr += `\n- ${item.product.name} (Code: ${item.product.styleCode}) [Size ${item.size}] x${item.quantity}`;
      totalItems += item.quantity;
      totalCost += (item.product.price || 299) * item.quantity;
    });

    let customerInfo = "";
    if (customerName.trim()) {
      customerInfo += `Name: ${customerName.trim()}\n`;
    }
    if (customerPincode.trim()) {
      customerInfo += `Shipping Pin/City: ${customerPincode.trim()}\n`;
    }

    const message = `Hello Jharva Men! I'd like to enquire about ordering these items:\n${customerInfo}${listStr}\n\nTotal items: ${totalItems} (₹${totalCost}). Please share availability and payment details.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productsList.filter((p) => {
      const inCat =
        category === "Favorites"
          ? favorites.includes(p.id)
          : category === "All" || p.category === category;
      const inQ = !q || p.styleCode.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const inSize = sizeFilter === "All" || p.sizes.includes(sizeFilter);
      return inCat && inQ && inSize;
    });
  }, [query, category, favorites, sizeFilter, productsList]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [query, category, sizeFilter]);

  return (
    <div className="min-h-screen bg-cream text-ink font-sans selection:bg-gold selection:text-maroon-deep">
      <MensHero />
      <MensMarquee />
      <section id="catalog" className="pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-gold font-semibold">Streetwear drop</p>
          <h2 className="font-display text-4xl sm:text-5xl mt-3 text-maroon tracking-tight">Oversized Men's Gear</h2>
          <div className="mx-auto mt-4 h-px w-16 bg-gold"></div>
          <p className="mt-4 text-sm sm:text-base text-ink/75 max-w-xl mx-auto">
            Heavy 220 GSM combed cotton. Vibrant front & back graphic prints. Flat <span className="text-maroon font-bold">₹299</span>.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-card border border-border rounded-full p-1.5 overflow-x-auto max-w-full no-scrollbar no-scrollbar-webkit gap-1">
            {MENS_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-4 sm:px-6 py-2.5 text-[11px] sm:text-xs tracking-[0.25em] uppercase rounded-full transition-all ${
                  category === c
                    ? "bg-maroon text-cream shadow-md font-semibold"
                    : "text-ink/70 hover:text-maroon"
                }`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setCategory("Favorites")}
              className={`shrink-0 px-4 sm:px-6 py-2.5 text-[11px] sm:text-xs tracking-[0.25em] uppercase rounded-full transition-all flex items-center gap-1.5 ${
                category === "Favorites"
                  ? "bg-maroon text-cream shadow-md font-semibold"
                  : "text-ink/70 hover:text-maroon"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${category === "Favorites" ? "fill-cream text-cream" : "text-maroon"}`} strokeWidth={2} />
              Wishlist ({favorites.length})
            </button>
          </div>
        </div>

        <MensSearchBar
          query={query}
          setQuery={setQuery}
          sizeFilter={sizeFilter}
          setSizeFilter={setSizeFilter}
          count={filtered.length}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
          {filtered.slice(0, visible).map((p) => (
            <MensProductCard
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
              className="px-8 py-3.5 border border-maroon text-maroon hover:bg-maroon hover:text-cream transition-colors text-xs tracking-[0.25em] uppercase rounded-full font-bold"
            >
              Load More
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20 italic text-lg font-display">
            {category === "Favorites"
              ? "Your wishlist is empty."
              : `No streetwear pieces found for "${query}".`}
          </p>
        )}
      </section>

      <MensFooter />
      <CartFloatingButton count={cart.reduce((a, c) => a + c.quantity, 0)} onClick={() => setIsCartOpen(true)} />
      
      <MensProductDialog
        product={active}
        onClose={() => setActive(null)}
        isFav={active ? favorites.includes(active.id) : false}
        onFavToggle={() => active && toggleFavorite(active.id)}
        onAddToCart={addToCart}
      />

      <MensCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQuantity}
        onRemove={removeFromCart}
        onSubmitLink={buildGroupWhatsAppLink()}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPincode={customerPincode}
        setCustomerPincode={setCustomerPincode}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerAddress={customerAddress}
        setCustomerAddress={setCustomerAddress}
        customerCity={customerCity}
        setCustomerCity={setCustomerCity}
        customerState={customerState}
        setCustomerState={setCustomerState}
        isSubmittingOrder={isSubmittingOrder}
        setIsSubmittingOrder={setIsSubmittingOrder}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}

/* ───────────────────────── HERO / HEADER ───────────────────────── */

function MensHero() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <section className="relative hero-vignette text-cream overflow-hidden">
      {/* Top bar */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-0 sm:h-24 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex w-full sm:w-auto items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-cream/95 ring-2 ring-gold/70 shadow-lg shadow-black/30 font-display text-maroon text-2xl font-bold select-none">J</span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl sm:text-3xl text-gold tracking-wide">Jharva</span>
              <span className="text-[8px] sm:text-[10px] tracking-[0.4em] uppercase text-cream/70 mt-1">Fashion</span>
            </span>
          </Link>

          {/* Mobile User Control */}
          <div className="flex sm:hidden items-center gap-2 text-gold">
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-[9px] tracking-wider uppercase border border-gold px-2.5 py-1 rounded-full hover:bg-gold hover:text-maroon-deep transition font-semibold"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-[9px] tracking-wider uppercase border border-gold/40 px-2.5 py-1.5 rounded-full hover:bg-gold/10 transition"
                >
                  Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                search={{ redirect: "/mens" }}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-gold hover:text-gold-soft border border-gold/40 px-3 py-1 rounded-full hover:bg-gold/10 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Navigation toggling between Womens (₹99) and Mens (₹299) */}
        <div className="flex items-center gap-1.5 border border-gold/40 rounded-full bg-maroon-deep/30 backdrop-blur p-1">
          <Link
            to="/"
            activeProps={{
              className: "px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-full bg-gold text-maroon-deep shadow-sm",
            }}
            inactiveProps={{
              className: "px-4 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full text-cream/80 hover:text-cream transition-colors",
            }}
            activeOptions={{ exact: true }}
          >
            Women's Drop (₹99)
          </Link>
          <Link
            to="/mens"
            activeProps={{
              className: "px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-full bg-gold text-maroon-deep shadow-sm",
            }}
            inactiveProps={{
              className: "px-4 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full text-cream/80 hover:text-cream transition-colors",
            }}
          >
            Men's Drop (₹299)
          </Link>
        </div>

        {/* Desktop User Control */}
        <div className="hidden sm:flex items-center gap-3 text-gold">
          {user ? (
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-[10px] tracking-widest uppercase border border-gold px-3.5 py-1.5 rounded-full hover:bg-gold hover:text-maroon-deep transition font-semibold"
                >
                  Admin Panel
                </Link>
              )}
              <span className="text-xs text-cream/80 max-w-[100px] truncate hidden md:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-[10px] tracking-widest uppercase border border-gold/40 px-3 py-1.5 rounded-full hover:bg-gold/10 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              search={{ redirect: "/mens" }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gold hover:text-gold-soft border border-gold/40 px-4 py-2 rounded-full hover:bg-gold/10 transition"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Headline */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-10 sm:pt-16 pb-20 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 border border-gold/60 rounded-full text-gold text-[11px] sm:text-xs tracking-[0.3em] uppercase animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" /> Drop 01 · Anime Streetwear
        </div>
        <h1 className="mt-8 font-display leading-[0.95] animate-fade-in">
          <span className="block text-5xl sm:text-7xl lg:text-8xl text-cream">Premium</span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl italic text-gold font-medium mt-1">Mens Drop</span>
        </h1>
        <p className="mt-8 text-cream/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Heavyweight anime oversized tees & joggers. Curated for premium comfort. Flat ₹299 drop.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#catalog"
            className="group inline-flex items-center gap-3 gold-gradient text-maroon-deep px-10 py-4 rounded-full text-xs tracking-[0.3em] uppercase font-semibold shadow-lg shadow-black/30 hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Shop now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-3 border border-gold/60 text-gold px-10 py-3.5 rounded-full text-xs tracking-[0.3em] uppercase hover:bg-gold/10 transition-colors"
          >
            Explore Women's Drop (₹99)
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── MARQUEE ───────────────────────── */

function MensMarquee() {
  return (
    <div className="bg-maroon-deep text-gold border-y border-gold/20 overflow-hidden">
      <div className="flex whitespace-nowrap marquee py-3 text-xs tracking-[0.3em] uppercase">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="px-8 shrink-0 flex items-center gap-8">
            Flat ₹299 <span className="text-gold/60">✦</span>
            MRP ₹799 <span className="text-gold/60">✦</span>
            Anime Streetwear <span className="text-gold/60">✦</span>
            220 GSM Cotton <span className="text-gold/60">✦</span>
            Pan-India Delivery <span className="text-gold/60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── SEARCH & FILTER ───────────────────────── */

function MensSearchBar({
  query,
  setQuery,
  sizeFilter,
  setSizeFilter,
  count,
}: {
  query: string;
  setQuery: (s: string) => void;
  sizeFilter: string;
  setSizeFilter: (s: string) => void;
  count: number;
}) {
  const sizes = ["All", "S", "M", "L", "XL", "XXL"];
  return (
    <div className="mt-8 flex flex-col md:flex-row items-center gap-4 md:justify-between w-full border-t border-b border-border py-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:max-w-2xl">
        {/* Search */}
        <div className="flex items-center bg-card border border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 rounded-full px-5 h-12 w-full sm:max-w-sm transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalog or style code..."
            className="bg-transparent outline-none px-3 text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>
        {/* Size Selection */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] tracking-wider text-ink/50 uppercase whitespace-nowrap mr-1">Size:</span>
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSizeFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all uppercase tracking-wider ${
                sizeFilter === s
                  ? "bg-maroon text-cream border-maroon shadow-sm font-semibold"
                  : "bg-card border border-border hover:border-maroon text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] tracking-[0.25em] uppercase text-ink/60 whitespace-nowrap">
        {count} Style{count === 1 ? "" : "s"} Available
      </p>
    </div>
  );
}

/* ───────────────────────── PRODUCT CARD ───────────────────────── */

function MensProductCard({
  product,
  onOpen,
  isFav,
  onFavToggle,
}: {
  product: MensProduct;
  onOpen: () => void;
  isFav: boolean;
  onFavToggle: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const discount = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <button onClick={onOpen} className="block w-full h-full text-left">
          <img
            src={hovered && product.backImage ? product.backImage : product.frontImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </button>
        {/* Badges */}
        <span className="absolute top-3 left-3 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full font-bold bg-gold text-maroon-deep shadow-md">
          {product.category}
        </span>
        <span className="absolute top-3 right-3 bg-maroon text-cream text-[9px] sm:text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 rounded-full font-semibold shadow-md">
          Save {discount}%
        </span>
        <button
          onClick={onFavToggle}
          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-maroon-deep/85 text-gold flex items-center justify-center backdrop-blur hover:scale-110 active:scale-95 transition-transform z-10"
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-gold text-gold" : "text-gold"}`} strokeWidth={1.5} />
        </button>
      </div>

      <button onClick={onOpen} className="block w-full text-left p-3 sm:p-4 flex-1">
        <p className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-gold font-semibold">{product.baseColor} · {product.styleCode}</p>
        <h3 className="font-display text-lg sm:text-xl text-ink mt-1 leading-snug line-clamp-1 font-bold">{product.name}</h3>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="flex flex-col leading-none">
            <span className="text-[9px] tracking-[0.25em] uppercase text-ink/45 line-through">MRP ₹{product.mrp}</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[10px] tracking-[0.2em] uppercase text-maroon/70 font-medium">Offer</span>
              <span className="font-display text-2xl text-maroon font-bold">₹{product.price}</span>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase bg-gold/20 text-maroon-deep px-2 py-1 rounded-full font-semibold whitespace-nowrap">
            Save ₹{product.mrp - product.price}
          </span>
        </div>
      </button>

      <button
        onClick={onOpen}
        className="m-3 sm:m-4 mt-0 inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep text-cream py-3 rounded-full text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold transition-colors"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Enquire / Add Size
      </button>
    </article>
  );
}

/* ───────────────────────── PRODUCT DETAILS DIALOG ───────────────────────── */

function MensProductDialog({
  product,
  onClose,
  isFav,
  onFavToggle,
  onAddToCart,
}: {
  product: MensProduct | null;
  onClose: () => void;
  isFav: boolean;
  onFavToggle: () => void;
  onAddToCart: (product: MensProduct, size: string) => void;
}) {
  if (!product) return null;
  const [selectedSize, setSelectedSize] = useState<string>("L"); // L is default for mens oversized fit
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeImage, setActiveImage] = useState<"front" | "back">("front");

  useEffect(() => {
    setActiveImage("front");
  }, [product]);

  const getWhatsAppLink = () => {
    if (!WHATSAPP_NUMBER) return "#";
    const message = `Hello Jharva Men! I'm interested in the ${product.name} (Code: ${product.styleCode}) in Size ${selectedSize} (₹299). Please share availability.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const discount = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[calc(100vw-1.5rem)] sm:w-full p-0 overflow-hidden bg-card border-border rounded-2xl max-h-[92vh] overflow-y-auto text-ink">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.description}</DialogDescription>
        
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-20 p-2 rounded-full bg-cream/95 hover:bg-cream shadow-md">
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Media Section */}
          <div className="bg-secondary flex flex-col justify-between">
            <div className="aspect-[3/4] md:aspect-auto md:h-[550px] overflow-hidden relative">
              <img
                src={activeImage === "front" ? product.frontImage : product.backImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {/* Back graphic tip overlay */}
              {activeImage === "front" && product.backImage && (
                <div className="absolute bottom-4 left-4 bg-cream/95 border border-border px-3 py-1.5 rounded-md text-[10px] text-muted-foreground pointer-events-none uppercase tracking-wider shadow-sm">
                  ✦ Flip to see back print
                </div>
              )}
            </div>
            {/* Front/Back toggle buttons */}
            {product.backImage && (
              <div className="flex border-t border-border bg-card">
                <button
                  onClick={() => setActiveImage("front")}
                  className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold border-r border-border ${
                    activeImage === "front" ? "text-maroon bg-maroon/5" : "text-ink/60 hover:text-maroon"
                  }`}
                >
                  Front View
                </button>
                <button
                  onClick={() => setActiveImage("back")}
                  className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold ${
                    activeImage === "back" ? "text-maroon bg-maroon/5" : "text-ink/60 hover:text-maroon"
                  }`}
                >
                  Back Print
                </button>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold">
                {product.category} · {product.styleCode}
              </p>
              <h3 className="font-display text-3xl sm:text-4xl mt-2 text-maroon font-bold">{product.name}</h3>
              
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
                    <span className="text-[10px] tracking-[0.25em] bg-maroon text-cream px-2.5 py-1 rounded-full font-semibold">
                      {discount}% OFF
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-maroon-deep font-medium">
                      You save ₹{product.mrp - product.price}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-ink/75">{product.description}</p>
              
              {/* Size Selectors & Guide */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-ink/65">Select Size</p>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] tracking-wider text-maroon hover:underline flex items-center gap-1 uppercase font-semibold"
                  >
                    <Info className="w-3.5 h-3.5" /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const isSizeOutOfStock = product.stock && product.stock[s] !== undefined && product.stock[s] <= 0;
                    return (
                      <button
                        key={s}
                        disabled={isSizeOutOfStock}
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 border rounded-full text-xs transition-all uppercase tracking-wider relative ${
                          selectedSize === s
                            ? "bg-maroon text-cream border-maroon font-bold shadow-md"
                            : isSizeOutOfStock
                              ? "border-muted text-muted-foreground bg-muted/20 cursor-not-allowed line-through opacity-50"
                              : "border-border hover:border-maroon text-ink bg-card"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 gold-gradient text-maroon-deep py-3.5 px-4 rounded-full text-xs tracking-[0.25em] uppercase font-bold shadow-md hover:-translate-y-0.5 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4" /> Enquire
                </a>
                {(() => {
                  const sizeStock = product.stock && selectedSize ? product.stock[selectedSize] : undefined;
                  const isSelectedSizeOutOfStock = sizeStock !== undefined && sizeStock <= 0;
                  const isProductOutOfStock = product.in_stock === false;
                  const isBtnDisabled = isSelectedSizeOutOfStock || isProductOutOfStock;
                  return (
                    <button
                      disabled={isBtnDisabled}
                      onClick={() => {
                        onAddToCart(product, selectedSize);
                        onClose();
                      }}
                      className={`inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-full text-xs tracking-[0.25em] uppercase font-bold shadow-md transition-all ${
                        isBtnDisabled
                          ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                          : "bg-maroon text-cream hover:bg-maroon-deep hover:-translate-y-0.5"
                      }`}
                    >
                      {isProductOutOfStock || isSelectedSizeOutOfStock ? (
                        <>Out of Stock</>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" /> Add to List
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-ink/55 px-1 border-t border-border pt-3">
                <span>Code: {product.styleCode}</span>
                <button onClick={onFavToggle} className="hover:text-maroon flex items-center gap-1.5 transition-colors">
                  <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-maroon text-maroon" : "text-ink/65"}`} strokeWidth={isFav ? 0 : 1.5} />
                  {isFav ? "In Wishlist" : "Add to Wishlist"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Nested Size Guide Dialog */}
        <Dialog open={showSizeGuide} onOpenChange={(o) => !o && setShowSizeGuide(false)}>
          <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-6 bg-card border border-border rounded-xl text-ink z-[60]">
            <DialogTitle className="font-display text-2xl text-maroon uppercase tracking-wide">Oversized Fit Guide</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">Recommended sizes based on standard chest & length measurements.</DialogDescription>
            
            <div className="mt-4 overflow-hidden border border-border rounded-lg">
              <table className="w-full text-left border-collapse text-sm text-ink">
                <thead>
                  <tr className="bg-secondary border-b border-border text-ink/60 text-xs uppercase tracking-wider">
                    <th className="p-3">Size</th>
                    <th className="p-3">Chest Width (inch)</th>
                    <th className="p-3">Length (inch)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-bold text-maroon">S</td>
                    <td className="p-3">42"</td>
                    <td className="p-3">27"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-maroon">M</td>
                    <td className="p-3">44"</td>
                    <td className="p-3">28"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-maroon">L</td>
                    <td className="p-3">46"</td>
                    <td className="p-3">29"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-maroon">XL</td>
                    <td className="p-3">48"</td>
                    <td className="p-3">30"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-maroon">XXL</td>
                    <td className="p-3">50"</td>
                    <td className="p-3">31"</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="mt-4 text-[10px] text-muted-foreground italic leading-relaxed">
              * Note: These are drop-shoulder relaxed shirts. If you prefer a regular fit, order one size down.
            </p>
            
            <button
              onClick={() => setShowSizeGuide(false)}
              className="mt-5 w-full bg-secondary border border-border text-ink py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold hover:bg-border transition-colors"
            >
              Close Guide
            </button>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── FLOATING CART & DRAWER ───────────────────────── */

function CartFloatingButton({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      aria-label="View selection list"
      className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full gold-gradient text-maroon-deep shadow-xl hover:scale-105 transition-transform"
    >
      <span className="relative flex w-9 h-9 items-center justify-center bg-maroon-deep text-gold rounded-full">
        <ShoppingBag className="w-4.5 h-4.5" strokeWidth={2.5} />
        <span className="absolute -top-1.5 -right-1.5 bg-maroon text-cream text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-gold shadow-md animate-bounce">
          {count}
        </span>
      </span>
      <span className="text-xs font-bold tracking-[0.15em] uppercase hidden sm:inline">My List</span>
    </button>
  );
}

function MensCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  onSubmitLink,
  customerName,
  setCustomerName,
  customerPincode,
  setCustomerPincode,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  customerCity,
  setCustomerCity,
  customerState,
  setCustomerState,
  isSubmittingOrder,
  setIsSubmittingOrder,
  onClearCart,
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: Array<{ product: MensProduct; size: string; quantity: number }>;
  onUpdateQty: (id: string, size: string, delta: number) => void;
  onRemove: (id: string, size: string) => void;
  onSubmitLink: string;
  customerName: string;
  setCustomerName: (s: string) => void;
  customerPincode: string;
  setCustomerPincode: (s: string) => void;
  customerPhone: string;
  setCustomerPhone: (s: string) => void;
  customerAddress: string;
  setCustomerAddress: (s: string) => void;
  customerCity: string;
  setCustomerCity: (s: string) => void;
  customerState: string;
  setCustomerState: (s: string) => void;
  isSubmittingOrder: boolean;
  setIsSubmittingOrder: (b: boolean) => void;
  onClearCart: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const [checkoutMethod, setCheckoutMethod] = useState<"whatsapp" | "website">("whatsapp");

  if (!isOpen) return null;

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price || 299) * item.quantity, 0);

  const handlePlaceWebsiteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to place an order.");
      return;
    }
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !customerPincode.trim() ||
      !customerAddress.trim() ||
      !customerCity.trim() ||
      !customerState.trim()
    ) {
      toast.error("Please fill in all shipping details.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(customerPincode.trim())) {
      toast.error("Enter a valid 6-digit pincode.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await placeOrderFn({
        data: {
          items: cart.map((item) => ({
            product_id: item.product.styleCode,
            size: item.size,
            qty: item.quantity,
            image: item.product.frontImage,
          })),
          address: {
            full_name: customerName.trim(),
            phone: customerPhone.trim(),
            pincode: customerPincode.trim(),
            line1: customerAddress.trim(),
            city: customerCity.trim(),
            state: customerState.trim(),
          },
          payment_method: "cod",
        },
      });

      toast.success("Order placed successfully! 🎉");
      onClearCart();
      onClose();
      navigate({ to: "/orders/$id", params: { id: res.orderId } });
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
      
      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in text-ink">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-maroon" />
            <h3 className="font-display text-2xl text-maroon uppercase tracking-wide">Men's List</h3>
            <span className="bg-gold/20 text-maroon-deep text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {totalItems} items
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <ShoppingBag className="w-12 h-12 text-ink/20 stroke-1 mb-4" />
              <p className="font-display text-xl text-ink/75 uppercase tracking-wider">Your list is empty</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
                Browse our anime tees and checkout via website or WhatsApp.
              </p>
            </div>
          ) : (
            <>
              {/* Checkout Method Selector */}
              <div className="flex border border-gold/30 rounded-xl p-1 bg-secondary/35 mb-4">
                <button
                  type="button"
                  onClick={() => setCheckoutMethod("whatsapp")}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                    checkoutMethod === "whatsapp" ? "bg-maroon text-cream shadow-sm font-bold" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  Order on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMethod("website")}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                    checkoutMethod === "website" ? "bg-maroon text-cream shadow-sm font-bold" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  Order on Website (COD)
                </button>
              </div>

              {/* Shipping Details form inside the list */}
              {checkoutMethod === "whatsapp" ? (
                <div className="p-4 bg-secondary/50 border border-border rounded-xl space-y-3 mb-4">
                  <p className="text-[10px] tracking-widest text-maroon uppercase font-bold">Quick Shipping Info (Optional)</p>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter Pincode & City (e.g. 400001, Mumbai)"
                      value={customerPincode}
                      onChange={(e) => setCustomerPincode(e.target.value)}
                      className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                    />
                  </div>
                </div>
              ) : !user ? (
                <div className="p-5 border border-gold/20 rounded-xl bg-gold/5 text-center my-4 space-y-3">
                  <Lock className="w-8 h-8 text-gold mx-auto" />
                  <h4 className="text-sm font-display text-primary uppercase font-bold">Login required</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Please log in to place orders directly on our website, track delivery status, and view order history.
                  </p>
                  <Link
                    to="/login"
                    search={{ redirect: "/mens" }}
                    className="inline-block bg-primary text-primary-foreground py-2 px-6 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-cocoa-deep transition"
                  >
                    Log In / Sign Up
                  </Link>
                </div>
              ) : (
                <form onSubmit={handlePlaceWebsiteOrder} className="p-4 bg-secondary/50 border border-border rounded-xl space-y-3 mb-4">
                  <p className="text-[10px] tracking-widest text-maroon uppercase font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                    Secure Checkout (COD)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="tel"
                        required
                        pattern="^[6-9]\d{9}$"
                        placeholder="Phone Number (10 digit)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Address Line (Street, House No.)"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        pattern="^\d{6}$"
                        placeholder="Pincode"
                        value={customerPincode}
                        onChange={(e) => setCustomerPincode(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value)}
                        className="w-full bg-card border border-border focus:border-maroon rounded-lg px-3 py-2 text-xs text-ink outline-none"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* Items listing */}
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.size}-${idx}`}
                    className="flex gap-4 p-3 border border-border rounded-xl bg-card hover:border-gold/30 transition-colors"
                  >
                    <div className="w-16 h-20 bg-secondary rounded-lg overflow-hidden shrink-0">
                      <img src={item.product.frontImage} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-semibold text-ink line-clamp-1 leading-tight">{item.product.name}</h4>
                          <button
                            onClick={() => onRemove(item.product.id, item.size)}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] tracking-wider text-ink/50 mt-1 uppercase">
                          Code: {item.product.styleCode} · Size: <span className="font-bold text-maroon">{item.size}</span>
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-display text-base text-maroon font-bold">₹{item.product.price * item.quantity}</span>
                        <div className="flex items-center border border-border rounded-full bg-secondary overflow-hidden">
                          <button
                            onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                            className="px-2 py-1 hover:bg-border text-ink transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-ink">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                            className="px-2 py-1 hover:bg-border text-ink transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout info */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-border bg-secondary/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs tracking-wider text-ink/65 uppercase">Est. Total Cost</span>
              <span className="font-display text-3xl text-maroon font-bold">₹{totalPrice}</span>
            </div>

            {checkoutMethod === "whatsapp" ? (
              <a
                href={onSubmitLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 gold-gradient text-maroon-deep py-3.5 rounded-full text-xs tracking-[0.3em] uppercase font-bold hover:shadow-lg transition-transform text-center shadow-md"
              >
                <MessageCircle className="w-4.5 h-4.5" /> Send WhatsApp Enquiry
              </a>
            ) : (
              <button
                type="button"
                disabled={!user || isSubmittingOrder}
                onClick={handlePlaceWebsiteOrder}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-maroon hover:bg-maroon-deep text-cream py-4 rounded-full text-xs tracking-[0.3em] uppercase font-bold shadow-lg disabled:opacity-60 transition-transform"
              >
                <ShieldCheck className="w-4.5 h-4.5" /> {isSubmittingOrder ? "Placing Order..." : "Place Website COD Order"}
              </button>
            )}
            <p className="text-[9px] tracking-widest text-ink/55 text-center mt-3 uppercase">
              {checkoutMethod === "whatsapp" ? "Sends selection details & shipping info to owner" : "Stores order details in database"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */

function MensFooter() {
  const waMsg = encodeURIComponent("Hello Jharva Men! I'd like to know more about your ₹299 anime oversized tees collection.");
  const waLink = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}` : "#";
  
  return (
    <footer className="bg-maroon-deep text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-cream/10">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-cream/5 border border-cream/10 hover:border-gold/40 rounded-xl p-4 transition-all"
        >
          <span className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </span>
          <div>
            <p className="text-[9px] tracking-widest text-gold uppercase font-bold">WhatsApp</p>
            <p className="text-sm font-semibold text-cream mt-0.5">{WHATSAPP_DISPLAY}</p>
          </div>
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-cream/5 border border-cream/10 hover:border-gold/40 rounded-xl p-4 transition-all"
        >
          <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0">
            <Instagram className="w-5 h-5" />
          </span>
          <div>
            <p className="text-[9px] tracking-widest text-gold uppercase font-bold">Instagram</p>
            <p className="text-sm font-semibold text-cream mt-0.5">@{INSTAGRAM_HANDLE}</p>
          </div>
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-4 bg-cream/5 border border-cream/10 hover:border-gold/40 rounded-xl p-4 transition-all"
        >
          <span className="w-10 h-10 rounded-full bg-gold text-maroon-deep flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </span>
          <div>
            <p className="text-[9px] tracking-widest text-gold uppercase font-bold">Email Support</p>
            <p className="text-sm font-semibold text-cream mt-0.5 truncate">{CONTACT_EMAIL}</p>
          </div>
        </a>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-cream ring-2 ring-gold/70 font-display text-maroon text-lg font-bold select-none">J</span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg text-gold tracking-wide">Jharva Men</span>
              <span className="text-[8px] tracking-[0.4em] uppercase text-cream/70 mt-0.5">Fashion</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-cream/75 max-w-xs">
            Premium anime streetwear at flat ₹299. High-quality oversized tees & apparel for absolute styling comfort.
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-[10px] tracking-widest text-gold uppercase">Jharva Atelier · {LOCATION}</p>
          <p className="text-[10px] text-cream/50 mt-2">© {new Date().getFullYear()} Jharva Fashion. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
