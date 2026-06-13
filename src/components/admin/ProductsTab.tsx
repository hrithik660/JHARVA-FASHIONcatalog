import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminListProducts,
  adminListCollections,
  adminDeleteProduct,
  adminReorder,
  adminTogglePublish,
} from "@/lib/catalog.functions";
import { inr } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProductForm } from "./ProductForm";

export function ProductsTab() {
  const listFn = useServerFn(adminListProducts);
  const listCollFn = useServerFn(adminListCollections);
  const delFn = useServerFn(adminDeleteProduct);
  const reorderFn = useServerFn(adminReorder);
  const toggleFn = useServerFn(adminTogglePublish);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listFn(),
  });
  const { data: collData } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => listCollFn(),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products", "published"] });
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const items = [...(data?.products ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    try {
      await reorderFn({ data: { table: "products", ids: items.map((p) => p.uuid) } });
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Reorder failed");
    }
  };

  const togglePublish = async (uuid: string, next: boolean) => {
    try {
      await toggleFn({ data: { table: "products", id: uuid, is_published: next } });
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  };

  const del = async (uuid: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await delFn({ data: { id: uuid } });
      toast.success("Deleted");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-primary">
          Products ({data?.products?.length ?? 0})
        </h2>
        <Button onClick={() => setCreating(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> New product
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      ) : !data?.products?.length ? (
        <p className="text-center text-muted-foreground py-8">No products yet.</p>
      ) : (
        <div className="space-y-2">
          {data.products.map((p, idx) => (
            <div
              key={p.uuid}
              className="bg-card rounded-xl p-3 shadow-card-luxe flex items-center gap-3"
            >
              <img
                src={p.image}
                alt={p.name}
                className="w-14 h-14 rounded-lg object-cover bg-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{p.name}</p>
                  {p.stock_total !== undefined && (p.stock_total <= 0 ? (
                    <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded">
                      Out of Stock
                    </span>
                  ) : p.stock_total < 5 ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Low Stock ({p.stock_total})
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      In Stock ({p.stock_total})
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.sku} · {p.category} · {inr(p.price)}
                  {p.mrp > p.price && <span className="line-through ml-1">{inr(p.mrp)}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  className="p-2 hover:bg-muted rounded"
                  aria-label="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  className="p-2 hover:bg-muted rounded"
                  aria-label="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <Switch
                  checked={p.is_published ?? true}
                  onCheckedChange={(v) => togglePublish(p.uuid, v)}
                />
                <button
                  onClick={() => setEditing(p)}
                  className="p-2 hover:bg-muted rounded"
                  aria-label="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => del(p.uuid, p.name)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductForm
          collections={collData?.collections ?? []}
          initial={editing ?? null}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

export default ProductsTab;
