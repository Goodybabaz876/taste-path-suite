import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, ListOrdered, UtensilsCrossed, Tags, LogOut, Flame, ChevronRight,
} from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ListOrdered },
  { to: "/admin/menu", label: "Meals", icon: UtensilsCrossed },
  { to: "/admin/categories", label: "Categories", icon: Tags },
];

function AdminLayout() {
  const { isAdmin, loading } = useAdmin();
  const { user } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Access denied — admins only");
      nav({ to: "/" });
    }
  }, [isAdmin, loading, nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/auth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E1B31]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F2A900] border-t-transparent" />
          <div className="text-sm font-semibold text-slate-300">Checking access…</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0E1B31] text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#070F1F] shadow-2xl lg:flex">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 px-6 pb-5 pt-7">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F2A900] shadow-lg">
            <Flame className="h-5 w-5 text-[#1A2B4C]" />
          </div>
          <div>
            <div className="font-display text-base font-black tracking-tight text-[#F2A900]">ELIZADE FOODS</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Panel</div>
          </div>
        </Link>

        <div className="px-4 pb-2 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Management</div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-[#F2A900] text-[#1A2B4C] shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <n.icon className={`h-4 w-4 ${active ? "text-[#1A2B4C]" : "text-[#F2A900]"}`} />
                {n.label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer — user info + sign out */}
        <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="truncate text-[11px] font-bold text-[#F2A900]">{user?.email}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">Super Admin</div>
          <button
            onClick={signOut}
            className="mt-2.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#070F1F]/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F2A900]">
              <Flame className="h-4 w-4 text-[#1A2B4C]" />
            </div>
            <span className="font-display text-sm font-black text-[#F2A900]">ADMIN</span>
          </Link>
          <div className="flex gap-1">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`grid h-8 w-8 place-items-center rounded-lg text-xs transition ${active ? "bg-[#F2A900] text-[#1A2B4C]" : "text-slate-400 hover:text-white"}`}>
                  <n.icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
