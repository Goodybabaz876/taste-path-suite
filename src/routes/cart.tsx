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
      <PageHeader title="Your Cart" subtitle="Review your selected meals before checkout." />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E1D0] bg-white p-12 text-center shadow-card">
          <div className="text-base font-medium text-[#4A5568]">Your cart is empty.</div>
          <Link to="/" className="mt-5 inline-flex rounded-xl bg-[#F2A900] px-5 py-2.5 text-xs font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i.key} className="flex gap-4 rounded-2xl border border-[#E2E1D0] bg-white p-4 shadow-card">
                <img src={dishImage(i.name, i.image_url)} alt={i.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-display font-black text-[#1A2B4C] text-base">{i.name}</div>
                    <button
                      onClick={() => remove(i.key)}
                      aria-label={`Remove ${i.name} from cart`}
                      className="text-slate-400 hover:text-[#DC2626] transition"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-1 text-xs font-medium text-[#4A5568]">
                    {[i.customizations.size, i.customizations.protein, i.customizations.spice, i.customizations.side !== "None" && `+${i.customizations.side}`].filter(Boolean).join(" · ")}
                  </div>
                  {i.customizations.notes && <div className="mt-1 text-[11px] italic text-[#4A5568]">"{i.customizations.notes}"</div>}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E1D0] bg-[#FAFAED] p-1" role="group" aria-label={`Quantity for ${i.name}`}>
                      <button
                        onClick={() => updateQty(i.key, i.quantity - 1)}
                        aria-label={`Decrease quantity of ${i.name}`}
                        className="grid h-6 w-6 place-items-center rounded hover:bg-[#E2E1D0] text-[#1A2B4C] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2A900]"
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="min-w-4 text-center text-xs font-black text-[#1A2B4C]" aria-live="polite" aria-atomic="true">{i.quantity}</span>
                      <button
                        onClick={() => updateQty(i.key, i.quantity + 1)}
                        aria-label={`Increase quantity of ${i.name}`}
                        className="grid h-6 w-6 place-items-center rounded hover:bg-[#E2E1D0] text-[#1A2B4C] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2A900]"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="ml-auto font-display font-black text-[#DC2626] text-lg">{formatNaira(i.unit_price * i.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-[#E2E1D0] bg-white p-6 shadow-card">
            <div className="font-display text-lg font-black text-[#1A2B4C]">Order summary</div>
            <div className="mt-4 space-y-2 text-sm font-medium">
              <Row label="Subtotal" value={formatNaira(subtotal)} />
              <Row label="Delivery" value={formatNaira(delivery)} />
              <Row label="VAT (7.5%)" value={formatNaira(tax)} />
            </div>
            <div className="mt-4 border-t border-[#E2E1D0] pt-4 flex justify-between items-center">
              <div className="font-display font-black text-[#1A2B4C]">Total</div>
              <div className="font-display text-2xl font-black text-[#DC2626]">{formatNaira(total)}</div>
            </div>
            <Link to="/checkout" className="mt-6 flex items-center justify-center rounded-xl bg-[#F2A900] py-3.5 text-sm font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition active:scale-95">
              Continue to checkout
            </Link>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-[#4A5568]"><span>{label}</span><span className="text-[#1A2B4C] font-bold">{value}</span></div>;
}
