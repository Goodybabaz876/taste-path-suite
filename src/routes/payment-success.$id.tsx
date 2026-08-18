import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Receipt, ChefHat, Truck, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/payment-success/$id")({
  component: PaymentSuccessPage,
  head: () => ({
    meta: [
      { title: "Payment successful — ELIZADE FOODS" },
      { name: "description", content: "Your payment went through. See your ELIZADE FOODS receipt and track your order live." },
      { property: "og:title", content: "Payment successful — ELIZADE FOODS" },
      { property: "og:description", content: "Payment confirmed. Track your ELIZADE FOODS order live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SPARKS = [
  { x: -140, y: -70, d: 0.05, s: 8 },
  { x: 130, y: -95, d: 0.18, s: 6 },
  { x: -105, y: 80, d: 0.3, s: 10 },
  { x: 150, y: 60, d: 0.12, s: 7 },
  { x: -30, y: -130, d: 0.24, s: 6 },
  { x: 45, y: 125, d: 0.36, s: 9 },
  { x: -175, y: 10, d: 0.42, s: 5 },
  { x: 185, y: -20, d: 0.28, s: 7 },
];

type OrderRow = {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  fulfillment: string;
  created_at: string;
  kitchen_id: string | null;
};

function PaymentSuccessPage() {
  const { id } = Route.useParams();

  const order = useQuery({
    queryKey: ["payment-success", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, subtotal, tax, delivery_fee, fulfillment, created_at, kitchen_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as OrderRow | null;
    },
  });

  const kitchen = useQuery({
    queryKey: ["kitchen", order.data?.kitchen_id],
    enabled: !!order.data?.kitchen_id,
    queryFn: async () => {
      const { data, error } = await supabase.from("kitchens").select("name, code").eq("id", order.data!.kitchen_id!).maybeSingle();
      if (error) throw error;
      return data as { name: string; code: string } | null;
    },
  });

  const o = order.data;
  const isDelivery = o?.fulfillment === "delivery";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12" style={{ background: "linear-gradient(160deg,#04122E 0%,#062A6B 55%,#0B3FA8 100%)" }}>
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle,rgba(59,130,246,0.45) 0%,rgba(4,18,46,0) 70%)" }} />

      <div className="relative w-full max-w-md">
        {/* Animated tick + sparks */}
        <div className="relative mx-auto grid h-40 w-40 place-items-center">
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[#7DD3FC]"
              style={{
                width: s.s,
                height: s.s,
                animation: `spark 1.5s ease-out ${0.35 + s.d}s infinite`,
                ["--sx" as string]: `${s.x}px`,
                ["--sy" as string]: `${s.y}px`,
                opacity: 0,
              }}
            />
          ))}
          <div className="absolute h-40 w-40 rounded-full border-2 border-[#38BDF8]/40" style={{ animation: "ring 1.6s ease-out 0.2s infinite" }} />
          <div
            className="relative grid h-24 w-24 place-items-center rounded-full shadow-2xl"
            style={{ background: "linear-gradient(135deg,#3B82F6,#0EA5E9)", boxShadow: "0 20px 60px rgba(59,130,246,0.55)", animation: "pop 0.6s cubic-bezier(.2,1.4,.4,1) both" }}
          >
            <Check className="h-12 w-12 text-white" strokeWidth={4} style={{ animation: "tick 0.5s ease-out 0.35s both" }} />
          </div>
        </div>

        <div className="mt-4 text-center">
          <h1 className="font-display text-3xl font-black text-white">Payment Successful</h1>
          <p className="mt-2 text-sm font-medium text-sky-200/90">
            Your payment has been confirmed and your order is on its way to the kitchen.
          </p>
        </div>

        {/* Transaction details */}
        <div className="mt-7 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-sky-200">
            <Receipt className="h-4 w-4" /> Transaction details
          </div>

          {order.isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-white/20" />)}
            </div>
          ) : !o ? (
            <div className="mt-4 text-sm text-sky-100">Payment confirmed. Receipt details are unavailable right now.</div>
          ) : (
            <div className="mt-4 space-y-2.5 text-sm">
              <DRow label="Transaction ID" value={o.id.slice(0, 8).toUpperCase()} />
              <DRow label="Date" value={new Date(o.created_at).toLocaleString()} />
              <DRow
                label="Kitchen"
                value={kitchen.data?.name ?? "—"}
                icon={<ChefHat className="h-3.5 w-3.5 text-sky-300" />}
              />
              <DRow
                label="Fulfillment"
                value={isDelivery ? "Delivery" : "Pickup"}
                icon={isDelivery ? <Truck className="h-3.5 w-3.5 text-sky-300" /> : <Store className="h-3.5 w-3.5 text-sky-300" />}
              />
              <DRow label="Subtotal" value={formatNaira(Number(o.subtotal))} />
              <DRow label="Delivery fee" value={formatNaira(Number(o.delivery_fee))} />
              <DRow label="VAT" value={formatNaira(Number(o.tax))} />
              <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                <span className="font-display font-black text-white">Amount paid</span>
                <span className="font-display text-2xl font-black text-[#7DD3FC]">{formatNaira(Number(o.total))}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/order/$id"
            params={{ id }}
            className="flex-1 rounded-2xl bg-white py-3.5 text-center text-sm font-extrabold text-[#0B3FA8] shadow-xl transition hover:bg-sky-50 active:scale-95"
          >
            Track my order
          </Link>
          <Link
            to="/"
            className="flex-1 rounded-2xl border border-white/30 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-white/10 active:scale-95"
          >
            Back to menu
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pop { 0% { transform: scale(0.4); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes tick { 0% { transform: scale(0.2) rotate(-25deg); opacity: 0 } 100% { transform: scale(1) rotate(0); opacity: 1 } }
        @keyframes ring { 0% { transform: scale(0.6); opacity: 0.7 } 100% { transform: scale(1.35); opacity: 0 } }
        @keyframes spark {
          0% { transform: translate(0,0) scale(0.2); opacity: 0 }
          25% { opacity: 1 }
          100% { transform: translate(var(--sx), var(--sy)) scale(1); opacity: 0 }
        }
      `}</style>
    </div>
  );
}

function DRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-sky-200/80">{icon}{label}</span>
      <span className="truncate font-bold text-white">{value}</span>
    </div>
  );
}
