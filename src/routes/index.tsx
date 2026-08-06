import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Flame, Leaf, Filter, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatNaira } from "@/lib/format";
import { dishImage, heroBanner } from "@/lib/dish-image";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { kitchen?: string } =>
    typeof search.kitchen === "string" ? { kitchen: search.kitchen } : {},
  component: MenuPage,
});

type Category = { id: string; name: string; slug: string; sort_order: number };
type MenuItem = {
  id: string; category_id: string; name: string; description: string;
  price: number; image_url: string | null; ingredients: string[];
  prep_time_minutes: number; dietary_tags: string[]; spice_level: number;
  kitchen_id: string | null;
};
type Kitchen = { id: string; name: string; code: string };

const DIETARY = ["vegan", "vegetarian", "gluten-free", "high-protein", "keto"];

function MenuPage() {
  const { kitchen } = Route.useSearch();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [maxTime, setMaxTime] = useState(60);
  const [tags, setTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const kitchens = useQuery({
    queryKey: ["kitchens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kitchens").select("id, name, code").order("sort_order");
      if (error) throw error;
      return data as Kitchen[];
    },
  });

  const activeKitchen = kitchens.data?.find((k) => k.code === kitchen) ?? null;

  const items = useQuery({
    queryKey: ["menu_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").eq("is_available", true);
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const filtered = useMemo(() => {
    if (!items.data) return [];
    const q = search.trim().toLowerCase();
    return items.data.filter((it) => {
      if (activeKitchen && it.kitchen_id !== activeKitchen.id) return false;
      if (activeCat !== "all" && it.category_id !== activeCat) return false;
      if (q && !it.name.toLowerCase().includes(q) && !it.description.toLowerCase().includes(q)) return false;
      if (Number(it.price) > maxPrice) return false;
      if (it.prep_time_minutes > maxTime) return false;
      if (tags.length && !tags.every((t) => it.dietary_tags.includes(t))) return false;
      return true;
    });
  }, [items.data, activeKitchen, activeCat, search, maxPrice, maxTime, tags]);

  const grouped = useMemo(() => {
    const g = new Map<string, MenuItem[]>();
    const seen = new Set<string>();
    for (const it of filtered) {
      if (!activeKitchen) {
        const key = `${it.category_id}|${it.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      const k = it.category_id;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(it);
    }
    return g;
  }, [filtered, activeKitchen]);

  return (
    <AppShell>
      {/* Hero Section: Deep Navy background with bold gold typography & vibrant visible food banner */}
      <section className="relative min-h-[380px] sm:min-h-[440px] overflow-hidden rounded-3xl border border-[#E2E1D0] bg-[#0E1B31] shadow-2xl flex items-center">
        {/* Food Background Image - Bright, clear, and visible */}
        <img
          src={heroBanner}
          alt="Fresh delicious food feast"
          className="absolute inset-0 h-full w-full object-cover object-center sm:object-right-center brightness-110 contrast-105 scale-105"
        />
        
        {/* Soft scrim overlay to keep text legible while letting food show vividly */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E1B31]/95 via-[#0E1B31]/75 sm:via-[#0E1B31]/60 to-black/30" />
        
        <div className="relative z-10 p-8 md:p-12 lg:p-14 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F2A900]/60 bg-[#0E1B31]/90 px-4 py-1.5 text-xs font-black text-[#F2A900] shadow-lg backdrop-blur-md">
            <Flame className="h-4 w-4 text-[#F2A900]" /> {activeKitchen ? activeKitchen.name : "Campus Fresh Delivery"}
          </div>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-[#F2A900] sm:text-5xl lg:text-6xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            Order food from the comfort of your hostel
          </h1>
          <p className="mt-3 max-w-xl text-base font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            Jollof, Egusi, Suya and everything in between — cooked to order and delivered hot & fast.
          </p>
        </div>
      </section>

      {/* Search + filter bar */}
      <section className="sticky top-0 z-20 -mx-4 mt-6 border-b border-[#E2E1D0] bg-[#FAFAED]/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Jollof, Suya, Egusi…"
              aria-label="Search menu items"
              className="h-11 w-full rounded-xl border border-[#E2E1D0] bg-white pl-10 pr-4 text-sm text-[#1A2B4C] placeholder-slate-400 shadow-sm focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            className="flex items-center gap-2 rounded-xl border border-[#E2E1D0] bg-white px-4 py-2.5 text-xs font-bold text-[#1A2B4C] shadow-sm hover:bg-[#F3F2DF] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2A900]"
          >
            <Filter className="h-4 w-4 text-[#1A2B4C]" aria-hidden="true" /> Filters
          </button>
        </div>

        {showFilters && (
          <div id="filter-panel" className="mt-4 grid gap-4 rounded-2xl border border-[#E2E1D0] bg-white p-5 shadow-card sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-[#1A2B4C]">Max price: <span className="text-[#DC2626] font-black">{formatNaira(maxPrice)}</span></label>
              <input type="range" min={500} max={10000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-2 w-full accent-[#F2A900]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1A2B4C]">Max prep time: {maxTime} min</label>
              <input type="range" min={5} max={60} step={5} value={maxTime} onChange={(e) => setMaxTime(+e.target.value)} className="mt-2 w-full accent-[#F2A900]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1A2B4C]">Dietary</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DIETARY.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize transition ${
                        active ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-[#E2E1D0] bg-white text-[#4A5568] hover:bg-[#F3F2DF]"
                      }`}
                    >
                      <Leaf className="mr-1 inline h-3 w-3" />{t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div role="tablist" aria-label="Menu categories" className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CatTab active={activeCat === "all"} onClick={() => setActiveCat("all")}>All Menu</CatTab>
          {cats.data?.map((c) => (
            <CatTab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>{c.name}</CatTab>
          ))}
        </div>
      </section>

      {/* Dish Results */}
      <div className="mt-8">
        {items.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-white border border-[#E2E1D0]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E1D0] bg-white p-10 text-center text-sm font-medium text-[#4A5568] shadow-sm">
            No dishes match your search filters. Try clearing your search.
          </div>
        ) : (
          [...grouped.entries()].map(([catId, list]) => {
            const cat = cats.data?.find((c) => c.id === catId);
            return (
              <section key={catId} className="mb-12">
                <h2 className="mb-5 font-display text-2xl font-black text-[#1A2B4C] border-b border-[#E2E1D0] pb-2">{cat?.name}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((it) => <DishCard key={it.id} item={it} />)}
                </div>
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

function CatTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A900] ${
        active
          ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C] shadow-md"
          : "border-[#E2E1D0] bg-white text-[#4A5568] hover:bg-[#F3F2DF] hover:text-[#1A2B4C]"
      }`}
    >
      {children}
    </button>
  );
}

function DishCard({ item }: { item: MenuItem }) {
  return (
    <Link
      to="/dish/$id"
      params={{ id: item.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E1D0] bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#F2A900]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F3F2DF]">
        <img
          src={dishImage(item.name, item.image_url)}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {item.spice_level >= 3 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
            <Flame className="h-3 w-3" /> Spicy
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-black text-[#1A2B4C] group-hover:text-[#F2A900] transition-colors">{item.name}</h3>
          {/* Bright red/amber accent highlight for actual meal prices */}
          <div className="font-display text-lg font-black text-[#DC2626] bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100 shrink-0">
            {formatNaira(item.price)}
          </div>
        </div>

        <p className="mt-2 flex-1 line-clamp-2 text-xs font-medium text-[#4A5568]">{item.description}</p>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#E2E1D0]">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#4A5568]">
            <Clock className="h-3.5 w-3.5 text-[#F2A900]" />
            <span>{item.prep_time_minutes} min</span>
          </div>

          {/* Golden Harvest order button with dark text */}
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2A900] px-3.5 py-2 text-xs font-extrabold text-[#1A2B4C] shadow-sm group-hover:bg-[#E09B00] transition active:scale-95">
            <ShoppingBag className="h-3.5 w-3.5 text-[#1A2B4C]" /> Order
          </div>
        </div>
      </div>
    </Link>
  );
}
