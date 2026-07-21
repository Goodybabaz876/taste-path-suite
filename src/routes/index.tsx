import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, MapPin, ShoppingBag, Heart, Star, Clock, Flame,
  Pizza, Fish, Coffee, Beef, Salad, IceCream, Sandwich, Soup,
  Bell, User, Home, Compass, Ticket, ChevronRight, Plus, Minus,
  BadgeCheck, TrendingUp, Zap, Truck,
} from "lucide-react";

import hero from "@/assets/hero-midnight.jpg";
import sushi from "@/assets/dish-sushi.jpg";
import pizza from "@/assets/dish-pizza.jpg";
import bowl from "@/assets/dish-bowl.jpg";
import ramen from "@/assets/dish-ramen.jpg";
import dessert from "@/assets/dish-dessert.jpg";
import tacos from "@/assets/dish-tacos.jpg";

export const Route = createFileRoute("/")({
  component: SavorFlowApp,
});

const CATEGORIES = [
  { icon: Flame, label: "Trending" },
  { icon: Pizza, label: "Pizza" },
  { icon: Fish, label: "Sushi" },
  { icon: Beef, label: "Steak" },
  { icon: Salad, label: "Healthy" },
  { icon: Soup, label: "Ramen" },
  { icon: Sandwich, label: "Burgers" },
  { icon: IceCream, label: "Dessert" },
  { icon: Coffee, label: "Coffee" },
];

const RESTAURANTS = [
  { name: "Nova Sushi Bar", cuisine: "Japanese • Omakase", rating: 4.9, time: "20–30", fee: "Free", img: sushi, promo: "20% OFF", tags: ["Michelin", "Chef's Pick"] },
  { name: "Forno Nero", cuisine: "Italian • Wood Fired", rating: 4.8, time: "25–35", fee: "$1.99", img: pizza, promo: null, tags: ["Popular"] },
  { name: "Aloha Poke Co.", cuisine: "Hawaiian • Healthy", rating: 4.7, time: "15–25", fee: "Free", img: bowl, promo: "New", tags: ["Vegan"] },
  { name: "Kotori Ramen House", cuisine: "Japanese • Ramen", rating: 4.9, time: "20–30", fee: "$0.99", img: ramen, promo: null, tags: ["Late Night"] },
  { name: "Cacao & Co.", cuisine: "Desserts • Artisan", rating: 4.8, time: "15–20", fee: "Free", img: dessert, promo: "2‑for‑1", tags: ["Sweet"] },
  { name: "El Fuego Cantina", cuisine: "Mexican • Street", rating: 4.7, time: "20–30", fee: "$1.49", img: tacos, promo: null, tags: ["Spicy"] },
];

const TRENDING_DISHES = [
  { name: "Truffle Wagyu Burger", restaurant: "Nova Grill", price: 24, img: hero },
  { name: "Salmon Nigiri Platter", restaurant: "Nova Sushi", price: 32, img: sushi },
  { name: "Tonkotsu Ramen", restaurant: "Kotori", price: 18, img: ramen },
  { name: "Molten Lava Cake", restaurant: "Cacao & Co.", price: 12, img: dessert },
];

function SavorFlowApp() {
  const [cartCount, setCartCount] = useState(3);
  const [activeCat, setActiveCat] = useState("Trending");

  return (
    <div className="min-h-screen text-foreground">
      <Sidebar />
      <div className="lg:pl-72">
        <TopBar cartCount={cartCount} />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-10">
          <Hero />
          <CategoryRail active={activeCat} onChange={setActiveCat} />
          <PromoStrip />
          <RestaurantGrid onAdd={() => setCartCount((c) => c + 1)} />
          <TrendingDishes onAdd={() => setCartCount((c) => c + 1)} />
          <HowItWorks />
          <Footer />
        </main>
      </div>
      <CartFab count={cartCount} />
    </div>
  );
}

/* ------------------------------- Sidebar ------------------------------- */

