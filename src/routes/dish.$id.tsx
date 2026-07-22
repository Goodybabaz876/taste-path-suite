import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, Flame, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatNaira } from "@/lib/format";
import { dishImage } from "@/lib/dish-image";
import { useCart, type CartCustomizations } from "@/lib/cart";

export const Route = createFileRoute("/dish/$id")({
  component: DishDetail,
});

const SIZE_MULT = { Regular: 1, Large: 1.4, Family: 2.2 } as const;
const SPICE = ["Mild", "Medium", "Hot", "Extra Hot"] as const;
const PROTEINS = ["Chicken", "Beef", "Fish", "Goat", "None"];
const SIDES = ["None", "Fried Plantain", "Eba", "Fufu", "Moi Moi"];

function DishDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  const [size, setSize] = useState<keyof typeof SIZE_MULT>("Regular");
  const [protein, setProtein] = useState<string>("Chicken");
  const [spice, setSpice] = useState<(typeof SPICE)[number]>("Medium");
  const [side, setSide] = useState<string>("None");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const q = useQuery({
    queryKey: ["dish", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const unitPrice = useMemo(() => {
    if (!q.data) return 0;
    const sideAdd = side !== "None" ? 500 : 0;
    const proteinAdd = protein === "Goat" ? 1000 : protein === "Fish" ? 500 : 0;
    return Math.round(Number(q.data.price) * SIZE_MULT[size] + sideAdd + proteinAdd);
  }, [q.data, size, side, protein]);

  if (q.isLoading) return <AppShell><div className="h-96 animate-pulse rounded-2xl bg-white/5" /></AppShell>;
  if (!q.data) return <AppShell><div className="rounded-2xl border border-border/60 p-8 text-center">Dish not found.</div></AppShell>;

  const item = q.data;

  const handleAdd = () => {
    const cust: CartCustomizations = { size, protein, spice, side, notes: notes.trim() || undefined };
    const key = `${item.id}::${size}::${protein}::${spice}::${side}`;
    add({
      key,
      menu_item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      unit_price: unitPrice,
      quantity: qty,
      customizations: cust,
    });
    toast.success(`${qty} × ${item.name} added to cart`);
    navigate({ to: "/cart" });
  };

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to menu
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-elegant">
          <img src={dishImage(item.name, item.image_url)} alt={item.name} className="aspect-square w-full object-cover" />
          {item.spice_level >= 3 && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-destructive/80 px-3 py-1 text-xs font-bold text-white">
              <Flame className="h-3 w-3" /> Spicy dish
            </span>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-black">{item.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.prep_time_minutes} min</span>
            {item.dietary_tags.map((t: string) => (
              <span key={t} className="rounded-full border border-border/60 px-2 py-0.5 capitalize">{t}</span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{item.description}</p>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ingredients</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.ingredients.map((i: string) => (
                <span key={i} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs">{i}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <OptionGroup label="Size">
              {(Object.keys(SIZE_MULT) as (keyof typeof SIZE_MULT)[]).map((s) => (
                <OptionPill key={s} active={size === s} onClick={() => setSize(s)}>{s} · ×{SIZE_MULT[s]}</OptionPill>
              ))}
            </OptionGroup>

            <OptionGroup label="Protein">
              {PROTEINS.map((p) => (
                <OptionPill key={p} active={protein === p} onClick={() => setProtein(p)}>{p}</OptionPill>
              ))}
            </OptionGroup>

            <OptionGroup label="Spice level">
              {SPICE.map((s) => (
                <OptionPill key={s} active={spice === s} onClick={() => setSpice(s)}>{s}</OptionPill>
              ))}
            </OptionGroup>

            <OptionGroup label="Add a side (+₦500)">
              {SIDES.map((s) => (
                <OptionPill key={s} active={side === s} onClick={() => setSide(s)}>{s}</OptionPill>
              ))}
            </OptionGroup>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Special instructions</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Less oil, extra pepper on the side"
                maxLength={200}
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/5 p-3 text-sm focus:border-primary/60 focus:outline-none"
                rows={2}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/5 p-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] text-muted-foreground">Total</div>
              <div className="font-display text-2xl font-black text-accent">{formatNaira(unitPrice * qty)}</div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl gradient-hero px-5 py-3 text-sm font-semibold text-white shadow-glow hover:scale-[1.02]"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
function OptionPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active ? "border-primary bg-primary/20 text-foreground shadow-glow" : "border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
