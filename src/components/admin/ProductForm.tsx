import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminUpsertProduct } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Collection = { id: string; name: string; emoji: string | null };

export function ProductForm({
  initial,
  collections,
  onClose,
  onSaved,
}: {
  initial: any | null;
  collections: Collection[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const upsertFn = useServerFn(adminUpsertProduct);
  const [form, setForm] = useState({
    id: initial?.uuid ?? undefined,
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    gender: (initial?.gender as "women" | "men" | "unisex") ?? "women",
    price: initial?.price ?? 0,
    mrp: initial?.mrp ?? 0,
    image_url: initial?.image && !initial.image.startsWith("data:") ? initial.image : "",
    badge: initial?.badge ?? "",
    sizes: (initial?.sizes ?? ["S", "M", "L", "XL"]).join(","),
    collection_id: initial?.collection_id ?? "",
    is_published: initial?.is_published ?? true,
    sort_order: initial?.sort_order ?? 0,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertFn({
        data: {
          id: form.id,
          sku: form.sku.trim(),
          name: form.name.trim(),
          description: form.description,
          category: form.category.trim(),
          gender: form.gender,
          price: Number(form.price),
          mrp: Number(form.mrp),
          image_url: form.image_url,
          badge: form.badge?.trim() ? form.badge.trim() : null,
          sizes: form.sizes
            .split(",")
            .map((s: string) => s.trim().toUpperCase())
            .filter(Boolean),
          collection_id: form.collection_id || null,
          is_published: form.is_published,
          sort_order: Number(form.sort_order),
        },
      });
      toast.success(form.id ? "Product updated" : "Product created");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{form.id ? "Edit product" : "New product"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="jh-301"
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

          <div>
            <Label>Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Kurti Sets"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <select
                className="w-full border border-input rounded-md h-10 px-3 bg-background"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
              >
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price ₹</Label>
              <Input
                required
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>MRP ₹</Label>
              <Input
                required
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Sizes (comma separated)</Label>
            <Input
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              placeholder="S,M,L,XL"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Badge (optional)</Label>
              <Input
                value={form.badge ?? ""}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="Bestseller"
              />
            </div>
            <div>
              <Label>Collection</Label>
              <select
                className="w-full border border-input rounded-md h-10 px-3 bg-background"
                value={form.collection_id}
                onChange={(e) => setForm({ ...form, collection_id: e.target.value })}
              >
                <option value="">— None —</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Image</Label>
            {form.image_url && (
              <img src={form.image_url} alt="" className="w-24 h-24 object-cover rounded-lg mb-2" />
            )}
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f);
              }}
            />
            <Input
              className="mt-2"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="Or paste image URL"
            />
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
            <Button type="submit" disabled={saving || uploading} className="flex-1">
              {saving ? "Saving…" : form.id ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
