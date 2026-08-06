import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, ChefHat, Bike, PackageCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatNaira } from "@/lib/format";

type ActiveOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  estimated_ready_at: string | null;
  fulfillment: string;
  kitchen_id: string | null;
  order_items: { name: string; quantity: number }[];
};

const ACTIVE = ["placed", "preparing", "out_for_delivery"];

const STEPS = [
  { key: "placed", label: "Order received", icon: Clock },
  { key: "preparing", label: "Being cooked", icon: ChefHat },
  { key: "out_for_delivery", label: "On the way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

function etaText(o: ActiveOrder) {
  if (!o.estimated_ready_at) return null;
  const mins = Math.round((new Date(o.estimated_ready_at).getTime() - Date.now()) / 60000);
  if (mins <= 0) return "Ready any moment";
  return `Ready in about ${mins} min`;
}

/** Live "pending orders" tracker shown to signed-in customers on the menu page. */
export function PendingOrders() {
  const { user } = useAuth();

  const kitchens = useQuery({
    queryKey: ["kitchens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kitchens").select("id, name").order("sort_order");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const q = useQuery({
    queryKey: ["my-active-orders", user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total, created_at, estimated_ready_at, fulfillment, kitchen_id, order_items(name, quantity)")
        .eq("user_id", user!.id)
        .in("status", ACTIVE)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as ActiveOrder[];
    },
  });

  const orders = q.data ?? [];
  if (!user || orders.length === 0) return null;

  return (
    <section aria-labelledby="pending-orders-heading" className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-[#F2A900]" aria-hidden="true" />
        <h2 id="pending-orders-heading" className="font-display text-xl font-black text-[#1A2B4C]">
          Pending orders
        </h2>
        <span className="rounded-full bg-[#F2A900]/15 px-2.5 py-0.5 text-xs font-black text-[#B87D00]">
          {orders.length} in progress
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {orders.map((o) => {
          const stepIndex = Math.max(0, STEPS.findIndex((s) => s.key === o.status));
          const kitchen = kitchens.data?.find((k) => k.id === o.kitchen_id)?.name;
          const eta = etaText(o);
          return (
            <Link
              key={o.id}
              to="/order/$id"
              params={{ id: o.id }}
              className="rounded-2xl border border-[#E2E1D0] bg-white p-5 shadow-card transition hover:border-[#F2A900] hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-[#1A2B4C]">
                    {o.order_items?.map((i) => `${i.quantity}× ${i.name}`).join(", ") || "Your order"}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-500">
                    {kitchen ? `${kitchen} • ` : ""}{o.fulfillment === "pickup" ? "Pickup" : "Delivery"} • {formatNaira(Number(o.total))}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#0E1B31] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#F2A900]">
                  {o.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Progress steps */}
              <ol className="mt-4 flex items-center gap-2">
                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={s.key} className="flex flex-1 items-center gap-2">
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                          done ? "bg-[#F2A900] text-[#1A2B4C]" : "bg-[#F3F2DF] text-slate-400"
                        }`}
                        title={s.label}
                      >
                        <s.icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`h-1 flex-1 rounded-full ${i < stepIndex ? "bg-[#F2A900]" : "bg-[#F3F2DF]"}`} />
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="mt-3 text-xs font-bold text-[#1A2B4C]">
                {STEPS[stepIndex]?.label}
                {eta ? ` — ${eta}` : ""}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
