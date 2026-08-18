import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChefHat, Flame, LogOut, Search, ShieldCheck, ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { formatNaira } from "@/lib/format";
import { dishImage } from "@/lib/dish-image";
import { AVAILABILITY_META, AVAILABILITY_STATUSES, toStatus, type AvailabilityStatus } from "@/lib/availability";

export const Route = createFileRoute("/kitchen-admin")({ component: KitchenAdminPage });

type Row = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  prep_time_minutes: number;
  is_available: boolean;
  availability_status: string;
  kitchen_id: string | null;
};

function KitchenAdminPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isSuper, kitchenId, kitchenName, loading } = useAdmin();

  const [pickedKitchen, setPickedKitchen] = useState<string>("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | AvailabilityStatus>("all");

  // Kitchen admins are locked to their own kitchen. Super admins may pick one.
  const activeKitchen = isSuper ? pickedKitchen : (kitchenId ?? "");

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Access denied — kitchen administrators only");
      nav({ to: "/" });
    }
  }, [isAdmin, loading, nav]);

  const kitchens = useQuery({
    queryKey: ["kitchens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kitchens").select("id, name, code").order("sort_order");
      if (error) throw error;
      return data as { id: string; name: string; code: string }[];
    },
  });

  const items = useQuery({
    queryKey: ["kitchen-admin-items", activeKitchen],
    enabled: !!activeKitchen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, image_url, prep_time_minutes, is_available, availability_status, kitchen_id")
        .eq("kitchen_id", activeKitchen)
        .order("name");
      if (error) throw error;
      return data as Row[];
    },
  });

  const setStatus = async (row: Row, status: AvailabilityStatus) => {
    const { error } = await supabase.from("menu_items").update({ availability_status: status }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(`${row.name} → ${AVAILABILITY_META[status].short}`);
    qc.invalidateQueries({ queryKey: ["kitchen-admin-items"] });
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
    qc.invalidateQueries({ queryKey: ["menu_items"] });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/auth", replace: true });
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (items.data ?? []).filter((r) => {
      const s = toStatus(r.availability_status, r.is_available);
      if (filter !== "all" && s !== filter) return false;
      if (term && !r.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items.data, q, filter]);

  const counts = useMemo(() => {
    const c = { available: 0, pending: 0, unavailable: 0 } as Record<AvailabilityStatus, number>;
    for (const r of items.data ?? []) c[toStatus(r.availability_status, r.is_available)] += 1;
    return c;
  }, [items.data]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#06091A]">
        <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-[#F2A900]">
          <Flame className="h-6 w-6 text-[#1A2B4C]" />
        </div>
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg,#06091A 0%,#0A0F1E 60%,#0D1526 100%)" }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04060F]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#F2A900,#F97316)" }}>
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-black text-[#F2A900]">
              {isSuper ? "Kitchen Admin Console" : `${kitchenName ?? "Kitchen"} Admin`}
            </div>
            <div className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-500">{user?.email}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isSuper && (
              <Link to="/admin" className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-white/5">
                <ShieldCheck className="h-3.5 w-3.5" /> Super admin
              </Link>
            )}
            <Link to="/" className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-white/5 sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" /> Web app
            </Link>
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <h1 className="font-display text-2xl font-black sm:text-3xl">Meal availability</h1>
        <p className="mt-1 text-sm text-slate-400">
          Turn meals on for sale, mark them as pending (coming soon) or hide them entirely. Changes appear instantly in the web app.
        </p>

        {isSuper && (
          <div className="mt-5 flex flex-wrap gap-2">
            {kitchens.data?.map((k) => (
              <button
                key={k.id}
                onClick={() => setPickedKitchen(k.id)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${activeKitchen === k.id ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
              >
                {k.name}
              </button>
            ))}
          </div>
        )}

        {!activeKitchen ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">
            {isSuper ? "Pick a kitchen above to manage its meals." : "No kitchen is assigned to your account yet."}
          </div>
        ) : (
          <>
            {/* Status summary */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {AVAILABILITY_STATUSES.map((s) => (
                <div key={s} className="rounded-2xl border p-4" style={{ borderColor: AVAILABILITY_META[s].border, background: AVAILABILITY_META[s].bg }}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/70">{AVAILABILITY_META[s].short}</div>
                  <div className="mt-1 font-display text-2xl font-black text-white">{counts[s]}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search meals…"
                  aria-label="Search meals"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-[#F2A900] focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
                {AVAILABILITY_STATUSES.map((s) => (
                  <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{AVAILABILITY_META[s].short}</FilterChip>
                ))}
              </div>
            </div>

            {/* Meals */}
            <div className="mt-5 space-y-3">
              {items.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)
              ) : rows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">No meals match this view.</div>
              ) : (
                rows.map((r) => {
                  const status = toStatus(r.availability_status, r.is_available);
                  const meta = AVAILABILITY_META[status];
                  return (
                    <div key={r.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center">
                      <img src={dishImage(r.name, r.image_url)} alt={r.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate font-display text-base font-black text-white">{r.name}</div>
                          <span className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white" style={{ borderColor: meta.border, background: meta.bg }}>
                            {meta.short}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-slate-400">
                          <span className="text-[#F2A900]">{formatNaira(Number(r.price))}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.prep_time_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {AVAILABILITY_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(r, s)}
                            aria-pressed={status === s}
                            className={`rounded-xl border px-3 py-2 text-[11px] font-black transition ${
                              status === s ? "text-white" : "border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                            }`}
                            style={status === s ? { borderColor: meta.border, background: meta.bg } : undefined}
                            title={AVAILABILITY_META[s].hint}
                          >
                            {AVAILABILITY_META[s].short}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${active ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
    >
      {children}
    </button>
  );
}
