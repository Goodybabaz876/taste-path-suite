import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Trash2, ChefHat, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/staff")({ component: AdminStaff });

type AdminUser = { id: string; email: string; full_name: string };
type Kitchen = { id: string; name: string; code: string };
type RoleRow = { id: string; user_id: string; kitchen_id: string | null };

function AdminStaff() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [kitchenId, setKitchenId] = useState("");
  const [busy, setBusy] = useState(false);

  const users = useQuery({
    queryKey: ["admin-users-basic"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_users");
      if (error) throw error;
      return (data as unknown) as AdminUser[];
    },
  });

  const kitchens = useQuery({
    queryKey: ["kitchens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kitchens").select("id,name,code").order("sort_order");
      if (error) throw error;
      return data as Kitchen[];
    },
  });

  const roles = useQuery({
    queryKey: ["kitchen-admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, kitchen_id")
        .eq("role", "admin")
        .not("kitchen_id", "is", null);
      if (error) throw error;
      return data as RoleRow[];
    },
  });

  const emailOf = (id: string) => users.data?.find((u) => u.id === id)?.email ?? id;
  const kitchenOf = (id: string | null) => kitchens.data?.find((k) => k.id === id)?.name ?? "—";

  const grant = async () => {
    if (!userId || !kitchenId) return toast.error("Pick a user and a kitchen");
    setBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin", kitchen_id: kitchenId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Kitchen admin added");
    setUserId(""); setKitchenId("");
    qc.invalidateQueries({ queryKey: ["kitchen-admin-roles"] });
  };

  const revoke = async (id: string) => {
    if (!confirm("Remove this kitchen admin?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Access removed");
    qc.invalidateQueries({ queryKey: ["kitchen-admin-roles"] });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-white">Kitchen Admins</h1>
        <p className="mt-1 text-sm text-slate-400">
          Give a cafeteria's IT staff their own admin portal — they can only manage their kitchen's meals and orders.
        </p>
      </div>

      {/* Grant access */}
      <div className="mb-8 rounded-2xl border border-[#F2A900]/30 bg-[#0E1B31] p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2 font-display text-lg font-black text-[#F2A900]">
          <ShieldCheck className="h-5 w-5" /> Grant kitchen access
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">User account</div>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-[#F2A900] focus:outline-none"
            >
              <option value="" className="bg-[#0E1B31]">Select a user…</option>
              {users.data?.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0E1B31]">{u.email}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kitchen</div>
            <select
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-[#F2A900] focus:outline-none"
            >
              <option value="" className="bg-[#0E1B31]">Select a kitchen…</option>
              {kitchens.data?.map((k) => (
                <option key={k.id} value={k.id} className="bg-[#0E1B31]">{k.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={grant}
              disabled={busy}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#F2A900] text-sm font-extrabold text-[#1A2B4C] shadow-md disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {busy ? "Saving…" : "Grant access"}
            </button>
          </div>
        </div>
      </div>

      {/* Existing kitchen admins */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {["Admin", "Kitchen", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(roles.data ?? []).length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No kitchen admins yet.</td></tr>
            ) : roles.data!.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-bold text-white">{emailOf(r.user_id)}</td>
                <td className="px-4 py-3 text-slate-300">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    <ChefHat className="h-3.5 w-3.5" /> {kitchenOf(r.kitchen_id)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => revoke(r.id)}
                    aria-label="Remove access"
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
