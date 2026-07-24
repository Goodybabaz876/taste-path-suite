import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, ChevronDown, Eye, X, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminTransactions });

type Transaction = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  email: string;
  item_count: number;
  items: { name: string; quantity: number; price: number; line_total: number }[];
};

function AdminTransactions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  const txs = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_transactions");
      if (error) throw error;
      return (data as any) as Transaction[];
    },
  });

  const filtered = useMemo(() => {
    if (!txs.data) return [];
    let list = txs.data;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.email.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    if (fromDate) {
      const fd = new Date(fromDate).getTime();
      list = list.filter((t) => new Date(t.created_at).getTime() >= fd);
    }

    if (toDate) {
      const td = new Date(toDate);
      td.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.created_at).getTime() <= td.getTime());
    }

    return list;
  }, [txs.data, search, statusFilter, fromDate, toDate]);

  const totalAmount = filtered.reduce((sum, t) => sum + Number(t.total), 0);
  const totalItems = filtered.reduce((sum, t) => sum + Number(t.item_count), 0);

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 text-[#1A2B4C] -m-4 sm:-m-6 lg:-m-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">View all payment transactions from customers</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header Summary */}
        <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="font-display text-xl font-black">All Customer Transactions</h2>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              Total: {filtered.length}
            </div>
            <div className="rounded-full bg-emerald-600 px-3 py-1.5 text-white shadow-sm">
              {formatNaira(totalAmount)}
            </div>
            <div className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1.5 shadow-sm">
              {totalItems} items
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer email or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="relative w-full sm:w-48 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="delivered">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="border-b border-slate-100 p-4 bg-slate-50 flex flex-wrap items-center gap-3 pt-0">
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-full sm:w-40 rounded-xl border border-emerald-600 text-emerald-800 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <span className="text-slate-400 hidden sm:inline">—</span>
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-full sm:w-40 rounded-xl border border-emerald-600 text-emerald-800 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Item Count</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {txs.isLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">Loading transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">No transactions found.</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-700">{t.email || "Unknown"}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs uppercase">
                      ELIZADE{t.id.slice(0, 8)}{t.id.slice(-4)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{t.item_count}</td>
                    <td className="px-6 py-4 font-black">{formatNaira(t.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        t.status === "delivered" ? "bg-emerald-100 text-emerald-800" :
                        t.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {t.status === "delivered" ? "Completed" : t.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setViewingTx(t)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition"
                        title="View Order Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Order Details */}
      {viewingTx && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-display font-black text-lg text-slate-800">Order Details</h3>
                <div className="font-mono text-xs text-slate-500">REF: ELIZADE{viewingTx.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <button
                onClick={() => setViewingTx(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {viewingTx.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div>
                      <div className="font-bold text-slate-700">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.quantity} x {formatNaira(item.price)}</div>
                    </div>
                    <div className="font-black text-slate-800">{formatNaira(item.line_total)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                <div className="font-bold text-slate-500">Total Paid</div>
                <div className="font-black text-2xl text-emerald-600">{formatNaira(viewingTx.total)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed:           "bg-slate-500/20 text-slate-500",
    preparing:        "bg-amber-500/20 text-amber-600",
    out_for_delivery: "bg-blue-500/20 text-blue-600",
    delivered:        "bg-emerald-500/20 text-emerald-600",
    cancelled:        "bg-red-500/20 text-red-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${map[status] ?? "bg-slate-100 text-slate-800"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
