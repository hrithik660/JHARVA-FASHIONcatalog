import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// ---------- PUBLIC ----------

export const validateDiscount = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        code: z.string().trim().toUpperCase().min(1).max(40),
        subtotal: z.number().int().min(0),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: dc } = await sb
      .from("discount_codes")
      .select("*")
      .eq("code", data.code)
      .eq("is_active", true)
      .maybeSingle();
    if (!dc) return { valid: false, message: "Invalid or expired code", discount: 0 };
    if (dc.expires_at && new Date(dc.expires_at) < new Date())
      return { valid: false, message: "Invalid or expired code", discount: 0 };
    if (dc.max_uses && dc.uses >= dc.max_uses)
      return { valid: false, message: "Invalid or expired code", discount: 0 };
    if (data.subtotal < dc.min_order)
      return { valid: false, message: `Minimum order ₹${dc.min_order} required`, discount: 0 };
    const discount =
      dc.type === "percent" ? Math.round((data.subtotal * dc.value) / 100) : dc.value;
    return {
      valid: true,
      message: `Code applied: ${dc.type === "percent" ? `${dc.value}% off` : `₹${dc.value} off`}`,
      discount: Math.min(discount, data.subtotal),
      code: dc.code,
    };
  });

// ---------- ADMIN ----------

export const adminListDiscounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { codes: data ?? [] };
  });

const DiscountSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().min(1).max(100000),
  min_order: z.number().int().min(0).max(1_000_000).default(0),
  max_uses: z.number().int().min(1).max(1_000_000).nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const adminUpsertDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => DiscountSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = data.id
      ? await supabase.from("discount_codes").update(data).eq("id", data.id)
      : await supabase.from("discount_codes").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("discount_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
