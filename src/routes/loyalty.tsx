import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowDownRight, ArrowUpRight, ShieldCheck, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, PageHeader } from "@/components/AppShell";
import { format } from "date-fns";

export const Route = createFileRoute("/loyalty")({ component: LoyaltyPage });

function LoyaltyPage() {
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const txs = useQuery({
    queryKey: ["loyalty-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*, orders(id, total)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <AppShell>
      <PageHeader title="Rewards" subtitle="Earn points on every order. Spend them like cash." />

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Balance Card */}
        <div className="md:col-span-2 rounded-3xl gradient-hero p-8 text-white shadow-glow relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-white/80 font-semibold uppercase tracking-widest text-xs">
              <Sparkles className="h-4 w-4" />
              Available Balance
            </div>
            <div className="mt-6 mb-4">
              <span className="font-display text-7xl font-black">{profile.data?.loyalty_points ?? 0}</span>
              <span className="text-xl font-bold text-white/80 ml-2">pts</span>
            </div>
            <div className="text-sm text-white/90">
              Equals <span className="font-bold">₦{profile.data?.loyalty_points ?? 0}</span> off your next order.
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E2E1D0] bg-white p-5 shadow-card flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-[#1A2B4C]">Earn points</div>
              <div className="text-xs text-slate-500 mt-1">Get 1 point for every ₦100 you spend on food delivery and pickup.</div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E1D0] bg-white p-5 shadow-card flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-[#1A2B4C]">Redeem freely</div>
              <div className="text-xs text-slate-500 mt-1">Apply your points at checkout to discount your total. 1 point = ₦1.</div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-extrabold text-[#1A2B4C]">Points History</h2>
        
        <div className="mt-4 rounded-2xl border border-[#E2E1D0] bg-white overflow-hidden shadow-card">
          {!txs.data?.length ? (
            <div className="p-12 text-center text-slate-500">
              <Gift className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              No points earned yet. Place an order to start earning!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {txs.data.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 transition hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tx.points > 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                      {tx.points > 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-[#1A2B4C]">
                        {tx.type === "earn" ? "Order Complete" : tx.type === "spend" ? "Discount Redeemed" : "Admin Adjustment"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
                        {tx.order_id && ` · Order #${tx.order_id.slice(0, 8)}`}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.points > 0 ? "text-emerald-600" : "text-[#1A2B4C]"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
