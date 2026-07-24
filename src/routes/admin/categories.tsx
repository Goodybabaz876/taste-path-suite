import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

type Category = { id: string; name: string; slug: string; sort_order: number };

const EMPTY = { name: "", slug: "", sort_order: 0 };

function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const cats = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setForm({ name: "", slug: "", sort_order: (cats.data?.length ?? 0) + 1 });
    setCreating(true); setEditing(null);
  };
  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, sort_order: c.sort_order });
    setEditing(c); setCreating(false);
  };
  const closeForm = () => { setCreating(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const slug = form.slug || autoSlug(form.name);
    setBusy(true);
    try {
      if (editing) {
        const { error } = await supabase.from("menu_categories").update({ ...form, slug }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("menu_categories").insert({ ...form, slug });
        if (error) throw error;
        toast.success("Category created");
      }
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Menu items in this category will also be deleted.`)) return;
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white">Categories</h1>
          <p className="mt-1 text-sm text-slate-400">{cats.data?.length ?? 0} categories · sort order controls the menu tab sequence</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#F2A900] px-4 py-2.5 text-sm font-extrabold text-[#1A2B4C] shadow-lg transition hover:bg-[#E09B00] active:scale-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add category
        </button>
      </div>

      {/* Inline form */}
      {(creating || editing) && (
        <div className="mb-6 rounded-2xl border border-[#F2A900]/30 bg-[#0E1B31] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-black text-[#F2A900]">{editing ? "Edit category" : "New category"}</div>
            <button onClick={closeForm} aria-label="Close form" className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v, slug: autoSlug(v) })}
            />
            <Field
              label="Slug"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
            />
            <Field
              label="Sort order"
              type="number"
              value={String(form.sort_order)}
              onChange={(v) => setForm({ ...form, sort_order: Number(v) })}
            />
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#F2A900] px-5 py-2.5 text-sm font-extrabold text-[#1A2B4C] shadow-md disabled:opacity-60">
              <Check className="h-4 w-4" aria-hidden="true" /> {busy ? "Saving…" : "Save"}
            </button>
            <button onClick={closeForm} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {cats.isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
            ))
          : (cats.data ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-white/20">
                <GripVertical className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">{c.name}</div>
                  <div className="text-xs text-slate-500">/{c.slug} · sort: {c.sort_order}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    aria-label={`Edit ${c.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id, c.name)}
                    aria-label={`Delete ${c.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
        className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/20"
      />
    </label>
  );
}
