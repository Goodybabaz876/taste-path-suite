import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { StatusBadge } from "./index";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const ALL_STATUSES = ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;
type OrderStatus = typeof ALL_STATUSES[number];

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed:           "Placed",
  preparing:        "Preparing",
  out_for_delivery: "Out for delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(name, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Order status → ${STATUS_LABELS[status]}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders-summary"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const orders = (q.data ?? []).filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!o.id.includes(s) && !o.user_id.includes(s)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-white">Orders</h1>
        <p className="mt-1 text-sm text-slate-400">Update status to trigger customer email notifications</p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID…"
            aria-label="Search orders"
            className="h-10 rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                filterStatus === s
                  ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {["Order ID", "Items", "Total", "Fulfillment", "Date", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-white/10" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No orders match the filter</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-[#F2A900]">#{o.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {(o.order_items ?? []).slice(0, 2).map((i: { name: string; quantity: number }) => `${i.quantity}× ${i.name}`).join(", ")}
                    {(o.order_items ?? []).length > 2 && ` +${(o.order_items ?? []).length - 2} more`}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{formatNaira(Number(o.total))}</td>
                  <td className="px-4 py-3 capitalize text-slate-300">{o.fulfillment}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select
                        value={o.status}
                        disabled={updating === o.id}
                        onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                        aria-label={`Change status of order ${o.id.slice(0, 8)}`}
                        className="h-8 appearance-none rounded-lg border border-white/10 bg-[#0E1B31] pl-3 pr-7 text-[11px] font-bold text-white focus:border-[#F2A900] focus:outline-none disabled:opacity-50"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Changing status to <span className="font-bold text-amber-400">Preparing</span>, <span className="font-bold text-blue-400">Out for delivery</span>, or <span className="font-bold text-emerald-400">Delivered</span> automatically emails the customer.
      </p>
    </div>
  );
}
