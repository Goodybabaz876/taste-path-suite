import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Home, ShoppingBag, User, Utensils, ClipboardList, LogIn } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Menu", icon: Utensils },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/orders", label: "My Orders", icon: ClipboardList },
  { to: "/account", label: "Account", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border/60 gradient-surface lg:flex">
        <Link to="/" className="flex items-center gap-3 px-6 pb-6 pt-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-hero shadow-glow">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-xl font-extrabold tracking-tight">ELIZADE&nbsp;FOODS</div>
            <div className="text-xs text-muted-foreground">Order · Track · Enjoy</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-4">
          <div className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Explore</div>
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary/20 text-foreground shadow-[inset_0_0_0_1px] shadow-primary/40"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
                {n.to === "/cart" && count > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          {user ? (
            <>
              <div className="text-sm font-semibold truncate">{user.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">Signed in</div>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 text-sm font-semibold">
              <LogIn className="h-4 w-4 text-accent" /> Sign in for faster checkout
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/50 glass lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-hero"><Flame className="h-4 w-4 text-white" /></div>
              <span className="font-display font-extrabold">ELIZADE FOODS</span>
            </Link>
            <Link to="/cart" className="relative ml-auto grid h-10 w-10 place-items-center rounded-xl bg-white/5">
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{count}</span>
              )}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-10">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 glass lg:hidden">
          <div className="grid grid-cols-4">
            {NAV.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
