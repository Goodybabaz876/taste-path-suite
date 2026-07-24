import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Calendar, ChevronDown, Eye, X, Receipt, TrendingUp,
  Users, Utensils, DollarSign, ShoppingBag,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

type Transaction = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  email: string;
  item_count: number;
  top_item: string | null;
  items: { name: string; quantity: number; price: number; line_total: number }[];
};
type MonthlyRow = { month: string; month_start: string; revenue: number; order_count: number; item_count: number };
type CustomerRow = { email: string; order_count: number; total_spent: number; favorite_item: string | null };
type ItemRow = { name: string; qty: number; revenue: number };

function AdminDashboard() {
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
      return (data as unknown) as Transaction[];
    },
  });

  const monthly = useQuery({
    queryKey: ["admin-monthly"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_sales_analytics");
      if (error) throw error;
      return (data as unknown) as MonthlyRow[];
    },
  });

  const topCustomers = useQuery({
    queryKey: ["admin-top-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_top_customers");
      if (error) throw error;
      return (data as unknown) as CustomerRow[];
    },
  });

  const topItems = useQuery({
    queryKey: ["admin-top-items"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_top_items");
      if (error) throw error;
      return (data as unknown) as ItemRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!txs.data) return [];
    let list = txs.data;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.email.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (fromDate) {
      const fd = new Date(fromDate).getTime();
      list = list.filter((t) => new Date(t.created_at).getTime() >= fd);
    }
    if (toDate) {
      const td = new Date(toDate); td.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.created_at).getTime() <= td.getTime());
    }
    return list;
  }, [txs.data, search, statusFilter, fromDate, toDate]);

  const totalRevenue = (txs.data ?? []).reduce((s, t) => s + Number(t.total), 0);
  const totalOrders = (txs.data ?? []).length;
  const totalItems = (txs.data ?? []).reduce((s, t) => s + Number(t.item_count), 0);
  const uniqueCustomers = new Set((txs.data ?? []).map((t) => t.email)).size;

  const bestMonth = useMemo(() => {
    const rows = monthly.data ?? [];
    if (!rows.length) return null;
    return rows.reduce((best, r) => (Number(r.revenue) > Number(best.revenue) ? r : best), rows[0]);
  }, [monthly.data]);

  const chartData = (monthly.data ?? []).map((r) => ({
    month: r.month,
    revenue: Number(r.revenue),
    orders: Number(r.order_count),
  }));

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 text-[#1A2B4C] -m-4 sm:-m-6 lg:-m-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">All payments, orders and analytics across the platform.</p>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Total Revenue" value={formatNaira(totalRevenue)} tint="emerald" />
        <Kpi icon={ShoppingBag} label="Total Orders" value={String(totalOrders)} tint="amber" />
        <Kpi icon={Users} label="Customers" value={String(uniqueCustomers)} tint="indigo" />
        <Kpi icon={Utensils} label="Items Sold" value={String(totalItems)} tint="rose" />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-black flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" /> Monthly Sales
              </h2>
              <p className="text-xs text-slate-500">Revenue across the lifetime of the platform</p>
            </div>
            {bestMonth && (
              <div className="hidden sm:block rounded-xl bg-emerald-50 px-3 py-2 text-right">
                <div className="text-[10px] font-black uppercase text-emerald-700">Best Month</div>
                <div className="font-black text-emerald-800">{bestMonth.month}</div>
                <div className="text-xs font-bold text-emerald-700">{formatNaira(Number(bestMonth.revenue))}</div>
              </div>
            )}
          </div>
          <div className="mt-4 h-72">
            {chartData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">No sales data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, k) => (k === "revenue" ? formatNaira(v) : v)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={bestMonth && chartData[i].month === bestMonth.month ? "#059669" : "#F2A900"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-black flex items-center gap-2">
            <Utensils className="h-5 w-5 text-amber-600" /> Top Selling Meals
          </h2>
          <div className="mt-3 space-y-2">
            {(topItems.data ?? []).slice(0, 6).map((it, i) => (
              <div key={it.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-xs font-black text-amber-700">
                  #{i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{it.name}</div>
                  <div className="text-[11px] text-slate-500">{it.qty} sold</div>
                </div>
                <div className="text-xs font-black text-emerald-700">{formatNaira(Number(it.revenue))}</div>
              </div>
            ))}
            {(topItems.data ?? []).length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">No sales yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Returning customers */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-display text-lg font-black flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" /> Returning Customers
          </h2>
          <p className="text-xs text-slate-500">Customers with the most orders and what they usually eat.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Customer (Email)</th>
                <th className="px-6 py-3">Orders</th>
                <th className="px-6 py-3">Favorite Meal</th>
                <th className="px-6 py-3">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(topCustomers.data ?? []).map((c) => (
                <tr key={c.email} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-semibold">{c.email || "Unknown"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-black text-indigo-700">
                      {c.order_count} orders
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <Utensils className="h-3.5 w-3.5 text-amber-600" />
                      {c.favorite_item ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-black text-emerald-700">{formatNaira(Number(c.total_spent))}</td>
                </tr>
              ))}
              {(topCustomers.data ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black">All Payment Transactions</h2>
              <p className="text-xs text-slate-500">Every payment made on the platform.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Total: {filtered.length}</div>
            <div className="rounded-full bg-emerald-600 px-3 py-1.5 text-white">
              {formatNaira(filtered.reduce((s, t) => s + Number(t.total), 0))}
            </div>
          </div>
        </div>

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
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-full sm:w-40 rounded-xl border border-emerald-600 text-emerald-800 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600" />
          </div>
          <span className="text-slate-400 hidden sm:inline">—</span>
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-full sm:w-40 rounded-xl border border-emerald-600 text-emerald-800 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer (Email)</th>
                <th className="px-6 py-4">Ordered</th>
                <th className="px-6 py-4">Items</th>
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
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                        <Utensils className="h-3.5 w-3.5 text-amber-600" />
                        {t.top_item ?? "—"}
                      </span>
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
                      <button onClick={() => setViewingTx(t)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition"
                        title="View Order Details">
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

      {viewingTx && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-display font-black text-lg text-slate-800">Order Details</h3>
                <div className="text-xs text-slate-500">{viewingTx.email}</div>
              </div>
              <button onClick={() => setViewingTx(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100">
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

function Kpi({ icon: Icon, label, value, tint }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string;
  tint: "emerald" | "amber" | "indigo" | "rose";
}) {
  const bg = { emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700",
    indigo: "bg-indigo-100 text-indigo-700", rose: "bg-rose-100 text-rose-700" }[tint];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${bg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-black">{value}</div>
    </div>
  );
}
