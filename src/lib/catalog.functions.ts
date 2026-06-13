import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mapDbProduct, type DbProductRow } from "./catalog-types";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

const PRODUCT_SELECT =
  "id, sku, name, description, category, gender, price, mrp, image_url, badge, sizes, collection_id, is_published, sort_order";

async function attachStock(sb: any, products: any[]) {
  if (products.length === 0) return products;
  const ids = products.map((p) => p.uuid);
  const { data: stockRows } = await sb
    .from("product_stock")
    .select("product_id, size, qty")
    .in("product_id", ids);
  const byProd: Record<string, Record<string, number>> = {};
  for (const r of stockRows ?? []) {
    byProd[r.product_id] = byProd[r.product_id] ?? {};
    byProd[r.product_id][r.size] = r.qty;
  }
  return products.map((p) => {
    const stockMap = byProd[p.uuid] ?? {};
    const total = Object.values(stockMap).reduce((s: number, q) => s + (q as number), 0);
    return { ...p, stock: stockMap, stock_total: total, in_stock: total > 0 };
  });
}

// ---------- PUBLIC ----------

export const listPublishedProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  const mapped = ((data ?? []) as DbProductRow[]).map(mapDbProduct);
  return { products: await attachStock(sb, mapped) };
});

export const getPublishedProductBySku = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ sku: z.string().min(1).max(60) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("sku", data.sku)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { product: null };
    const mapped = mapDbProduct(row as DbProductRow);
    const [withStock] = await attachStock(sb, [mapped]);
    return { product: withStock };
  });

export const listPublishedCollections = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("collections")
    .select("id, slug, name, emoji, sort_order, is_published")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { collections: data ?? [] };
});

// ---------- ADMIN ----------

export const adminListProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    const mapped = ((data ?? []) as DbProductRow[]).map(mapDbProduct);
    return { products: await attachStock(supabase, mapped) };
  });

export const adminListCollections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("collections")
      .select("id, slug, name, emoji, sort_order, is_published")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { collections: data ?? [] };
  });

const ProductUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  category: z.string().trim().min(1).max(80),
  gender: z.enum(["women", "men", "unisex"]),
  price: z.number().int().min(0).max(1_000_000),
  mrp: z.number().int().min(0).max(1_000_000),
  image_url: z.string().max(1000).optional().default(""),
  badge: z.string().max(40).nullable().optional(),
  sizes: z.array(z.string().min(1).max(8)).max(10).default([]),
  collection_id: z.string().uuid().nullable().optional(),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(100000).default(0),
  stock: z.record(z.string(), z.number().int().min(0).max(100000)).optional(),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ProductUpsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { stock, ...rest } = data;
    const payload = { ...rest, badge: data.badge ?? null };
    let productId = data.id;
    if (data.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = ins.id;
    }
    if (stock && productId) {
      const rows = Object.entries(stock).map(([size, qty]) => ({
        product_id: productId,
        size,
        qty,
      }));
      if (rows.length) {
        const { error } = await supabase
          .from("product_stock")
          .upsert(rows, { onConflict: "product_id,size" });
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true, id: productId };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CollectionUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(120),
  emoji: z.string().max(8).default(""),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(100000).default(0),
});

