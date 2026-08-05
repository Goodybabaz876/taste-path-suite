import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/admin/menu")({ component: AdminMenu });

type MenuItem = {
  id: string; name: string; description: string; price: number;
  category_id: string; image_url: string | null; ingredients: string[];
  prep_time_minutes: number; dietary_tags: string[]; spice_level: number; is_available: boolean;
  kitchen_id: string | null;
};
type Category = { id: string; name: string; slug: string };
type Kitchen = { id: string; name: string; code: string };

const EMPTY: Omit<MenuItem, "id"> = {
  name: "", description: "", price: 0, category_id: "",
  image_url: null, ingredients: [], prep_time_minutes: 20,
  dietary_tags: [], spice_level: 0, is_available: true, kitchen_id: null,
};

function AdminMenu() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<MenuItem, "id">>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const items = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").order("name");
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const [kitchenFilter, setKitchenFilter] = useState<string>("all");

  const kitchens = useQuery({
    queryKey: ["kitchens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kitchens").select("id, name, code").order("sort_order");
      if (error) throw error;
      return data as Kitchen[];
    },
  });

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("id, name, slug").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const openCreate = () => {
    setForm({
      ...EMPTY,
      category_id: cats.data?.[0]?.id ?? "",
      kitchen_id: kitchenFilter !== "all" ? kitchenFilter : (kitchens.data?.[0]?.id ?? null),
    });
    setCreating(true);
    setEditing(null);
  };
  const openEdit = (item: MenuItem) => {
    setForm({ ...item });
    setEditing(item);
    setCreating(false);
  };
  const closeForm = () => { setCreating(false); setEditing(null); };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      return data.publicUrl;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setUploadBusy(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (!form.category_id) return toast.error("Category required");
    if (form.price <= 0) return toast.error("Price must be > 0");
    setBusy(true);
    try {
      if (editing) {
        const { error } = await supabase.from("menu_items").update(form).eq("id", editing.id);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("menu_items").insert(form);
        if (error) throw error;
        toast.success("Item created");
      }
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
      qc.invalidateQueries({ queryKey: ["menu_items"] });
      qc.invalidateQueries({ queryKey: ["admin-menu-count"] });
      closeForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
    qc.invalidateQueries({ queryKey: ["menu_items"] });
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item deleted");
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
    qc.invalidateQueries({ queryKey: ["admin-menu-count"] });
  };

  const catName = (id: string) => cats.data?.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white">Menu Items</h1>
          <p className="mt-1 text-sm text-slate-400">{items.data?.length ?? 0} items across {cats.data?.length ?? 0} categories</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#F2A900] px-4 py-2.5 text-sm font-extrabold text-[#1A2B4C] shadow-lg transition hover:bg-[#E09B00] active:scale-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add item
        </button>
      </div>

      {/* Kitchen filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setKitchenFilter("all")} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${kitchenFilter === "all" ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>All kitchens</button>
        {kitchens.data?.map((k) => (
          <button key={k.id} onClick={() => setKitchenFilter(k.id)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${kitchenFilter === k.id ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>{k.name}</button>
        ))}
      </div>

      {/* Inline form — create or edit */}
      {(creating || editing) && (
        <div className="mb-6 rounded-2xl border border-[#F2A900]/30 bg-[#0E1B31] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-black text-[#F2A900]">{editing ? "Edit item" : "New menu item"}</div>
            <button onClick={closeForm} aria-label="Close form" className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <div className="block">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Category</div>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-[#F2A900] focus:outline-none">
                {cats.data?.map((c) => <option key={c.id} value={c.id} className="bg-[#0E1B31]">{c.name}</option>)}
              </select>
            </div>
            <div className="block">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kitchen</div>
              <select value={form.kitchen_id ?? ""} onChange={(e) => setForm({ ...form, kitchen_id: e.target.value || null })} className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-[#F2A900] focus:outline-none">
                {kitchens.data?.map((k) => <option key={k.id} value={k.id} className="bg-[#0E1B31]">{k.name}</option>)}
              </select>
            </div>
            <Field label="Price (₦)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} />
            <Field label="Prep time (min)" type="number" value={String(form.prep_time_minutes)} onChange={(v) => setForm({ ...form, prep_time_minutes: Number(v) })} />
            <div className="sm:col-span-2">
              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            </div>
            <Field label="Ingredients (comma-separated)" value={form.ingredients.join(", ")} onChange={(v) => setForm({ ...form, ingredients: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
            <Field label="Dietary tags (comma-separated)" value={form.dietary_tags.join(", ")} onChange={(v) => setForm({ ...form, dietary_tags: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
            <div className="block">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Spice level (0-5)</div>
              <input type="range" min={0} max={5} value={form.spice_level} onChange={(e) => setForm({ ...form, spice_level: Number(e.target.value) })} className="mt-2 w-full accent-[#F2A900]" />
              <div className="mt-1 text-xs text-slate-400">Level: {form.spice_level}</div>
            </div>
            {/* Image upload */}
            <div className="block">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Image</div>
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="mt-2 h-20 w-20 rounded-xl object-cover" />
              )}
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-[#F2A900]/50 hover:text-[#F2A900]">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploadBusy ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImage(file);
                      if (url) setForm({ ...form, image_url: url });
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} disabled={busy || uploadBusy} className="flex items-center gap-2 rounded-xl bg-[#F2A900] px-5 py-2.5 text-sm font-extrabold text-[#1A2B4C] shadow-md disabled:opacity-60">
              <Check className="h-4 w-4" aria-hidden="true" /> {busy ? "Saving…" : "Save item"}
            </button>
            <button onClick={closeForm} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {["Item", "Kitchen", "Category", "Price", "Prep", "Spice", "Available", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={8} className="px-4 py-3"><div className="h-5 animate-pulse rounded bg-white/10" /></td>
                </tr>
              ))
            ) : (items.data ?? []).filter((it) => kitchenFilter === "all" || it.kitchen_id === kitchenFilter).map((item) => (
              <tr key={item.id} className={`border-b border-white/5 transition hover:bg-white/5 ${!item.is_available ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />}
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="line-clamp-1 text-[11px] text-slate-500">{item.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{kitchens.data?.find((k) => k.id === item.kitchen_id)?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">{catName(item.category_id)}</td>
                <td className="px-4 py-3 font-bold text-[#F2A900]">{formatNaira(Number(item.price))}</td>
                <td className="px-4 py-3 text-slate-300">{item.prep_time_minutes}m</td>
                <td className="px-4 py-3 text-slate-300">{"🌶️".repeat(item.spice_level) || "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAvailable(item)} aria-label={item.is_available ? "Disable item" : "Enable item"} className="text-slate-400 transition hover:text-[#F2A900]">
                    {item.is_available ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} aria-label={`Delete ${item.name}`} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-slate-600 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/20"
      />
    </label>
  );
}
