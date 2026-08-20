import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, ShoppingBag, User, ChefHat, ClipboardList, LogIn, LogOut, ChevronDown } from "lucide-react";
import { useCart } from "@/lib/cart";
import { AdminFab } from "@/components/AdminFab";
import { useAuth } from "@/hooks/use-auth";
import { useKitchens } from "@/hooks/use-kitchens";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ReactNode } from "react";

const NAV = [
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/orders", label: "My Orders", icon: ClipboardList },
  { to: "/account", label: "Account", icon: User },
];



function KitchensDropdown() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeKitchen = useRouterState({
    select: (s) => (s.location.search as { kitchen?: string }).kitchen,
  });
  const onMenu = pathname === "/";
  const [open, setOpen] = useState(onMenu);
  const kitchens = useKitchens();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="kitchens-menu"
        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-extrabold transition ${
          onMenu ? "bg-[#F2A900] text-[#1A2B4C] shadow-md" : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <ChefHat className={`h-4 w-4 ${onMenu ? "text-[#1A2B4C]" : "text-[#F2A900]"}`} />
        Kitchens
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
            onMenu ? "text-[#1A2B4C]" : "text-[#F2A900]"
          }`}
        />
      </button>

      {open && (
        <div id="kitchens-menu" className="mt-1.5 space-y-1 rounded-xl border border-[#F2A900]/25 bg-[#1A2B4C]/70 p-1.5">
          <Link
            to="/"
            search={{}}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
              onMenu && !activeKitchen ? "bg-[#F2A900]/20 text-[#F2A900]" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#F2A900]" />
            All Kitchens
          </Link>
          {kitchens.data?.map((k) => {
            const active = onMenu && activeKitchen === k.code;
            return (
              <Link
                key={k.id}
                to="/"
                search={{ kitchen: k.code }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  active ? "bg-[#F2A900] text-[#1A2B4C] shadow" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#1A2B4C]" : "bg-[#F2A900]/60"}`} />
                {k.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeKitchen = useRouterState({
    select: (s) => (s.location.search as { kitchen?: string }).kitchen,
  });
  const nav = useNavigate();
  const [kitchenSheet, setKitchenSheet] = useState(false);
  const kitchens = useKitchens();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-[#FAFAED] text-[#1A2B4C]">
      {/* Skip-to-content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-[#F2A900] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#1A2B4C] focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-[#1A2B4C] bg-[#0E1B31] text-white shadow-2xl lg:flex">
        <Link to="/" className="flex items-center gap-3 px-6 pb-6 pt-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2A900] shadow-md">
            <Flame className="h-6 w-6 text-[#1A2B4C]" />
          </div>
          <div>
            <div className="font-display text-xl font-black tracking-tight text-[#F2A900]">ELIZADE&nbsp;FOODS</div>
            <div className="text-xs font-semibold text-slate-300">Order · Track · Enjoy</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1.5 px-4">
          <div className="px-3 pb-2 pt-4 text-[11px] font-black uppercase tracking-widest text-[#F2A900]/70">Explore</div>
          <KitchensDropdown />

          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-extrabold transition ${
                  active
                    ? "bg-[#F2A900] text-[#1A2B4C] shadow-md"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <n.icon className={`h-4 w-4 ${active ? "text-[#1A2B4C]" : "text-[#F2A900]"}`} />
                {n.label}
                {n.to === "/cart" && count > 0 && (
                  <span className={`ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-black ${active ? "bg-[#1A2B4C] text-[#F2A900]" : "bg-[#F2A900] text-[#1A2B4C]"}`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}

        </nav>

        <div className="m-4 rounded-2xl border border-[#F2A900]/30 bg-[#1A2B4C]/80 p-4">
          {user ? (
            <>
              <div className="text-xs font-bold text-[#F2A900] truncate">{user.email}</div>
              <div className="mt-1 text-[11px] font-medium text-slate-300">Signed in</div>
              <button
                onClick={handleSignOut}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-[#F2A900]/30 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 text-xs font-extrabold text-[#F2A900] hover:underline">
              <LogIn className="h-4 w-4 text-[#F2A900]" /> Sign in for faster checkout
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#E2E1D0] bg-[#FAFAED]/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#F2A900]"><Flame className="h-4 w-4 text-[#1A2B4C]" /></div>
              <span className="font-display font-black text-[#1A2B4C]">ELIZADE FOODS</span>
            </Link>
            <Link to="/cart" className="relative ml-auto grid h-10 w-10 place-items-center rounded-xl bg-white border border-[#E2E1D0]">
              <ShoppingBag className="h-4 w-4 text-[#1A2B4C]" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#F2A900] px-1 text-[10px] font-black text-[#1A2B4C]">{count}</span>
              )}
            </Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-10">{children}</main>

        {/* Mobile kitchens sheet */}
        {kitchenSheet && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close kitchens menu"
              onClick={() => setKitchenSheet(false)}
              className="absolute inset-0 bg-black/50"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[#F2A900]/30 bg-[#0E1B31] p-4 pb-24 text-white shadow-2xl">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
              <div className="px-1 pb-2 text-[11px] font-black uppercase tracking-widest text-[#F2A900]/70">Kitchens</div>
              <div className="space-y-1.5">
                <Link
                  to="/"
                  search={{}}
                  onClick={() => setKitchenSheet(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
                    pathname === "/" && !activeKitchen ? "bg-[#F2A900] text-[#1A2B4C]" : "bg-white/5 text-slate-200"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  All Kitchens
                </Link>
                {kitchens.data?.map((k) => {
                  const active = pathname === "/" && activeKitchen === k.code;
                  return (
                    <Link
                      key={k.id}
                      to="/"
                      search={{ kitchen: k.code }}
                      onClick={() => setKitchenSheet(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
                        active ? "bg-[#F2A900] text-[#1A2B4C]" : "bg-white/5 text-slate-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {k.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-[#1A2B4C] bg-[#0E1B31] text-white lg:hidden">
          <div className="grid grid-cols-4">
            <button
              type="button"
              onClick={() => setKitchenSheet((o) => !o)}
              aria-expanded={kitchenSheet}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${pathname === "/" ? "text-[#F2A900]" : "text-slate-400"}`}
            >
              <span className="flex items-center gap-0.5">
                <ChefHat className="h-4 w-4" />
                <ChevronDown className={`h-3 w-3 transition-transform ${kitchenSheet ? "rotate-180" : ""}`} />
              </span>
              Kitchens
            </button>
            {NAV.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link key={n.to} to={n.to} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${active ? "text-[#F2A900]" : "text-slate-400"}`}>
                  <div className="relative">
                    <n.icon className="h-4 w-4" />
                    {n.to === "/cart" && count > 0 && (
                      <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#F2A900] px-1 text-[9px] font-black text-[#1A2B4C]">
                        {count}
                      </span>
                    )}
                  </div>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Admin entry point — only renders for admins */}
        <AdminFab />
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-black tracking-tight text-[#1A2B4C] sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm font-medium text-[#4A5568]">{subtitle}</p>}
    </div>
  );
}
