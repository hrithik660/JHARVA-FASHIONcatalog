import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Printer } from "lucide-react";
import { adminGetInvoice } from "@/lib/catalog.functions";
import { inr } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin/invoice/$id")({
  head: () => ({
    meta: [{ title: "Print Invoice · Jharva Fashion" }, { name: "robots", content: "noindex" }],
  }),
  component: InvoicePrintPage,
});

function InvoicePrintPage() {
  const { id } = Route.useParams();
  const getInvoiceFn = useServerFn(adminGetInvoice);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-invoice", id],
    queryFn: () => getInvoiceFn({ data: { id } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground bg-background">
        Loading Invoice...
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4 text-center">
        <div>
          <p className="font-display text-2xl text-destructive mb-2">Invoice Not Found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "You might not have admin permissions."}
          </p>
          <Link to="/admin" className="text-primary underline text-sm font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const order = data.order;
  const addr = (order.address as any) ?? {};
  const items = order.order_items ?? [];

  return (
    <div className="min-h-screen bg-neutral-100 py-6 px-4 sm:px-6 md:py-10 no-bg-print">
      {/* Top action bar (hidden during print) */}
      <div className="mx-auto max-w-3xl mb-6 flex items-center justify-between no-print bg-white p-4 rounded-xl shadow-sm border border-border">
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-cocoa-deep transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      {/* Invoice Sheet */}
      <div className="mx-auto max-w-3xl bg-white p-8 sm:p-12 rounded-2xl shadow-luxe border border-border print-no-shadow print-no-border print-p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div>
            <span className="font-display text-primary text-3xl tracking-[0.25em] font-semibold">
              JHARVA
            </span>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              Fashion & Luxury Storefront
            </p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="font-display text-lg text-primary font-bold">RETAIL INVOICE</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Invoice #: {order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Date: {new Date(order.created_at).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border/60">
          <div>
            <h3 className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              From:
            </h3>
            <p className="text-xs font-semibold text-foreground">Jharva Fashion Private Limited</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              128 Luxury Design Boulevard, Colaba
            </p>
            <p className="text-xs text-muted-foreground">Mumbai, Maharashtra - 400005</p>
            <p className="text-xs text-muted-foreground mt-0.5">support@jharva.com</p>
          </div>
          <div>
            <h3 className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              Ship / Bill To:
            </h3>
            <p className="text-xs font-semibold text-foreground">{addr.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{addr.line1}</p>
            <p className="text-xs text-muted-foreground">
              {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Phone: {addr.phone}</p>
          </div>
        </div>

        {/* Details Bar */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-4 rounded-xl my-6 border border-border/40 text-center">
          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">
              Payment Method
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5 uppercase">
              {order.payment_method}
            </p>
          </div>
          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">
              Payment Status
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5 uppercase">
              {order.payment_status}
            </p>
          </div>
          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">
              Order Status
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5 uppercase">{order.status}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="my-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Size</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((it: any) => (
                <tr key={it.id}>
                  <td className="py-3 font-semibold text-foreground">{it.name}</td>
                  <td className="py-3 text-center">{it.size}</td>
                  <td className="py-3 text-center font-mono">{it.qty}</td>
                  <td className="py-3 text-right font-mono">{inr(it.price)}</td>
                  <td className="py-3 text-right font-mono font-semibold">{inr(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Calculations */}
        <div className="flex justify-end mt-8 border-t border-border pt-4">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">{inr(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Discount ({order.discount_code}):</span>
                <span className="font-mono">-{inr(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping Fee:</span>
              <span className="font-mono">
                {order.shipping === 0 ? "FREE" : inr(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between font-display text-sm text-primary font-bold border-t border-border/80 pt-2 mt-1">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-base">{inr(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-border/60 pt-6 text-center text-[0.65rem] text-muted-foreground">
          <p>Thank you for shopping at Jharva Fashion!</p>
          <p className="mt-1">
            This is a computer-generated invoice and does not require a physical signature.
          </p>
        </div>
      </div>
    </div>
  );
}
