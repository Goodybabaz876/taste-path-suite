import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";

/**
 * Main admin entry point — floating action button pinned to the bottom-right
 * of the web app. It only ever *navigates*; access control lives in the admin
 * routes themselves, so it can never grant app or admin access on its own.
 */
export function AdminFab() {
  const { isAdmin, isSuper, kitchenName, loading } = useAdmin();

  if (loading || !isAdmin) return null;

  const to = isSuper ? "/admin" : "/kitchen-admin";
  const label = isSuper ? "Admin Panel" : `${kitchenName ?? "Kitchen"} Panel`;

  return (
    <Link
      to={to}
      aria-label={`Open ${label}`}
      className="group fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-2xl border border-[#F2A900]/50 bg-[#0E1B31] px-4 py-3 text-xs font-black text-[#F2A900] shadow-2xl transition hover:bg-[#14243F] hover:shadow-[0_10px_30px_rgba(242,169,0,0.35)] active:scale-95 lg:bottom-6 lg:right-6"
    >
      <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#F2A900]">
        <ShieldCheck className="h-4 w-4 text-[#1A2B4C]" aria-hidden="true" />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
