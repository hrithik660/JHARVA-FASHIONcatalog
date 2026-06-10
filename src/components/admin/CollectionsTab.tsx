import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminListCollections,
  adminUpsertCollection,
  adminDeleteCollection,
  adminReorder,
  adminTogglePublish,
} from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function CollectionsTab() {
  const listFn = useServerFn(adminListCollections);
  const upsertFn = useServerFn(adminUpsertCollection);
  const delFn = useServerFn(adminDeleteCollection);
  const reorderFn = useServerFn(adminReorder);
  const toggleFn = useServerFn(adminTogglePublish);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-collections"] });
    qc.invalidateQueries({ queryKey: ["collections", "published"] });
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const items = [...(data?.collections ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    try {
      await reorderFn({ data: { table: "collections", ids: items.map((c) => c.id) } });
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Reorder failed");
    }
  };

  const togglePublish = async (id: string, next: boolean) => {
    try {
      await toggleFn({ data: { table: "collections", id, is_published: next } });
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"?`)) return;
    try {
      await delFn({ data: { id } });
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
          Collections ({data?.collections?.length ?? 0})
        </h2>
        <Button onClick={() => setCreating(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> New collection
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      ) : !data?.collections?.length ? (
        <p className="text-center text-muted-foreground py-8">No collections yet.</p>
      ) : (
        <div className="space-y-2">
          {data.collections.map((c, idx) => (
            <div
              key={c.id}
              className="bg-card rounded-xl p-3 shadow-card-luxe flex items-center gap-3"
            >
              <span className="w-12 h-12 rounded-full bg-gold-gradient grid place-items-center text-2xl">
                {c.emoji || "✨"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} className="p-2 hover:bg-muted rounded">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => move(idx, 1)} className="p-2 hover:bg-muted rounded">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <Switch checked={c.is_published} onCheckedChange={(v) => togglePublish(c.id, v)} />
                <button onClick={() => setEditing(c)} className="p-2 hover:bg-muted rounded">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => del(c.id, c.name)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CollectionForm
          initial={editing ?? null}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async (payload) => {
            try {
              await upsertFn({ data: payload });
              toast.success(payload.id ? "Updated" : "Created");
              setCreating(false);
              setEditing(null);
              invalidate();
            } catch (e: any) {
              toast.error(e?.message ?? "Save failed");
            }
          }}
        />
      )}
    </div>
  );
}

function CollectionForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: any | null;
  onClose: () => void;
  onSaved: (payload: any) => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    id: initial?.id ?? undefined,
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    emoji: initial?.emoji ?? "",
    is_published: initial?.is_published ?? true,
    sort_order: initial?.sort_order ?? 0,
  });

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{form.id ? "Edit collection" : "New collection"}</SheetTitle>
        </SheetHeader>
        <form
          className="space-y-3 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSaved({
              id: form.id,
              slug: form.slug.trim().toLowerCase(),
              name: form.name.trim(),
              emoji: form.emoji,
              is_published: form.is_published,
              sort_order: Number(form.sort_order),
            });
          }}
        >
          <div>
            <Label>Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="kurti-sets"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emoji / icon</Label>
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                placeholder="🌸"
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <Label>Published</Label>
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => setForm({ ...form, is_published: v })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {form.id ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
