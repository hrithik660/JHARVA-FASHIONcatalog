import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, VALID_SIZES } from "@/lib/constants";
import { PRODUCTS } from "@/data/products";
import { MENS_PRODUCTS } from "@/data/mens_products";

const AddressSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone"),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  line1: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
});

const PlaceOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1).max(60),
        size: z.string().min(1).max(8),
        qty: z.number().int().min(1).max(10),
        image: z.string().max(1000).optional(),
      }),
    )
    .min(1)
    .max(20),
  address: AddressSchema,
  payment_method: z.literal("cod"),
  notes: z.string().max(500).optional(),
  discount_code: z.string().trim().toUpperCase().max(40).optional(),
});

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
}

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PlaceOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const skus = Array.from(new Set(data.items.map((i) => i.product_id.toLowerCase())));
    const sb = publicClient();
    const { data: rows, error: prodErr } = await sb
      .from("products")
      .select("sku, name, price, is_published")
      .in("sku", skus);
    if (prodErr) throw new Error(prodErr.message);

    const priceMap = new Map(
      (rows ?? [])
        .filter((r) => r.is_published)
        .map((r) => [r.sku.toLowerCase(), { name: r.name, price: r.price }]),
    );

    // Build fallback map from local static files
    const staticProducts = [...PRODUCTS, ...MENS_PRODUCTS];
    const staticMap = new Map(
      staticProducts.map((p) => [p.styleCode.toLowerCase(), { name: p.name, price: p.price }]),
    );

    let subtotal = 0;
    const lines = data.items.map((i) => {
      const skuLower = i.product_id.toLowerCase();
      const p = priceMap.get(skuLower) || staticMap.get(skuLower);
      if (!p) throw new Error(`Unavailable product: ${i.product_id}`);
      if (!VALID_SIZES.has(i.size)) throw new Error(`Invalid size: ${i.size}`);
      const line_total = p.price * i.qty;
      subtotal += line_total;
      return {
        product_id: skuLower,
        name: p.name,
        image: i.image ?? null,
        size: i.size,
        qty: i.qty,
        price: p.price,
        line_total,
      };
    });

    // Validate discount code (if any)
    let discount = 0;
    let discountCode: string | null = null;
    if (data.discount_code) {
      const code = data.discount_code.toUpperCase();
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      const clientForDiscount = hasServiceRole ? supabaseAdmin : supabase;
      const { data: dc } = await clientForDiscount
        .from("discount_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (!dc) throw new Error("Invalid or inactive code");
      if (dc.expires_at && new Date(dc.expires_at) < new Date()) throw new Error("Code expired");
      if (dc.max_uses && dc.uses >= dc.max_uses) throw new Error("Code usage limit reached");
      if (subtotal < dc.min_order) throw new Error(`Minimum order ₹${dc.min_order} required`);
      discount = dc.type === "percent" ? Math.round((subtotal * dc.value) / 100) : dc.value;
      discount = Math.min(discount, subtotal);
      discountCode = dc.code;
    }

    const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal - discount + shipping;

    // Decrement stock atomically (skip if service role key is missing)
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (hasServiceRole) {
      try {
        const { error: stockErr } = await supabaseAdmin.rpc("decrement_stock", {
          items: data.items.map((i) => ({ product_sku: i.product_id.toLowerCase(), size: i.size, qty: i.qty })),
        });
        if (stockErr) {
          if (stockErr.message.includes("stock") || stockErr.message.includes("out of")) {
            throw new Error(stockErr.message);
          }
          console.warn("Stock decrement RPC warning:", stockErr.message);
        }
      } catch (err: any) {
        if (err.message?.includes("stock")) throw err;
        console.warn("Skipping stock decrement error:", err.message);
      }
    } else {
      console.warn("Skipping stock decrement because SUPABASE_SERVICE_ROLE_KEY is not defined.");
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        payment_method: data.payment_method,
        payment_status: "unpaid",
        subtotal,
        shipping,
        total,
        discount,
        discount_code: discountCode,
        address: data.address,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      // Roll back stock on order failure (only if service key is present)
      if (hasServiceRole) {
        try {
          await supabaseAdmin.rpc("decrement_stock", {
            items: data.items.map((i) => ({ product_sku: i.product_id.toLowerCase(), size: i.size, qty: -i.qty })),
          });
        } catch (rollbackErr) {
          console.error("Stock rollback failed — manual correction needed:", rollbackErr);
        }
      }
      throw new Error(orderErr?.message ?? "Failed to create order");
    }

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));

    if (itemsErr) throw new Error(itemsErr.message);

    if (discountCode && hasServiceRole) {
      try {
        await (supabaseAdmin as any).rpc("increment_discount_uses", { discount_code: discountCode });
      } catch (incErr) {
        console.error("Failed to increment discount uses for", discountCode, incErr);
      }
    }

    return { orderId: order.id, subtotal, shipping, discount, total };
  });

export const listMyOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, payment_method, payment_status, total, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const getMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { order };
  });

export const getMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    return { isAdmin: roles.includes("admin"), roles };
  });
