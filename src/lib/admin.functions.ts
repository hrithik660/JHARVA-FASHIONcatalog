import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
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
        "id, status, payment_method, payment_status, total, address, created_at, order_items(name, size, qty)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
        payment_status: z.enum(["unpaid", "paid"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.payment_status) patch.payment_status = data.payment_status;

    const { error } = await supabase
      .from("orders")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data: today } = await supabase
      .from("orders")
      .select("total, status")
      .gte("created_at", since.toISOString());

    const todayOrders = today?.length ?? 0;
    const todayRevenue = (today ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
    const pending = (today ?? []).filter((o) => o.status === "pending").length;

    return { todayOrders, todayRevenue, pending };
  });
