import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { listMyOrders } from "@/lib/orders.functions";
import { inr } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My orders · Jharva Fashion" }] }),
  component: OrdersPage,
});

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-blue-100 text-blue-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

function OrdersPage() {
  const fn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-4 flex items-center gap-3">
        <Link to="/" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-xl text-gold tracking-[0.18em]">MY ORDERS</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : !data?.orders?.length ? (
          <div className="text-center py-16">
            <p className="font-display text-xl text-primary mb-2">No orders yet</p>
            <Link to="/" className="text-gold underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.orders.map((o) => (
              <li key={o.id}>
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="block bg-card rounded-2xl p-4 shadow-card-luxe hover:shadow-luxe transition"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[0.65rem] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold ${STATUS_COLOR[o.status] ?? "bg-muted"}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="font-display text-lg text-primary">{inr(o.total)}</span>
                  </div>
                  <div className="mt-1 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    {o.payment_method.toUpperCase()} · {o.payment_status}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
