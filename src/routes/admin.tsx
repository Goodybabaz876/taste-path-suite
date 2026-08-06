import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, ListOrdered, UtensilsCrossed, Tags, LogOut, Flame,
  ChevronRight, Users, ShieldCheck,
} from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  {
    to: "/admin/",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    from: "#F2A900",
    to_color: "#F97316",
    glow: "rgba(242,169,0,0.35)",
    dot: "#F2A900",
  },
  {
    to: "/admin/orders",
    label: "Orders",
    icon: ListOrdered,
    from: "#06B6D4",
    to_color: "#2563EB",
    glow: "rgba(6,182,212,0.35)",
    dot: "#06B6D4",
  },
  {
    to: "/admin/menu",
    label: "Meals",
    icon: UtensilsCrossed,
    from: "#10B981",
    to_color: "#0D9488",
    glow: "rgba(16,185,129,0.35)",
    dot: "#10B981",
  },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: Tags,
    superOnly: true,
    from: "#F43F5E",
    to_color: "#EC4899",
    glow: "rgba(244,63,94,0.35)",
    dot: "#F43F5E",
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    superOnly: true,
    from: "#7C3AED",
    to_color: "#4F46E5",
    glow: "rgba(124,58,237,0.35)",
    dot: "#7C3AED",
  },
  {
    to: "/admin/staff",
    label: "Kitchen Admins",
    icon: ShieldCheck,
    superOnly: true,
    from: "#0EA5E9",
    to_color: "#6366F1",
    glow: "rgba(14,165,233,0.35)",
    dot: "#0EA5E9",
  },
];

function AdminLayout() {
  const { isAdmin, isSuper, kitchenName, loading } = useAdmin();
  const { user } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = NAV.filter((n) => isSuper || !n.superOnly);

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
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #06091A 0%, #0A0F1E 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)", boxShadow: "0 0 40px rgba(242,169,0,0.4)" }}>
            <Flame className="h-8 w-8 text-white" />
            <div className="absolute -inset-1 animate-ping rounded-2xl opacity-30" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)" }} />
          </div>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full animate-[loading_1.2s_ease-in-out_infinite] rounded-full" style={{ background: "linear-gradient(90deg, #F2A900, #7C3AED)" }} />
          </div>
          <style>{`
            @keyframes loading {
              0%   { width: 0%; margin-left: 0; }
              50%  { width: 60%; margin-left: 20%; }
              100% { width: 0%; margin-left: 100%; }
            }
          `}</style>
          <div className="text-sm font-semibold text-slate-400">Checking access…</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg, #06091A 0%, #0A0F1E 60%, #0D1526 100%)" }}>

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex" style={{ background: "linear-gradient(180deg, #04060F 0%, #06091A 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div className="px-5 pb-5 pt-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="relative grid h-11 w-11 place-items-center rounded-xl transition group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #F2A900, #F97316)", boxShadow: "0 8px 20px rgba(242,169,0,0.4)" }}
            >
              <Flame className="h-5 w-5 text-white" />
              <div className="absolute -inset-0.5 rounded-xl opacity-0 transition group-hover:opacity-100" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)", filter: "blur(8px)", zIndex: -1 }} />
            </div>
            <div>
              <div className="font-display text-base font-black tracking-tight" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ELIZADE FOODS
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Admin Portal</div>
            </div>
          </Link>
        </div>

        {/* Nav label */}
        <div className="px-5 pb-2 pt-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
          Management
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200"
                style={
                  active
                    ? {
                        background: `linear-gradient(135deg, ${n.from}, ${n.to_color})`,
                        boxShadow: `0 4px 16px ${n.glow}`,
                        color: "white",
                      }
                    : {}
                }
              >
                {/* Active indicator bar */}
                {active && (
                  <div
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ background: "white", opacity: 0.6 }}
                  />
                )}

                {/* Icon container */}
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-all duration-200 ${active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"}`}
                >
                  <n.icon className={`h-3.5 w-3.5 transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                </div>

                <span className={`transition-colors ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                  {n.label}
                </span>

                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}

                {/* Dot indicator when not active */}
                {!active && (
                  <div
                    className="ml-auto h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: n.dot }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="m-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black text-[#1A2B4C]" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)" }}>
              {(user?.email?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-[#F2A900]">{user?.email}</div>
              <div className="text-[10px] text-slate-500">{isSuper ? "Super Admin" : `${kitchenName ?? "Kitchen"} Admin`}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-2.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">

        {/* Mobile header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 backdrop-blur-md lg:hidden"
          style={{ background: "rgba(4,6,15,0.9)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)", boxShadow: "0 4px 12px rgba(242,169,0,0.4)" }}>
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-black" style={{ background: "linear-gradient(135deg, #F2A900, #F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ADMIN
            </span>
          </Link>

          <div className="flex gap-1">
            {navItems.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="grid h-8 w-8 place-items-center rounded-lg text-xs transition"
                  style={active ? { background: `linear-gradient(135deg, ${n.from}, ${n.to_color})`, boxShadow: `0 4px 12px ${n.glow}` } : {}}
                >
                  <n.icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-500"}`} />
                </Link>
              );
            })}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
