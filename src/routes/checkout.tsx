import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CreditCard, MapPin, Truck, Store, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";


export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

const addressSchema = z.object({
  street: z.string().trim().min(3, "Street required").max(120),
  city: z.string().trim().min(2, "City required").max(60),
  postal_code: z.string().trim().min(3, "Postal code required").max(20),
  instructions: z.string().trim().max(200).optional(),
});
const cardSchema = z.object({
  number: z.string().regex(/^\d{16}$/, "Enter 16-digit card number"),
  exp: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY"),
  cvc: z.string().regex(/^\d{3,4}$/, "3-4 digit CVC"),
  name: z.string().trim().min(2, "Cardholder name required"),
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState({ street: "", city: "Ondo", postal_code: "", instructions: "" });
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [applyPoints, setApplyPoints] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("loyalty_points").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const delivery = fulfillment === "delivery" && subtotal > 0 ? 1000 : 0;
  const tax = Math.round(subtotal * 0.075);
  const preDiscountTotal = subtotal + delivery + tax;
  
  const pointsAvailable = profile.data?.loyalty_points ?? 0;
  const pointsDiscount = applyPoints ? Math.min(pointsAvailable, preDiscountTotal) : 0;
  const total = preDiscountTotal - pointsDiscount;

  if (items.length === 0) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[#E2E1D0] bg-white p-12 text-center shadow-card">
          <ShoppingBag className="mx-auto h-10 w-10 text-[#F2A900]" />
          <div className="mt-3 text-base font-medium text-[#4A5568]">Your cart is empty.</div>
          <Link to="/" className="mt-5 inline-flex rounded-xl bg-[#F2A900] px-5 py-2.5 text-xs font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition">
            Browse Menu
          </Link>
        </div>
      </AppShell>
    );
  }

  const next = () => {
    setErrors({});
    if (step === 1) { setStep(fulfillment === "delivery" ? 2 : 3); return; }
    if (step === 2) {
      const r = addressSchema.safeParse(address);
      if (!r.success) {
        const errs: Record<string, string> = {};
        r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
        setErrors(errs);
        return;
      }
      setStep(3);
      return;
    }
  };

  const place = async () => {
    setErrors({});
    const r = cardSchema.safeParse(card);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    if (!user) {
      toast.error("Please sign in to place your order");
      navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
      return;
    }
    setPlacing(true);
    try {
      const eta = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "placed",
          fulfillment,
          subtotal,
          delivery_fee: delivery,
          tax,
          points_discount: pointsDiscount,
          total,
          delivery_address: fulfillment === "delivery" ? address : null,
          estimated_ready_at: eta,
        })
        .select()
        .single();
      if (error) throw error;

      const lines = items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.menu_item_id,
        name: i.name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        customizations: i.customizations as never,
        line_total: i.unit_price * i.quantity,
      }));
      const { error: liErr } = await supabase.from("order_items").insert(lines);
      if (liErr) throw liErr;

      clear();
      toast.success("Order placed! Tracking it now.");
      navigate({ to: "/order/$id", params: { id: order.id } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Checkout" subtitle="Just a few steps away from your delicious meal." />

      <Stepper step={step} hasDelivery={fulfillment === "delivery"} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === 1 && (
            <Card title="How would you like to receive your order?">
              <div className="grid gap-3 sm:grid-cols-2">
                <FulfillmentOption active={fulfillment === "delivery"} onClick={() => setFulfillment("delivery")} icon={Truck} title="Delivery" desc="We'll bring it directly to your hostel." />
                <FulfillmentOption active={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")} icon={Store} title="Pickup" desc="Skip the fee. Grab it hot from kitchen." />
              </div>
            </Card>
          )}

          {step === 2 && fulfillment === "delivery" && (
            <Card title="Delivery address">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Street & Hostel block" value={address.street} onChange={(v) => setAddress({ ...address, street: v })} error={errors.street} className="sm:col-span-2" />
                <Field label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} error={errors.city} />
                <Field label="Postal code" value={address.postal_code} onChange={(v) => setAddress({ ...address, postal_code: v })} error={errors.postal_code} />
                <Field label="Special instructions (optional)" value={address.instructions} onChange={(v) => setAddress({ ...address, instructions: v })} error={errors.instructions} className="sm:col-span-2" />
              </div>
            </Card>
          )}

          {step === 3 && (
            <>
              <Card title="Payment details">
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#F2A900]/40 bg-[#F2A900]/10 p-3 text-xs font-bold text-[#1A2B4C]">
                  <CreditCard className="h-4 w-4 text-[#F2A900]" /> Demo checkout — no real card charge will be made.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Cardholder name" value={card.name} onChange={(v) => setCard({ ...card, name: v })} error={errors.name} className="sm:col-span-2" />
                  <Field label="Card number" value={card.number} onChange={(v) => setCard({ ...card, number: v.replace(/\D/g, "").slice(0, 16) })} placeholder="4242424242424242" error={errors.number} className="sm:col-span-2" />
                  <Field label="Expiry (MM/YY)" value={card.exp} onChange={(v) => setCard({ ...card, exp: v.slice(0, 5) })} placeholder="12/28" error={errors.exp} />
                  <Field label="CVC" value={card.cvc} onChange={(v) => setCard({ ...card, cvc: v.replace(/\D/g, "").slice(0, 4) })} placeholder="123" error={errors.cvc} />
                </div>
              </Card>

              <Card title="Review your order">
                <div className="space-y-2 text-sm font-medium">
                  {items.map((i) => (
                    <div key={i.key} className="flex justify-between text-[#1A2B4C]">
                      <span>{i.quantity} × {i.name} <span className="text-xs text-[#4A5568]">({i.customizations.size})</span></span>
                      <span className="font-bold text-[#DC2626]">{formatNaira(i.unit_price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                {pointsAvailable > 0 && (
                  <div className="mt-4 rounded-xl border border-[#F2A900]/40 bg-[#F2A900]/10 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <div className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition ${applyPoints ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-[#E2E1D0] bg-white"}`}>
                        {applyPoints && <Check className="h-3 w-3" strokeWidth={4} />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={applyPoints} onChange={(e) => setApplyPoints(e.target.checked)} />
                      <div>
                        <div className="font-bold text-[#1A2B4C]">Use Loyalty Points</div>
                        <div className="text-xs font-medium text-[#4A5568]">You have {pointsAvailable} points. Use them to save {formatNaira(Math.min(pointsAvailable, preDiscountTotal))}.</div>
                      </div>
                    </label>
                  </div>
                )}
                
                <Link to="/cart" className="mt-3 inline-block text-xs font-bold text-[#F2A900] hover:underline">Edit cart</Link>
              </Card>
            </>
          )}

          <div className="flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={() => setStep(step === 3 && fulfillment === "pickup" ? 1 : step - 1)}
                className="rounded-xl border border-[#E2E1D0] bg-white px-5 py-2.5 text-xs font-bold text-[#1A2B4C] hover:bg-[#F3F2DF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2A900]"
              >
                Back
              </button>
            ) : <div />}
            {step < 3 ? (
              <button
                onClick={next}
                className="rounded-xl bg-[#F2A900] px-6 py-3 text-sm font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A2B4C]"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={place}
                disabled={placing}
                className="rounded-xl bg-[#F2A900] px-7 py-3 text-sm font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A2B4C]"
              >
                {placing ? "Placing..." : `Pay ${formatNaira(total)}`}
              </button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-[#E2E1D0] bg-white p-6 shadow-card">
          <div className="font-display text-lg font-black text-[#1A2B4C]">Summary</div>
          <div className="mt-4 space-y-2 text-sm font-medium">
            <Row label="Subtotal" value={formatNaira(subtotal)} />
            <Row label="Delivery" value={formatNaira(delivery)} />
            <Row label="VAT (7.5%)" value={formatNaira(tax)} />
            {pointsDiscount > 0 && (
              <Row label="Points Discount" value={`-${formatNaira(pointsDiscount)}`} className="text-emerald-600" />
            )}
          </div>
          <div className="mt-4 border-t border-[#E2E1D0] pt-4 flex justify-between items-center">
            <div className="font-display font-black text-[#1A2B4C]">Total</div>
            <div className="font-display text-2xl font-black text-[#DC2626]">{formatNaira(total)}</div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stepper({ step, hasDelivery }: { step: number; hasDelivery: boolean }) {
  const steps = hasDelivery
    ? [{ n: 1, l: "Fulfillment", icon: Truck }, { n: 2, l: "Address", icon: MapPin }, { n: 3, l: "Payment", icon: CreditCard }]
    : [{ n: 1, l: "Fulfillment", icon: Store }, { n: 3, l: "Payment", icon: CreditCard }];
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#E2E1D0] bg-white p-3 shadow-card">
      {steps.map((s, idx) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-[#F2A900] text-[#1A2B4C]" : active ? "bg-[#F2A900]/20 text-[#1A2B4C] ring-2 ring-[#F2A900]" : "bg-[#FAFAED] text-[#4A5568]"}`}>
              {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <div className="hidden text-xs font-bold text-[#1A2B4C] sm:block">{s.l}</div>
            {idx < steps.length - 1 && <div className={`h-0.5 flex-1 rounded-full ${done ? "bg-[#F2A900]" : "bg-[#E2E1D0]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E2E1D0] bg-white p-6 shadow-card">
      <div className="mb-4 font-display text-lg font-black text-[#1A2B4C]">{title}</div>
      {children}
    </div>
  );
}

function FulfillmentOption({ active, onClick, icon: Icon, title, desc }: { active: boolean; onClick: () => void; icon: typeof Truck; title: string; desc: string }) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A900] ${active ? "border-[#F2A900] bg-[#F2A900]/15 shadow-md" : "border-[#E2E1D0] bg-white hover:bg-[#F3F2DF]"}`}
    >
      <Icon className="h-5 w-5 text-[#F2A900]" aria-hidden="true" />
      <div className="mt-2 font-display font-black text-[#1A2B4C]">{title}</div>
      <div className="text-xs font-medium text-[#4A5568]">{desc}</div>
    </button>
  );
}

function Field({ label, value, onChange, placeholder, error, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; className?: string }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const errId = `${id}-error`;
  return (
    <div className={`block ${className ?? ""}`}>
      <label htmlFor={id} className="text-xs font-extrabold uppercase tracking-wider text-[#1A2B4C]">{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
        className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#1A2B4C] placeholder-slate-400 focus:outline-none focus:ring-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2A900] ${error ? "border-red-500 focus:ring-red-300" : "border-[#E2E1D0] focus:border-[#F2A900] focus:ring-[#F2A900]/30"}`}
      />
      {error && <div id={errId} role="alert" className="mt-1 text-xs font-semibold text-red-500">{error}</div>}
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return <div className="flex justify-between text-[#4A5568]"><span>{label}</span><span className={`font-bold ${className ?? "text-[#1A2B4C]"}`}>{value}</span></div>;
}