function Sidebar() {
  const nav = [
    { icon: Home, label: "Home", active: true },
    { icon: Compass, label: "Discover" },
    { icon: Flame, label: "Trending" },
    { icon: Ticket, label: "Offers" },
    { icon: Heart, label: "Favorites" },
    { icon: ShoppingBag, label: "Orders" },
  ];
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border/60 gradient-surface lg:flex">
      <div className="flex items-center gap-3 px-6 pb-6 pt-8">
        <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-hero shadow-glow">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-display text-xl font-extrabold tracking-tight">SavorFlow</div>
          <div className="text-xs text-muted-foreground">Order · Track · Enjoy</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        <div className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Explore</div>
        {nav.map((n) => (
          <button
            key={n.label}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              n.active
                ? "bg-primary/20 text-foreground shadow-[inset_0_0_0_1px] shadow-primary/40"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
            {n.active && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
          </button>
        ))}

        <div className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Cuisines</div>
        {["Japanese", "Italian", "Mexican", "American", "Healthy", "Desserts"].map((c) => (
          <button key={c} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent/80" />
            {c}
          </button>
        ))}
      </nav>

      <div className="m-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-accent" /> SavorFlow+
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Free delivery on all orders. Try 30 days free.</p>
        <button className="mt-3 w-full rounded-lg gradient-hero py-2 text-xs font-semibold text-white shadow-glow">
          Upgrade
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- TopBar -------------------------------- */

function TopBar({ cartCount }: { cartCount: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 glass">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <button className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Deliver to</span>
          <span className="font-semibold">1247 Market St</span>
        </button>

        <div className="relative ml-2 hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search restaurants, dishes, cuisines…"
            className="h-10 w-full rounded-xl border border-border/60 bg-white/5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
          <button className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/5 hover:bg-white/10">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white/5 py-1.5 pl-1.5 pr-3 hover:bg-white/10">
            <span className="grid h-7 w-7 place-items-center rounded-lg gradient-hero text-xs font-bold text-white">M</span>
            <span className="hidden text-xs font-semibold sm:inline">Maya</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- Hero --------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 shadow-elegant">
      <img src={hero} alt="Featured dish" width={1600} height={1200} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
      <div className="absolute inset-0 gradient-glow" />
      <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Flame className="h-3 w-3" /> Tonight's Picks
          </div>
          <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] sm:text-5xl md:text-6xl">
            The city's best kitchens,{" "}
            <span className="text-gradient">delivered in 30.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Discover thousands of dishes from award‑winning restaurants. Track every step, from
            the kitchen to your door.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-xl gradient-hero px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02]">
              Order now
            </button>
            <button className="rounded-xl border border-border/60 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white/10">
              Browse restaurants
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <Stat icon={Truck} label="Free delivery" value="over $25" />
            <Stat icon={Clock} label="Avg delivery" value="27 min" />
            <Stat icon={BadgeCheck} label="Restaurants" value="2,400+" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Category rail ---------------------------- */

function CategoryRail({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Browse categories</h2>
        <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">See all →</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => {
          const isActive = c.label === active;
          return (
            <button
              key={c.label}
              onClick={() => onChange(c.label)}
              className={`flex min-w-[110px] shrink-0 flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                isActive
                  ? "border-primary/60 bg-primary/15 shadow-glow"
                  : "border-border/60 bg-white/5 hover:border-primary/40 hover:bg-white/10"
              }`}
            >
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${isActive ? "gradient-hero" : "bg-white/5"}`}>
                <c.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-accent"}`} />
              </div>
              <span className="text-xs font-semibold">{c.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------ Promo strip ----------------------------- */

function PromoStrip() {
  const promos = [
    { title: "50% off first order", sub: "Use code WELCOME50", tone: "gradient-hero", icon: Ticket },
    { title: "Free delivery week", sub: "Every day this week", tone: "bg-gradient-to-br from-accent/30 to-primary/30", icon: Truck },
    { title: "Late night eats", sub: "Open past midnight", tone: "bg-gradient-to-br from-primary/40 to-fuchsia-500/30", icon: TrendingUp },
  ];
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {promos.map((p) => (
        <div key={p.title} className={`relative overflow-hidden rounded-2xl p-5 ${p.tone} border border-white/10 shadow-card`}>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <p.icon className="h-6 w-6 text-white/90" />
          <div className="mt-3 font-display text-lg font-bold text-white">{p.title}</div>
          <div className="text-xs text-white/70">{p.sub}</div>
        </div>
      ))}
    </section>
  );
}

/* --------------------------- Restaurant grid ---------------------------- */

function RestaurantGrid({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Popular near you</h2>
          <p className="text-sm text-muted-foreground">Top‑rated kitchens delivering to Market St.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          {["All", "Fastest", "Top rated", "Free delivery"].map((f, i) => (
            <button key={f} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i === 0 ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {RESTAURANTS.map((r) => (
          <article key={r.name} className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition hover:-translate-y-1 hover:shadow-glow">
            <div className="relative aspect-[5/3] overflow-hidden">
              <img src={r.img} alt={r.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {r.promo && (
                <span className="absolute left-3 top-3 rounded-full gradient-hero px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow">
                  {r.promo}
                </span>
              )}
              <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur hover:bg-black/60">
                <Heart className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-xs backdrop-blur">
                <Star className="h-3 w-3 fill-warning text-yellow-400" />
                <span className="font-semibold">{r.rating}</span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold">{r.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{r.cuisine}</p>
                </div>
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time} min</span>
                <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" /> {r.fee}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <span key={t} className="rounded-full border border-border/60 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
                ))}
              </div>

              <button
                onClick={onAdd}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/15 py-2.5 text-xs font-semibold text-foreground transition hover:bg-primary/25"
              >
                <Plus className="h-3.5 w-3.5" /> Quick add
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- Trending dishes --------------------------- */

function TrendingDishes({ onAdd }: { onAdd: () => void }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Trending dishes</h2>
          <p className="text-sm text-muted-foreground">What everyone's ordering tonight.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRENDING_DISHES.map((d) => {
          const q = qty[d.name] ?? 0;
          return (
            <div key={d.name} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
              <div className="relative aspect-square">
                <img src={d.img} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="font-display text-base font-bold leading-tight">{d.name}</div>
                  <div className="text-[11px] text-white/70">{d.restaurant}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="font-display text-lg font-bold text-accent">${d.price}</div>
                {q === 0 ? (
                  <button
                    onClick={() => { setQty({ ...qty, [d.name]: 1 }); onAdd(); }}
                    className="rounded-lg gradient-hero px-3 py-1.5 text-xs font-semibold text-white shadow-glow"
                  >
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/5 p-1">
                    <button onClick={() => setQty({ ...qty, [d.name]: Math.max(0, q - 1) })} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-4 text-center text-xs font-semibold">{q}</span>
                    <button onClick={() => { setQty({ ...qty, [d.name]: q + 1 }); onAdd(); }} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------ How it works ---------------------------- */

function HowItWorks() {
  const steps = [
    { icon: Search, title: "Discover", text: "Browse restaurants and menus tailored to your taste." },
    { icon: ShoppingBag, title: "Order", text: "Add dishes, customize, and check out in seconds." },
    { icon: Truck, title: "Track", text: "Watch your order live from kitchen to doorstep." },
    { icon: Star, title: "Enjoy", text: "Rate your meal and earn rewards on every order." },
  ];
  return (
    <section className="mt-16 rounded-3xl border border-border/60 gradient-surface p-8 md:p-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold">A smoother way to eat out, in.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Four taps between craving and dinner.</p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl border border-border/60 bg-background/40 p-5">
            <div className="absolute -top-3 left-5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">STEP {i + 1}</div>
            <s.icon className="h-6 w-6 text-accent" />
            <div className="mt-3 font-display text-lg font-bold">{s.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Footer ------------------------------- */

function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 pt-10 text-sm text-muted-foreground">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-hero"><Flame className="h-4 w-4 text-white" /></div>
            <span className="font-display text-lg font-extrabold text-foreground">SavorFlow</span>
          </div>
          <p className="mt-3 text-xs">The premium way to order from the city's best kitchens.</p>
        </div>
        {[
          { h: "Company", l: ["About", "Careers", "Press", "Blog"] },
          { h: "For restaurants", l: ["Partner with us", "Merchant portal", "Analytics", "Marketing"] },
          { h: "Support", l: ["Help center", "Contact", "Terms", "Privacy"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{c.h}</div>
            <ul className="space-y-2 text-xs">
              {c.l.map((i) => <li key={i} className="hover:text-foreground cursor-pointer">{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 py-6 text-xs sm:flex-row">
        <span>© {new Date().getFullYear()} SavorFlow, Inc.</span>
        <span>Crafted with care · San Francisco</span>
      </div>
    </footer>
  );
}

/* ---------------------------- Floating cart ---------------------------- */

function CartFab({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <button className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl gradient-hero px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-105">
      <ShoppingBag className="h-4 w-4" />
      <span>View cart</span>
      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/25 px-2 text-xs font-bold">{count}</span>
    </button>
  );
}
