import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Circle, Truck, Package, Home } from "lucide-react";
import { getMyOrder } from "@/lib/orders.functions";
import { inr } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [{ title: "Order detail · Jharva Fashion" }, { name: "robots", content: "noindex" }],
  }),
  component: OrderDetailPage,
});

const STEPS = [
  { key: "pending", label: "Placed", Icon: CheckCircle2 },
  { key: "confirmed", label: "Confirmed", Icon: Package },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: Home },
] as const;

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getMyOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fn({ data: { id } }),
  });

  if (isLoading)
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>
    );
  const order: any = data?.order;
  if (!order) return <div className="min-h-screen grid place-items-center">Order not found</div>;

  const addr = order.address ?? {};
  const items = order.order_items ?? [];
  const activeIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === order.status),
  );
  const isCancelled = order.status === "cancelled";

  const summaryLines = items
    .map((it: any) => `• ${it.name} (${it.size}) × ${it.qty} = ${inr(it.line_total)}`)
    .join("\n");
  const waMsg = encodeURIComponent(
    `Hi Jharva Fashion!\n\nI just placed an order:\n\nOrder ID: ${order.id.slice(0, 8)}\nTotal: ${inr(order.total)} (${order.payment_method.toUpperCase()})\n\nItems:\n${summaryLines}\n\nShip to:\n${addr.full_name}\n${addr.line1}, ${addr.city}, ${addr.state} - ${addr.pincode}\n📞 ${addr.phone}\n\nPlease confirm. Thanks!`,
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-4 flex items-center gap-3">
        <Link to="/orders" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-xl text-gold tracking-[0.18em]">ORDER</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="bg-card rounded-2xl p-6 shadow-card-luxe text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-2" />
          <p className="font-display text-2xl text-primary">Order confirmed!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Order ID:{" "}
            <span className="font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Delivered in <strong>4–7 working days</strong>
          </p>
          {order.payment_method === "cod" && order.payment_status !== "paid" && (
            <div className="mt-4 inline-block bg-gold/15 text-cocoa-deep px-4 py-2 rounded-full text-sm font-semibold">
              Pay {inr(order.total)} in cash on delivery
            </div>
          )}
        </div>

        {/* Status timeline */}
        {!isCancelled ? (
          <div className="bg-card rounded-2xl p-5 shadow-card-luxe">
            <h2 className="font-display text-lg text-primary mb-5">Order Status</h2>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" style={{ left: "calc(12.5%)", right: "calc(12.5%)" }} />
              <div
                className="absolute top-4 h-0.5 bg-primary transition-all duration-500"
                style={{
                  left: "calc(12.5%)",
                  width: `${(activeIdx / (STEPS.length - 1)) * 75}%`,
                }}
              />
              <ol className="grid grid-cols-4 gap-1 relative z-10">
                {STEPS.map((s, i) => {
                  const done = i <= activeIdx;
                  const active = i === activeIdx;
                  const Icon = s.Icon;
                  return (
                    <li key={s.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full grid place-items-center transition-all duration-300 ring-2 ${
                          done
                            ? active
                              ? "bg-primary text-primary-foreground ring-primary/30 scale-110"
                              : "bg-primary text-primary-foreground ring-primary/20"
                            : "bg-muted text-muted-foreground ring-transparent"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`mt-2 text-[0.65rem] uppercase tracking-widest leading-tight ${
                          done ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Tracking info if available */}
            {(order.courier || order.tracking_number) && (
              <div className="mt-5 pt-4 border-t border-border/40 bg-muted/30 rounded-xl p-3">
                <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Tracking Details
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {order.courier && <span>{order.courier}: </span>}
                  <span className="font-mono text-primary">{order.tracking_number}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 text-center">
            <p className="font-display text-xl text-destructive mb-1">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">
              This order has been cancelled. Refund (if any) will be processed within 5–7 days.
            </p>
          </div>
        )}

        <a
          href={`https://wa.me/917304417295?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center bg-[#25D366] text-white py-3.5 rounded-full uppercase tracking-[0.18em] text-xs font-bold shadow-luxe hover:opacity-90"
        >
          Confirm on WhatsApp
        </a>

        <div className="bg-card rounded-2xl p-5 shadow-card-luxe">
          <h2 className="font-display text-lg text-primary mb-3">Items</h2>
          <ul className="divide-y divide-border">
            {items.map((it: any) => (
              <li key={it.id} className="py-3 flex gap-3">
                {it.image && (
                  <img src={it.image} alt={it.name} className="w-14 h-16 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size {it.size} · Qty {it.qty}
                  </p>
                </div>
                <span className="font-semibold">{inr(it.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-border space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{inr(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "FREE" : inr(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-display text-lg text-primary pt-2 border-t border-border">
              <span>Total</span>
              <span>{inr(order.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {order.payment_method.toUpperCase()} · {order.payment_status}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card-luxe">
          <h2 className="font-display text-lg text-primary mb-2">Shipping to</h2>
          <p className="text-sm font-semibold">{addr.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
          </p>
          <p className="text-sm text-muted-foreground">📞 {addr.phone}</p>
        </div>

        <Link
          to="/"
          className="block text-center border border-primary text-primary py-3 rounded-full uppercase tracking-[0.18em] text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
