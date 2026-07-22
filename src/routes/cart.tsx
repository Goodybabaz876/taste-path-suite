import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { dishImage } from "@/lib/dish-image";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, updateQty, remove, subtotal } = useCart();
  const delivery = subtotal > 0 ? 1000 : 0;
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + delivery + tax;

  return (
    <AppShell>
      <PageHeader title="Your cart" subtitle="Review your dishes before checkout." />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
          <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          <Link to="/" className="mt-4 inline-flex rounded-xl gradient-hero px-4 py-2 text-xs font-semibold text-white shadow-glow">Browse menu</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.key} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4">
                <img src={dishImage(i.name, i.image_url)} alt={i.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-display font-bold">{i.name}</div>
                    <button onClick={() => remove(i.key)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {[i.customizations.size, i.customizations.protein, i.customizations.spice, i.customizations.side !== "None" && `+${i.customizations.side}`].filter(Boolean).join(" · ")}
                  </div>
                  {i.customizations.notes && <div className="mt-1 text-[11px] italic text-muted-foreground">"{i.customizations.notes}"</div>}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/5 p-1">
                      <button onClick={() => updateQty(i.key, i.quantity - 1)} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10"><Minus className="h-3 w-3" /></button>
                      <span className="min-w-4 text-center text-xs font-semibold">{i.quantity}</span>
                      <button onClick={() => updateQty(i.key, i.quantity + 1)} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10"><Plus className="h-3 w-3" /></button>
                    </div>
                    <div className="ml-auto font-display font-bold text-accent">{formatNaira(i.unit_price * i.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-border/60 bg-card p-5">
            <div className="font-display text-lg font-bold">Order summary</div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatNaira(subtotal)} />
              <Row label="Delivery" value={formatNaira(delivery)} />
              <Row label="VAT (7.5%)" value={formatNaira(tax)} />
            </div>
            <div className="mt-4 border-t border-border/60 pt-4 flex justify-between">
              <div className="font-display font-bold">Total</div>
              <div className="font-display text-xl font-black text-accent">{formatNaira(total)}</div>
            </div>
            <Link to="/checkout" className="mt-5 flex items-center justify-center rounded-xl gradient-hero py-3 text-sm font-semibold text-white shadow-glow hover:scale-[1.02]">
              Continue to checkout
            </Link>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{value}</span></div>;
}
