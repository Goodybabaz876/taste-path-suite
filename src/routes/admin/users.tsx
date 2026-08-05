import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search, UserPlus, X, Eye, EyeOff, Users, UserCheck,
  CalendarDays, Phone, Mail, Shield, Clock, ChevronLeft,
  ChevronRight, Pencil, Trash2, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ══════════════════════════════════════════════════════════
   SERVER FUNCTIONS  (run server-side using service-role key)
══════════════════════════════════════════════════════════ */

/** Create a new user account */
const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: unknown) =>
      d as { email: string; password: string; full_name: string; phone: string }
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Access denied");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: { full_name: data.full_name, phone: data.phone || null },
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    if (created.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: created.user.id,
        full_name: data.full_name,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  });

/** Update an existing user's profile (name + phone) */
const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: unknown) =>
      d as { userId: string; full_name: string; phone: string }
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Access denied");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Update auth user metadata
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      user_metadata: { full_name: data.full_name, phone: data.phone || null },
    });

    // Update profiles table
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Delete a user account entirely */
const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => d as { userId: string })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Access denied");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  confirmed_at: string | null;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const AVATAR_COLORS = [
  ["#7C3AED", "#4F46E5"],
  ["#06B6D4", "#2563EB"],
  ["#10B981", "#0D9488"],
  ["#F43F5E", "#EC4899"],
  ["#F2A900", "#F97316"],
  ["#8B5CF6", "#6366F1"],
];

function Avatar({ name, email, size = "md" }: { name: string; email: string; size?: "sm" | "md" }) {
  const initials = (name || email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const [from, to] = AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
  const sz = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={`${sz} grid shrink-0 place-items-center rounded-xl font-black text-white`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials}
    </div>
  );
}

async function getBearerToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return `Bearer ${session.access_token}`;
}

