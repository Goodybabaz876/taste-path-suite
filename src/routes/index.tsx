import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Flame, Leaf, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { formatNaira } from "@/lib/format";
import { dishImage } from "@/lib/dish-image";
import heroImg from "@/assets/hero-midnight.jpg";

export const Route = createFileRoute("/")({
  component: MenuPage,
});

type Category = { id: string; name: string; slug: string; sort_order: number };
type MenuItem = {
  id: string; category_id: string; name: string; description: string;
  price: number; image_url: string | null; ingredients: string[];
  prep_time_minutes: number; dietary_tags: string[]; spice_level: number;
};

const DIETARY = ["vegan", "vegetarian", "gluten-free", "high-protein", "keto"];

function MenuPage() {
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
      if (activeCat !== "all" && it.category_id !== activeCat) return false;
      if (q && !it.name.toLowerCase().includes(q) && !it.description.toLowerCase().includes(q)) return false;
      if (Number(it.price) > maxPrice) return false;
      if (it.prep_time_minutes > maxTime) return false;
      if (tags.length && !tags.every((t) => it.dietary_tags.includes(t))) return false;
      return true;
    });
  }, [items.data, activeCat, search, maxPrice, maxTime, tags]);

  const grouped = useMemo(() => {
    const g = new Map<string, MenuItem[]>();
    for (const it of filtered) {
      const k = it.category_id;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(it);
    }
    return g;
  }, [filtered]);

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 shadow-elegant">
        <img src={heroImg} alt="Nigerian food" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="absolute inset-0 gradient-glow" />
        <div className="relative p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Flame className="h-3 w-3" /> Fresh from the kitchen
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-black uppercase leading-[1.05] sm:text-5xl">
            Order Nigerian food from the comfort of your hostel
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            Jollof, Egusi, Suya and everything in between — cooked to order and delivered fast.
          </p>
        </div>
      </section>

      {/* Search + filter bar */}
      <section className="sticky top-0 z-20 -mx-4 mt-6 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Jollof, Suya, Egusi…"
              className="h-11 w-full rounded-xl border border-border/60 bg-white/5 pl-9 pr-4 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/5 px-4 py-2.5 text-xs font-semibold hover:bg-white/10"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Max price: {formatNaira(maxPrice)}</label>
              <input type="range" min={500} max={10000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-2 w-full accent-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Max prep time: {maxTime} min</label>
              <input type="range" min={5} max={60} step={5} value={maxTime} onChange={(e) => setMaxTime(+e.target.value)} className="mt-2 w-full accent-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Dietary</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DIETARY.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${active ? "border-primary bg-primary/20 text-foreground" : "border-border/60 text-muted-foreground hover:bg-white/5"}`}
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CatTab active={activeCat === "all"} onClick={() => setActiveCat("all")}>All</CatTab>
          {cats.data?.map((c) => (
            <CatTab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>{c.name}</CatTab>
          ))}
        </div>
      </section>

      {/* Results */}
      <div className="mt-8">
        {items.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            No dishes match your filters. Try adjusting your search.
          </div>
        ) : (
          [...grouped.entries()].map(([catId, list]) => {
            const cat = cats.data?.find((c) => c.id === catId);
            return (
              <section key={catId} className="mb-10">
                <h2 className="mb-4 font-display text-2xl font-bold">{cat?.name}</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
        active ? "border-primary bg-primary text-white shadow-glow" : "border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10"
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
      className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[5/3] overflow-hidden">
        <img src={dishImage(item.name, item.image_url)} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {item.spice_level >= 3 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive/80 px-2 py-1 text-[10px] font-bold text-white">
            <Flame className="h-3 w-3" /> Spicy
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold">{item.name}</h3>
          <div className="font-display text-lg font-bold text-accent">{formatNaira(item.price)}</div>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.prep_time_minutes} min</span>
          {item.dietary_tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-border/60 px-2 py-0.5 capitalize">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
