import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Search,
  Download,
  Trash2,
  Printer,
  Check,
  Plus,
  ShoppingBag,
  Edit2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { adminUpdateOrderStatus, adminStats } from "@/lib/admin.functions";
import {
  adminListStock,
  adminUpdateStock,
  adminListCustomers,
  adminSalesAnalytics,
  adminSearchOrders,
  adminUpdateOrderTracking,
  adminExportOrdersCsv,
} from "@/lib/catalog.functions";
import {
  adminListDiscounts,
  adminUpsertDiscount,
  adminDeleteDiscount,
} from "@/lib/discounts.functions";
import { useAuth } from "@/hooks/use-auth";
import { inr } from "@/lib/products";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CollectionsTab } from "@/components/admin/CollectionsTab";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Jharva Fashion" }] }),
  component: AdminPage,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4 text-center">
        <div>
          <div className="w-20 h-20 rounded-full bg-red-100 grid place-items-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-primary mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You don't have admin privileges to access this page.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-cocoa-deep transition"
          >
            Back to store
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-4 flex items-center gap-3">
        <Link to="/" aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-xl text-gold tracking-[0.18em]">ADMIN</h1>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full gap-1 sm:gap-2 mb-6 bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="orders" className="text-xs py-2">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs py-2">
              Products
            </TabsTrigger>
            <TabsTrigger value="collections" className="text-xs py-2">
              Collections
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs py-2">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="customers" className="text-xs py-2">
              Customers
            </TabsTrigger>
            <TabsTrigger value="discounts" className="text-xs py-2">
              Discounts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs py-2">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersPanel />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="collections">
            <CollectionsTab />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryPanel />
          </TabsContent>
          <TabsContent value="customers">
            <CustomersPanel />
          </TabsContent>
          <TabsContent value="discounts">
            <DiscountsPanel />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OrdersPanel() {
  const [filter, setFilter] = useState<(typeof STATUSES)[number] | "all">("all");
  const [search, setSearch] = useState("");
  const searchFn = useServerFn(adminSearchOrders);
  const statsFn = useServerFn(adminStats);
  const updateFn = useServerFn(adminUpdateOrderStatus);
  const trackingFn = useServerFn(adminUpdateOrderTracking);
  const exportFn = useServerFn(adminExportOrdersCsv);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter, search],
    queryFn: () =>
      searchFn({ data: { q: search || undefined, status: filter === "all" ? undefined : filter } }),
  });
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsFn(),
  });

  const updateStatus = async (id: string, status: (typeof STATUSES)[number]) => {
    try {
      await updateFn({ data: { id, status } });
      toast.success(`Status → ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  };

  const markPaid = async (id: string) => {
    try {
      await updateFn({ data: { id, payment_status: "paid" } });
      toast.success("Marked paid");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportFn();
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Today's orders" value={stats?.todayOrders ?? 0} />
        <Stat label="Today's revenue" value={inr(stats?.todayRevenue ?? 0)} />
        <Stat label="Pending" value={stats?.pending ?? 0} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
          />
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 border border-border bg-card rounded-xl px-4 py-2 text-sm hover:bg-muted transition font-medium"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {s}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      ) : !data?.orders?.length ? (
        <p className="text-center text-muted-foreground py-8">No orders found</p>
      ) : (
        <div className="space-y-4">
          {data.orders.map((o: any) => (
            <OrderCard
              key={o.id}
              order={o}
              updateStatus={updateStatus}
              markPaid={markPaid}
              trackingFn={trackingFn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  updateStatus,
  markPaid,
  trackingFn,
}: {
  order: any;
  updateStatus: (id: string, status: any) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
  trackingFn: (data: {
    data: { id: string; courier: string | null; tracking_number: string | null };
  }) => Promise<any>;
}) {
  const [courier, setCourier] = useState(order.courier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);

  const buildWhatsAppUpdateLink = () => {
    const phone = order.address?.phone || "";
    if (!phone) return "#";
    const name = order.address?.full_name || "Customer";
    const status = order.status?.toUpperCase() || "PENDING";
    const tracking = order.tracking_number
      ? `Tracking Details:\nCourier: ${order.courier}\nTracking ID: ${order.tracking_number}`
      : "We will share courier tracking details shortly.";

    const message = `Hello ${name}! This is Jharva Fashion. Your order (ID: ${order.id.slice(0, 8)}) status has been updated to ${status}.\n\n${tracking}\n\nThank you for shopping with us! ✨`;
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const saveTracking = async () => {
    setSavingTracking(true);
    try {
      await trackingFn({
        data: {
          id: order.id,
          courier: courier.trim() || null,
          tracking_number: trackingNumber.trim() || null,
        },
      });
      toast.success("Tracking information updated");
      setIsEditingTracking(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update tracking");
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-card-luxe border border-gold/10">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3 border-b border-border/40 pb-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">ID: {order.id}</p>
          <p className="text-base font-semibold mt-1">
            {order.address?.full_name} · {order.address?.phone}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.address?.line1}, {order.address?.city}, {order.address?.state} -{" "}
            {order.address?.pincode}
          </p>
        </div>
        <div className="text-right sm:text-right">
          <p className="font-display text-xl text-primary font-bold">{inr(order.total)}</p>
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground mt-0.5">
            {order.payment_method} · {order.payment_status}
          </p>
          {order.discount > 0 && (
            <p className="text-xs text-green-600 font-semibold mt-0.5">
              Code: {order.discount_code} (-{inr(order.discount)})
            </p>
          )}
        </div>
      </div>

      <ul className="text-xs text-muted-foreground mb-4 space-y-1">
        {(order.order_items ?? []).map((it: any, idx: number) => (
          <li key={idx} className="flex justify-between">
            <span>
              • {it.name} ({it.size})
            </span>
            <span>× {it.qty}</span>
          </li>
        ))}
      </ul>

      {/* Tracking Section */}
      <div className="mb-4 bg-muted/40 p-3 rounded-xl border border-border/40">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-semibold">
            Delivery & Tracking
          </span>
          {!isEditingTracking && (
            <button
              onClick={() => setIsEditingTracking(true)}
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:text-gold"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        {isEditingTracking ? (
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <input
              type="text"
              placeholder="Courier Name"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs outline-none focus:border-primary flex-1"
            />
            <input
              type="text"
              placeholder="Tracking ID"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs outline-none focus:border-primary flex-1"
            />
            <div className="flex gap-1.5">
              <button
                onClick={saveTracking}
                disabled={savingTracking}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-cocoa-deep"
              >
                {savingTracking ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditingTracking(false)}
                className="border border-border bg-card px-3 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs mt-1">
            {order.courier ? (
              <>
                <strong className="text-foreground">{order.courier}</strong>:{" "}
                {order.tracking_number}
              </>
            ) : (
              <span className="text-muted-foreground italic">No tracking info added yet</span>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={order.status}
          onChange={(e) => updateStatus(order.id, e.target.value as any)}
          className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none font-semibold focus:border-primary"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
        {order.payment_status !== "paid" && (
          <button
            onClick={() => markPaid(order.id)}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Mark Paid
          </button>
        )}
        <a
          href={buildWhatsAppUpdateLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs border border-[#128C7E] bg-[#25D366] text-white hover:bg-[#128C7E] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ml-auto sm:ml-0 shadow-sm"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" /> WhatsApp Update
        </a>
        <a
          href={`/admin/invoice/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs border border-border bg-card hover:bg-muted font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
        >
          <Printer className="w-3.5 h-3.5" /> Invoice
        </a>
        <span className="text-[0.7rem] text-muted-foreground ml-auto">
          {new Date(order.created_at).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

function InventoryPanel() {
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const listFn = useServerFn(adminListStock);
  const updateFn = useServerFn(adminUpdateStock);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stock"],
    queryFn: () => listFn(),
  });

  const filteredStock = (data?.stock ?? []).filter((item: any) => {
    if (lowStockOnly) return item.qty < 5;
    return true;
  });

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card-luxe border border-gold/10">
      <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
        <h2 className="font-display text-lg text-primary">Size-wise Stock Levels</h2>
        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-border focus:ring-primary h-4 w-4"
          />
          Low Stock Only (&lt; 5)
        </label>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading stock...</p>
      ) : filteredStock.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No inventory items matched</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
                <th className="py-2.5">Product</th>
                <th className="py-2.5 text-center">Size</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right pr-4">Edit Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredStock.map((item: any) => (
                <InventoryRow key={item.id} item={item} updateFn={updateFn} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InventoryRow({ item, updateFn }: { item: any; updateFn: any }) {
  const [qty, setQty] = useState(item.qty);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleSave = async () => {
    if (qty === item.qty) return;
    setSaving(true);
    try {
      await updateFn({ data: { id: item.id, qty } });
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["admin-stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to update stock");
      setQty(item.qty);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="py-3 flex items-center gap-3">
        <img
          src={item.products?.image_url || "/placeholder.jpg"}
          alt=""
          className="w-10 h-12 object-cover rounded-md border border-border shrink-0 bg-muted"
        />
        <div>
          <p className="font-semibold text-sm">{item.products?.name}</p>
          <p className="font-mono text-[0.65rem] text-muted-foreground uppercase">
            {item.products?.sku}
          </p>
        </div>
      </td>
      <td className="py-3 text-center font-display text-sm font-semibold">{item.size}</td>
      <td className="py-3 text-center">
        <span
          className={`px-2.5 py-1 rounded-full font-bold text-xs ${item.qty < 5 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}
        >
          {item.qty}
        </span>
      </td>
      <td className="py-3 text-right pr-4">
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-16 px-2 py-1 border border-border bg-background rounded-md text-xs text-center font-semibold outline-none focus:border-primary"
          />
          <button
            onClick={handleSave}
            disabled={saving || qty === item.qty}
            className="p-1 text-primary hover:text-gold transition disabled:opacity-40"
            title="Save changes"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CustomersPanel() {
  const listFn = useServerFn(adminListCustomers);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => listFn(),
  });

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card-luxe border border-gold/10">
      <div className="mb-4 border-b border-border/40 pb-3">
        <h2 className="font-display text-lg text-primary">Registered Customers</h2>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading customers...</p>
      ) : !data?.customers?.length ? (
        <p className="text-center text-muted-foreground py-8">No registered customers</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Phone</th>
                <th className="py-2.5 text-center">Orders Placed</th>
                <th className="py-2.5 text-right pr-4">LTV (Spent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3">
                    <p className="font-semibold text-sm">{c.full_name || "Guest User"}</p>
                    <p className="font-mono text-[0.65rem] text-muted-foreground mt-0.5">{c.id}</p>
                  </td>
                  <td className="py-3 font-mono text-sm">{c.phone || "-"}</td>
                  <td className="py-3 text-center text-sm font-semibold">{c.orders_count}</td>
                  <td className="py-3 text-right pr-4 font-display text-sm text-primary font-bold">
                    {inr(c.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DiscountsPanel() {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const listFn = useServerFn(adminListDiscounts);
  const upsertFn = useServerFn(adminUpsertDiscount);
  const deleteFn = useServerFn(adminDeleteDiscount);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: () => listFn(),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || value <= 0) return;
    setSubmitting(true);
    try {
      await upsertFn({
        data: {
          code: code.trim().toUpperCase(),
          type,
          value,
          min_order: minOrder,
          max_uses: maxUses,
          expires_at: expiresAt || undefined,
          is_active: true,
        },
      });
      toast.success("Discount code created!");
      setCode("");
      setValue(0);
      setMinOrder(0);
      setMaxUses(null);
      setExpiresAt("");
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Discount code deleted");
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete discount");
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Create coupon form */}
      <div className="bg-card rounded-2xl p-5 shadow-card-luxe border border-gold/10 md:col-span-1 h-fit">
        <h2 className="font-display text-lg text-primary mb-4 border-b border-border/40 pb-2 flex items-center gap-1.5">
          <Plus className="w-5 h-5 text-gold" /> Create Coupon
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
              Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
              Type
            </label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold outline-none focus:border-primary"
            >
              <option value="percent">Percentage Off (%)</option>
              <option value="flat">Flat Amount Off (₹)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
                Value
              </label>
              <input
                type="number"
                required
                min="1"
                value={value || ""}
                onChange={(e) => setValue(Math.max(1, parseInt(e.target.value) || 0))}
                placeholder={type === "percent" ? "e.g. 20" : "e.g. 200"}
                className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
                Min Order (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minOrder || ""}
                onChange={(e) => setMinOrder(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="e.g. 999"
                className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
              Max Uses (Optional)
            </label>
            <input
              type="number"
              min="1"
              value={maxUses || ""}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || null)}
              placeholder="Unlimited"
              className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
              Expires At (Optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg uppercase tracking-widest text-xs font-bold hover:bg-cocoa-deep transition disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Coupon"}
          </button>
        </form>
      </div>

      {/* Coupons List */}
      <div className="bg-card rounded-2xl p-5 shadow-card-luxe border border-gold/10 md:col-span-2">
        <h2 className="font-display text-lg text-primary mb-4 border-b border-border/40 pb-2">
          Active Discount Codes
        </h2>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading coupons...</p>
        ) : !data?.codes?.length ? (
          <p className="text-center text-muted-foreground py-8">No coupon codes active</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[0.65rem] uppercase tracking-widest text-muted-foreground font-bold">
                  <th className="py-2">Code</th>
                  <th className="py-2">Reduction</th>
                  <th className="py-2 text-center">Min Order</th>
                  <th className="py-2 text-center">Uses</th>
                  <th className="py-2 text-center">Expiry</th>
                  <th className="py-2 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.codes.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-sm text-foreground">{c.code}</td>
                    <td className="py-3">
                      {c.type === "percent" ? `${c.value}% Off` : `${inr(c.value)} Off`}
                    </td>
                    <td className="py-3 text-center">{inr(c.min_order)}</td>
                    <td className="py-3 text-center font-mono">
                      {c.uses} / {c.max_uses || "∞"}
                    </td>
                    <td className="py-3 text-center text-muted-foreground">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-destructive p-1 hover:bg-destructive/10 rounded-md transition"
                        title="Delete code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const [days, setDays] = useState(30);
  const analyticsFn = useServerFn(adminSalesAnalytics);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: () => analyticsFn({ data: { days } }),
  });

  const totalOrders = data?.orderCount ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h2 className="font-display text-lg text-primary">Sales & Revenues Report</h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none font-semibold focus:border-primary"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-16">Loading metrics...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total Orders" value={totalOrders} />
            <Stat label="Total Sales Value" value={inr(totalRevenue)} />
            <Stat label="Average Order Value" value={inr(aov)} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-card-luxe border border-gold/10 md:col-span-2">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
                Daily Sales Value
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.series ?? []}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 9 }}
                      stroke="#888888"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      stroke="#888888"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <RechartsTooltip
                      formatter={(v: any) => [`₹${v}`, "Revenue"]}
                      contentStyle={{
                        background: "#F5F2EB",
                        borderRadius: "8px",
                        border: "1px solid #DFD9CE",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3E2723" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-card-luxe border border-gold/10 md:col-span-1">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
                Top-Selling Pieces
              </h3>
              <ul className="divide-y divide-border/40 text-xs">
                {(data?.topProducts ?? []).map((p: any, idx: number) => (
                  <li key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                        {p.qty} items sold
                      </p>
                    </div>
                    <span className="font-display font-semibold text-primary">
                      {inr(p.revenue)}
                    </span>
                  </li>
                ))}
                {!data?.topProducts?.length && (
                  <p className="text-center text-muted-foreground py-8">
                    No items sold in this period
                  </p>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card-luxe border border-gold/10">
      <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="font-display text-2xl text-primary mt-1 font-bold">{value}</p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest whitespace-nowrap font-semibold ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"
      }`}
    >
      {children}
    </button>
  );
}
