import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Search, ChevronDown, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

/* ─── Status badge ──────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed:           "bg-slate-500/20 text-slate-400",
    preparing:        "bg-amber-500/20 text-amber-400",
    out_for_delivery: "bg-blue-500/20 text-blue-400",
    delivered:        "bg-emerald-500/20 text-emerald-400",
    cancelled:        "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${map[status] ?? "bg-slate-100/10 text-slate-300"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Route ──────────────────────────────────────────────────── */
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

/* ─── Type returned by get_admin_orders_list() RPC ───────────── */
type AdminOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  user_email: string;
  user_id: string;
  fulfillment: string;
  items: { name: string; quantity: number }[];
  kitchen_name: string;
};

/* ─── Chime — uses Web Audio API, no external files needed ───── */
function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext may be unavailable (e.g., server-side render)
  }
}

/* ─── Component ──────────────────────────────────────────────── */
function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const prevCountRef = useRef<number | null>(null);

  /* ── Fetch orders via RPC (includes customer email) ── */
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_orders_list");
      if (error) throw error;
      return (data as unknown) as AdminOrder[];
    },
    refetchInterval: 30_000,
  });

  /* ── Realtime: new order notification ── */
  useEffect(() => {
    const ch = supabase
      .channel("admin-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          playChime();
          toast("🔔 New order received!", {
            description: "A customer just placed an order.",
            duration: 6000,
            style: { background: "#F2A900", color: "#1A2B4C", fontWeight: "bold" },
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  /* ── Flash tab title when new orders arrive ── */
  useEffect(() => {
    const data = q.data ?? [];
    const placed = data.filter((o) => o.status === "placed").length;
    if (prevCountRef.current !== null && placed > prevCountRef.current) {
      const orig = document.title;
      let i = 0;
      const iv = setInterval(() => {
        document.title = i % 2 === 0 ? `🔔 New Order! | Admin` : orig;
        if (++i >= 10) { clearInterval(iv); document.title = orig; }
      }, 600);
    }
    prevCountRef.current = placed;
  }, [q.data]);

  /* ── Update order status ── */
  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Order status → ${STATUS_LABELS[status]}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  /* ── Filter orders — now searches by customer EMAIL ── */
  const orders = (q.data ?? []).filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      if (
        !o.id.toLowerCase().includes(s) &&
        !o.user_email.toLowerCase().includes(s) &&
        !o.kitchen_name.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  const newOrderCount = (q.data ?? []).filter((o) => o.status === "placed").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white flex items-center gap-3">
            Orders
            {newOrderCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-400">
                <Bell className="h-3.5 w-3.5 animate-bounce" />
                {newOrderCount} new
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-400">Update status to trigger customer email notifications</p>
        </div>
      </div>

      {/* Filters — search now works by email, order ID, or kitchen */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, order ID or kitchen…"
            aria-label="Search orders"
            className="h-10 w-72 rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
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
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {["Order ID", "Customer", "Items", "Total", "Kitchen", "Fulfillment", "Date", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={8} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-white/10" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No orders match the filter</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-[#F2A900]">#{o.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-[160px] truncate" title={o.user_email}>
                    {o.user_email || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {(o.items ?? []).slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    {(o.items ?? []).length > 2 && ` +${(o.items ?? []).length - 2} more`}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{formatNaira(Number(o.total))}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{o.kitchen_name}</td>
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
        Changing status to <span className="font-bold text-amber-400">Preparing</span>,{" "}
        <span className="font-bold text-blue-400">Out for delivery</span>, or{" "}
        <span className="font-bold text-emerald-400">Delivered</span> automatically emails the customer.
      </p>
    </div>
  );
}
