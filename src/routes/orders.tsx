import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { add } = useCart();

  const q = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <AppShell><div className="h-64 animate-pulse rounded-2xl bg-white/5" /></AppShell>;
  if (!user) return <AppShell><AuthGate /></AppShell>;

  const orders = q.data ?? [];

  const repeat = (order: (typeof orders)[number]) => {
    for (const li of order.order_items) {
      add({
        key: `${li.menu_item_id}::repeat::${Date.now()}::${li.id}`,
        menu_item_id: li.menu_item_id,
        name: li.name,
        image_url: null,
        unit_price: Number(li.unit_price),
        quantity: li.quantity,
        customizations: (li.customizations as never) ?? {},
      });
    }
    toast.success("Items added to your cart");
    navigate({ to: "/cart" });
  };

  return (
    <AppShell>
      <PageHeader title="Your orders" subtitle="Reorder in one tap." />
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          No orders yet. <Link to="/" className="text-accent hover:underline">Start ordering →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <StatusBadge status={o.status} />
                  <span className="text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-1 font-display font-bold">Order #{String(o.id).slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">
                  {o.order_items.length} item{o.order_items.length === 1 ? "" : "s"} · {formatNaira(Number(o.total))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => repeat(o)} className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                  <RotateCcw className="h-3.5 w-3.5" /> Repeat
                </button>
                <Link to="/order/$id" params={{ id: o.id }} className="rounded-xl gradient-hero px-3 py-2 text-xs font-semibold text-white shadow-glow">
                  Track
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed: "bg-white/10 text-foreground",
    preparing: "bg-primary/20 text-primary-foreground",
    out_for_delivery: "bg-accent/20 text-accent",
    delivered: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-destructive/20 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "bg-white/10"}`}>{status.replace(/_/g, " ")}</span>;
}

function AuthGate() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
      <div className="font-display text-xl font-bold">Sign in to see your orders</div>
      <Link to="/auth" className="mt-4 inline-flex rounded-xl gradient-hero px-4 py-2 text-xs font-semibold text-white shadow-glow">Sign in</Link>
    </div>
  );
}
