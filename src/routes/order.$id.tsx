import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, ChefHat, MapPin, Package, Phone, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/order/$id")({ component: OrderTracking });

const STATUS_STEPS = [
  { key: "placed", label: "Order placed", icon: Check },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
] as const;

function OrderTracking() {
  const { id } = Route.useParams();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const q = useQuery({
    queryKey: ["order", id, Math.floor(now / 30_000)],
    queryFn: async () => {
      const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      const { data: itms } = await supabase.from("order_items").select("*").eq("order_id", id);
      return { order, items: itms ?? [] };
    },
    refetchInterval: 30_000,
  });

  // Subscribe to realtime updates for this order (best-effort)
  useEffect(() => {
    const ch = supabase.channel(`order-${id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => setNow(Date.now())).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (q.isLoading) return <AppShell><div className="h-96 animate-pulse rounded-2xl bg-white/5" /></AppShell>;
  if (!q.data?.order) return <AppShell><div className="rounded-2xl border p-8 text-center">Order not found.</div></AppShell>;

  const { order, items } = q.data;
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const eta = order.estimated_ready_at ? new Date(order.estimated_ready_at).getTime() : null;
  const minutesLeft = eta ? Math.max(0, Math.ceil((eta - now) / 60_000)) : null;

  return (
    <AppShell>
      <Link to="/orders" className="mb-4 inline-block text-xs text-muted-foreground hover:text-foreground">← All orders</Link>

      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Order #{String(order.id).slice(0, 8)}</div>
            <h1 className="font-display text-3xl font-black">
              {order.status === "delivered" ? "Enjoy your meal!" : minutesLeft != null ? `Ready in ~${minutesLeft} min` : "Tracking your order"}
            </h1>
            <div className="mt-1 text-xs text-muted-foreground">{order.fulfillment === "delivery" ? "Delivery" : "Pickup"} · {formatNaira(order.total)}</div>
          </div>
          {order.status !== "delivered" && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">Live · updates every 30s</div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-2">
          {STATUS_STEPS.map((s, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${done ? "gradient-hero shadow-glow" : "bg-white/5 text-muted-foreground"} ${active ? "animate-pulse" : ""}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="hidden sm:block">
                  <div className={`text-xs font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                </div>
                {i < STATUS_STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded-full ${i < currentIdx ? "bg-primary" : "bg-white/10"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="font-display text-lg font-bold">Order details</div>
          <div className="mt-3 space-y-2">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <div>
                  <div>{i.quantity} × {i.name}</div>
                  {i.customizations && Object.keys(i.customizations).length > 0 && (
                    <div className="text-[11px] text-muted-foreground">
                      {Object.entries(i.customizations).filter(([, v]) => v && v !== "None").map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </div>
                  )}
                </div>
                <div className="font-semibold">{formatNaira(Number(i.line_total))}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border/60 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatNaira(Number(order.subtotal))}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="text-foreground">{formatNaira(Number(order.delivery_fee))}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>VAT</span><span className="text-foreground">{formatNaira(Number(order.tax))}</span></div>
            <div className="mt-2 flex justify-between font-display font-bold"><span>Total</span><span className="text-accent">{formatNaira(Number(order.total))}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          {order.fulfillment === "delivery" && order.delivery_address && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2 font-display font-bold"><MapPin className="h-4 w-4 text-accent" /> Delivering to</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {(order.delivery_address as { street: string }).street}<br />
                {(order.delivery_address as { city: string }).city} {(order.delivery_address as { postal_code: string }).postal_code}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 font-display font-bold"><Phone className="h-4 w-4 text-accent" /> Need help?</div>
            <div className="mt-2 text-sm">ELIZADE FOODS Support</div>
            <a href="tel:+2348030744896" className="text-sm text-accent hover:underline">08030744896</a>
            <div className="mt-1 text-xs text-muted-foreground">Available 8am–11pm daily</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