export const adminUpsertCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CollectionUpsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = data.id
      ? await supabase.from("collections").update(data).eq("id", data.id)
      : await supabase.from("collections").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminTogglePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        table: z.enum(["products", "collections"]),
        id: z.string().uuid(),
        is_published: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from(data.table)
      .update({ is_published: data.is_published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        table: z.enum(["products", "collections"]),
        ids: z.array(z.string().uuid()).min(1).max(500),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    for (let idx = 0; idx < data.ids.length; idx++) {
      const { error } = await supabase
        .from(data.table)
        .update({ sort_order: idx + 1 })
        .eq("id", data.ids[idx]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------- ADMIN: STOCK ----------

export const adminListStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("product_stock")
      .select("id, product_id, size, qty, products(sku, name, image_url)")
      .order("size", { ascending: true });
    if (error) throw new Error(error.message);
    return { stock: data ?? [] };
  });

export const adminUpdateStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), qty: z.number().int().min(0).max(100000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("product_stock")
      .update({ qty: data.qty, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- ADMIN: BULK ACTIONS ----------

export const adminBulkAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        table: z.enum(["products", "collections"]),
        ids: z.array(z.string().uuid()).min(1).max(200),
        action: z.enum(["publish", "unpublish", "delete"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.action === "delete") {
      const { error } = await supabase.from(data.table).delete().in("id", data.ids);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from(data.table)
        .update({ is_published: data.action === "publish" })
        .in("id", data.ids);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------- ADMIN: CUSTOMERS ----------

export const adminListCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const agg: Record<string, { count: number; spent: number }> = {};
    for (const o of orders ?? []) {
      const k = o.user_id as string;
      agg[k] = agg[k] ?? { count: 0, spent: 0 };
      agg[k].count++;
      agg[k].spent += o.total ?? 0;
    }
    return {
      customers: (profiles ?? []).map((p) => ({
        ...p,
        orders_count: agg[p.id]?.count ?? 0,
        total_spent: agg[p.id]?.spent ?? 0,
      })),
    };
  });

// ---------- ADMIN: ANALYTICS ----------

export const adminSalesAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const since = new Date();
    since.setDate(since.getDate() - data.days);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, created_at, status, order_items(name, qty, line_total)")
      .gte("created_at", since.toISOString())
      .neq("status", "cancelled");

    const daily: Record<string, { revenue: number; count: number }> = {};
    const productAgg: Record<string, { qty: number; revenue: number }> = {};
    let totalRevenue = 0;

    for (const o of orders ?? []) {
      const day = new Date(o.created_at as string).toISOString().slice(0, 10);
      daily[day] = daily[day] ?? { revenue: 0, count: 0 };
      daily[day].revenue += o.total ?? 0;
      daily[day].count++;
      totalRevenue += o.total ?? 0;
      for (const it of (o as any).order_items ?? []) {
        productAgg[it.name] = productAgg[it.name] ?? { qty: 0, revenue: 0 };
        productAgg[it.name].qty += it.qty ?? 0;
        productAgg[it.name].revenue += it.line_total ?? 0;
      }
    }

    const series = Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }));
    const topProducts = Object.entries(productAgg)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      totalRevenue,
      orderCount: orders?.length ?? 0,
      series,
      topProducts,
    };
  });

// ---------- ADMIN: ORDERS EXTRAS ----------

export const adminSearchOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        q: z.string().trim().max(80).optional(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    let q = supabase
      .from("orders")
      .select(
        "id, status, payment_method, payment_status, total, address, courier, tracking_number, discount_code, discount, created_at, order_items(name, size, qty)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    const filtered = !data.q
      ? (orders ?? [])
      : (orders ?? []).filter((o: any) => {
          const s = data.q!.toLowerCase();
          return (
            o.id.toLowerCase().includes(s) ||
            (o.address?.full_name ?? "").toLowerCase().includes(s) ||
            (o.address?.phone ?? "").includes(s)
          );
        });
    return { orders: filtered };
  });

export const adminUpdateOrderTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        courier: z.string().trim().max(60).nullable(),
        tracking_number: z.string().trim().max(80).nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("orders")
      .update({ courier: data.courier, tracking_number: data.tracking_number })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminExportOrdersCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id, created_at, status, payment_method, payment_status, subtotal, discount, shipping, total, address, courier, tracking_number, order_items(name, size, qty)",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    const header = [
      "OrderID",
      "Date",
      "Status",
      "Payment",
      "PaymentStatus",
      "Name",
      "Phone",
      "City",
      "State",
      "Pincode",
      "Address",
      "Items",
      "Subtotal",
      "Discount",
      "Shipping",
      "Total",
      "Courier",
      "Tracking",
    ];
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(",")];
    for (const o of orders ?? []) {
      const a: any = o.address ?? {};
      const items = ((o as any).order_items ?? [])
        .map((i: any) => `${i.name} ${i.size}x${i.qty}`)
        .join(" | ");
      lines.push(
        [
          o.id,
          o.created_at,
          o.status,
          o.payment_method,
          o.payment_status,
          a.full_name,
          a.phone,
          a.city,
          a.state,
          a.pincode,
          a.line1,
          items,
          o.subtotal,
          o.discount,
          o.shipping,
          o.total,
          o.courier,
          o.tracking_number,
        ]
          .map(escape)
          .join(","),
      );
    }
    return { csv: lines.join("\n") };
  });

export const adminGetInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { order };
  });
