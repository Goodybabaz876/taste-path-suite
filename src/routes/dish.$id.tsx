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

  if (q.isLoading) return <AppShell><div className="h-96 animate-pulse rounded-2xl bg-white border border-[#E2E1D0]" /></AppShell>;
  if (!q.data) return <AppShell><div className="rounded-2xl border border-[#E2E1D0] bg-white p-8 text-center text-[#1A2B4C] font-semibold">Dish not found.</div></AppShell>;

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
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#4A5568] hover:text-[#1A2B4C]">
        <ArrowLeft className="h-4 w-4 text-[#F2A900]" /> Back to menu
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-[#E2E1D0] bg-white shadow-card">
          <img src={dishImage(item.name, item.image_url)} alt={item.name} className="aspect-square w-full object-cover" />
          {item.spice_level >= 3 && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-3 py-1 text-xs font-black text-white shadow-sm">
              <Flame className="h-3.5 w-3.5" /> Spicy dish
            </span>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-black text-[#1A2B4C]">{item.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-[#4A5568]">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#F2A900]" /> {item.prep_time_minutes} min</span>
            {item.dietary_tags.map((t: string) => (
              <span key={t} className="rounded-full border border-[#E2E1D0] bg-white px-2.5 py-0.5 capitalize">{t}</span>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium text-[#4A5568]">{item.description}</p>

          <div className="mt-5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#1A2B4C]">Ingredients</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.ingredients.map((i: string) => (
                <span key={i} className="rounded-lg border border-[#E2E1D0] bg-white px-2.5 py-1 text-xs font-semibold text-[#1A2B4C]">{i}</span>
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
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#1A2B4C]">Special instructions</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Less oil, extra pepper on the side"
                maxLength={200}
                className="mt-2 w-full rounded-xl border border-[#E2E1D0] bg-white p-3 text-sm text-[#1A2B4C] placeholder-slate-400 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
                rows={2}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-[#E2E1D0] bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 rounded-xl border border-[#E2E1D0] bg-[#FAFAED] p-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#E2E1D0] font-bold text-[#1A2B4C]">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center font-black text-[#1A2B4C]">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#E2E1D0] font-bold text-[#1A2B4C]">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] font-bold text-[#4A5568]">Total</div>
              <div className="font-display text-2xl font-black text-[#DC2626]">{formatNaira(unitPrice * qty)}</div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-[#F2A900] px-6 py-3.5 text-sm font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition active:scale-95"
            >
              <ShoppingBag className="h-4 w-4 text-[#1A2B4C]" /> Add to cart
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
      <div className="text-xs font-extrabold uppercase tracking-wider text-[#1A2B4C]">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function OptionPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
        active
          ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C] shadow-md"
          : "border-[#E2E1D0] bg-white text-[#4A5568] hover:bg-[#F3F2DF] hover:text-[#1A2B4C]"
      }`}
    >
      {children}
    </button>
  );
}