/* ══════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, from, to, glow }: {
  icon: React.ElementType; label: string; value: number | string;
  from: string; to: string; glow: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="absolute inset-0 opacity-[0.08]" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 font-display text-4xl font-black text-white">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 8px 20px ${glow}` }}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL FIELD
══════════════════════════════════════════════════════════ */
function ModalField({ label, value, onChange, placeholder, type = "text", icon, rightElement, optional }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ReactNode;
  rightElement?: React.ReactNode; optional?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
        {optional && <span className="normal-case tracking-normal font-normal text-slate-600">(optional)</span>}
      </div>
      <div className="relative">
        {icon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-600 transition focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${icon ? "pl-9" : "pl-3"} ${rightElement ? "pr-10" : "pr-3"}`}
        />
        {rightElement && <div className="absolute right-0 top-0 grid h-11 w-11 place-items-center">{rightElement}</div>}
      </div>
    </label>
  );
}

/* ══════════════════════════════════════════════════════════
   CREATE USER MODAL
══════════════════════════════════════════════════════════ */
function CreateUserModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => { setFullName(""); setEmail(""); setPassword(""); setPhone(""); };
  const close = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    try {
      await adminCreateUser({
        data: { email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim() },
        headers: { Authorization: await getBearerToken() },
      });
      toast.success(`✓ Account created for ${email}`);
      reset(); onSuccess(); onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0D1526 0%, #0A0F1E 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)" }}>
        <div className="mb-7 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 6px 16px rgba(124,58,237,0.4)" }}>
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black text-white">Create Account</h2>
              <p className="text-[11px] text-slate-500">User can log in immediately after creation</p>
            </div>
          </div>
          <button onClick={close} className="grid h-8 w-8 place-items-center rounded-xl text-slate-500 hover:bg-white/10 hover:text-white transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <ModalField label="Full Name *" value={fullName} onChange={setFullName} placeholder="Ada Obi" />
          <ModalField label="Email Address *" type="email" value={email} onChange={setEmail} placeholder="ada@example.com" icon={<Mail className="h-4 w-4 text-slate-500" />} />
          <ModalField label="Password *" type={showPw ? "text" : "password"} value={password} onChange={setPassword} placeholder="Min. 6 characters"
            rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-white transition">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          <ModalField label="Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="+234 800 000 0000" icon={<Phone className="h-4 w-4 text-slate-500" />} optional />
        </div>
        <button onClick={handleCreate} disabled={busy} className="mt-7 w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}>
          {busy ? "Creating account…" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EDIT USER MODAL
══════════════════════════════════════════════════════════ */
function EditUserModal({ user, onClose, onSuccess }: { user: AdminUser | null; onClose: () => void; onSuccess: () => void }) {
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [busy, setBusy] = useState(false);

  // Keep form in sync when user changes
  if (!user) return null;

  const handleSave = async () => {
    setBusy(true);
    try {
      await adminUpdateUser({
        data: { userId: user.id, full_name: fullName.trim(), phone: phone.trim() },
        headers: { Authorization: await getBearerToken() },
      });
      toast.success("✓ User updated successfully");
      onSuccess(); onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0D1526 0%, #0A0F1E 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)" }}>
        <div className="mb-7 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} email={user.email} />
            <div>
              <h2 className="font-display text-xl font-black text-white">Edit User</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-slate-500 hover:bg-white/10 hover:text-white transition"><X className="h-4 w-4" /></button>
        </div>

        {/* Read-only email */}
        <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Email (read-only)</p>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
        </div>

        <div className="space-y-4">
          <ModalField label="Full Name" value={fullName} onChange={setFullName} placeholder="Ada Obi" />
          <ModalField label="Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="+234 800 000 0000" icon={<Phone className="h-4 w-4 text-slate-500" />} optional />
        </div>
        <div className="mt-7 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-400 hover:bg-white/5 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={busy} className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #10B981, #0D9488)", boxShadow: "0 8px 20px rgba(16,185,129,0.35)" }}>
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function DeleteConfirmModal({ user, onClose, onSuccess }: { user: AdminUser | null; onClose: () => void; onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleDelete = async () => {
    setBusy(true);
    try {
      await adminDeleteUser({
        data: { userId: user.id },
        headers: { Authorization: await getBearerToken() },
      });
      toast.success(`✓ Deleted ${user.email}`);
      onSuccess(); onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-red-500/20 p-8 shadow-2xl text-center"
        style={{ background: "linear-gradient(135deg, #130808 0%, #0A0F1E 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="font-display text-xl font-black text-white">Delete Account?</h2>
        <p className="mt-2 text-sm text-slate-400">
          This will permanently delete <span className="font-semibold text-white">{user.email}</span> and all their data. This cannot be undone.
        </p>
        <div className="mt-7 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-400 hover:bg-white/5 transition">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={busy} className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-50">
            {busy ? "Deleting…" : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
const PAGE_SIZE = 15;

function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "pending">("all");
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_users" as never);
      if (error) throw error;
      return ((data as unknown) as AdminUser[]) ?? [];
    },
    refetchInterval: 30_000, // refresh every 30s so new signups appear
  });

  /* Derived stats */
  const confirmed = users.filter((u) => u.confirmed_at).length;
  const now = new Date();
  const thisMonth = users.filter((u) => {
    const d = new Date(u.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  /* Filter + search */
  const filtered = users.filter((u) => {
    if (filterStatus === "confirmed" && !u.confirmed_at) return false;
    if (filterStatus === "pending" && u.confirmed_at) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(s) ||
        u.full_name.toLowerCase().includes(s) ||
        u.phone.includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      {/* Modals */}
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={refresh} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={refresh} />
      <DeleteConfirmModal user={deletingUser} onClose={() => setDeletingUser(null)} onSuccess={refresh} />

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black"
              style={{ background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              User Management
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              All accounts automatically appear here as users sign up
            </p>
          </div>
          <button id="create-user-btn" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 20px rgba(124,58,237,0.35)" }}>
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Total Users" value={users.length}
            from="#7C3AED" to="#4F46E5" glow="rgba(124,58,237,0.35)" />
          <StatCard icon={UserCheck} label="Confirmed" value={confirmed}
            from="#10B981" to="#0D9488" glow="rgba(16,185,129,0.35)" />
          <StatCard icon={CalendarDays} label="New This Month" value={thisMonth}
            from="#F2A900" to="#F97316" glow="rgba(242,169,0,0.35)" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search name, email or phone…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          {(["all", "confirmed", "pending"] as const).map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(0); }}
              className={`rounded-full border px-4 py-1.5 text-[11px] font-bold capitalize transition ${
                filterStatus === s
                  ? "border-violet-500 bg-violet-500/20 text-violet-300"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.015)" }}>
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
                {["User", "Email", "Phone", "Joined", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-5 animate-pulse rounded-lg bg-white/10" />
                      </td>
                    </tr>
                  ))
                : pageUsers.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5">
                          <Users className="h-6 w-6 text-slate-600" />
                        </div>
                        <p className="text-slate-500">No users found</p>
                      </div>
                    </td>
                  </tr>
                )
                : pageUsers.map((u) => (
                    <tr key={u.id} className="group border-b border-white/5 transition hover:bg-white/[0.03]">

                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name} email={u.email} />
                          <div>
                            <div className="font-semibold text-white leading-tight">
                              {u.full_name || <span className="italic text-slate-500 font-normal">No name</span>}
                            </div>
                            <div className="font-mono text-[10px] text-slate-600">{u.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                          <span className="truncate max-w-[180px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5">
                        {u.phone
                          ? <div className="flex items-center gap-1.5 text-slate-300"><Phone className="h-3.5 w-3.5 shrink-0 text-slate-600" />{u.phone}</div>
                          : <span className="text-slate-600 italic text-xs">—</span>}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                          {fmt(u.created_at)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {u.confirmed_at
                          ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400"><Shield className="h-3 w-3" />Confirmed</span>
                          : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400"><Clock className="h-3 w-3" />Pending</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            id={`edit-user-${u.id.slice(0, 8)}`}
                            onClick={() => setEditingUser(u)}
                            title="Edit user"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-400"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            id={`delete-user-${u.id.slice(0, 8)}`}
                            onClick={() => setDeletingUser(u)}
                            title="Delete user"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Result count */}
        {!isLoading && (
          <p className="text-xs text-slate-600">
            Showing {pageUsers.length} of {filtered.length} users
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition ${page === i ? "text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
                  style={page === i ? { background: "linear-gradient(135deg, #7C3AED, #4F46E5)" } : {}}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
