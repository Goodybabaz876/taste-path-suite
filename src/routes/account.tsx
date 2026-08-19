import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, MapPin, Plus, Trash2, CreditCard, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const addresses = useQuery({
    queryKey: ["addresses", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("addresses").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const payments = useQuery({
    queryKey: ["payments", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("payment_methods").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    if (profile.data) { setName(profile.data.full_name ?? ""); setPhone(profile.data.phone ?? ""); }
  }, [profile.data]);

  const [newAddr, setNewAddr] = useState({ label: "Home", street: "", city: "Ondo", postal_code: "" });
  const [newCard, setNewCard] = useState({ brand: "Visa", last4: "", exp_month: 12, exp_year: 2028 });

  if (loading) return <AppShell><div className="h-64 animate-pulse rounded-2xl bg-[#E2E1D0]" /></AppShell>;
  if (!user) return (
    <AppShell>
      <div className="rounded-2xl border border-[#E2E1D0] bg-white p-10 text-center shadow-card">
        <User className="mx-auto h-10 w-10 text-[#F2A900]" />
        <div className="mt-3 font-display text-xl font-bold text-[#1A2B4C]">Sign in to manage your account</div>
        <Link to="/auth" className="mt-4 inline-flex rounded-xl bg-[#F2A900] px-4 py-2 text-xs font-extrabold text-[#1A2B4C] shadow-md hover:bg-[#E09B00] transition">
          Sign in
        </Link>
      </div>
    </AppShell>
  );

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: name, phone });
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  const addAddr = async () => {
    if (!newAddr.street) return toast.error("Street required");
    const { error } = await supabase.from("addresses").insert({ ...newAddr, user_id: user.id });
    if (error) return toast.error(error.message);
    setNewAddr({ label: "Home", street: "", city: "Ondo", postal_code: "" });
    qc.invalidateQueries({ queryKey: ["addresses"] });
    toast.success("Address saved");
  };
  const delAddr = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };
  const addCard = async () => {
    if (!/^\d{4}$/.test(newCard.last4)) return toast.error("Enter last 4 digits");
    const { error } = await supabase.from("payment_methods").insert({ ...newCard, user_id: user.id });
    if (error) return toast.error(error.message);
    setNewCard({ brand: "Visa", last4: "", exp_month: 12, exp_year: 2028 });
    qc.invalidateQueries({ queryKey: ["payments"] });
    toast.success("Card saved");
  };
  const delCard = async (id: string) => {
    await supabase.from("payment_methods").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["payments"] });
  };
  const signOut = async () => { await supabase.auth.signOut(); toast.success("Signed out"); nav({ to: "/auth" }); };

  return (
    <AppShell>
      <PageHeader title="Your account" subtitle={user.email ?? ""} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card title="Profile" icon={User}>
          <Field label="Full name"  value={name}  onChange={setName} />
          <Field label="Phone"      value={phone} onChange={setPhone} />
          <div className="mt-4 flex gap-2">
            <button
              onClick={saveProfile}
              className="rounded-xl bg-[#F2A900] px-4 py-2 text-xs font-extrabold text-[#1A2B4C] shadow-sm hover:bg-[#E09B00] transition"
            >
              Save profile
            </button>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E2E1D0] bg-white px-4 py-2 text-xs font-semibold text-[#4A5568] hover:bg-[#F3F2DF] transition"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </Card>

        {/* Delivery Addresses */}
        <Card title="Delivery addresses" icon={MapPin}>
          <div className="space-y-2">
            {(addresses.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-[#E2E1D0] bg-[#FAFAED] p-3 text-sm">
                <div>
                  <div className="font-semibold text-[#1A2B4C]">{a.label}</div>
                  <div className="text-xs text-[#4A5568]">{a.street}, {a.city} {a.postal_code}</div>
                </div>
                <button onClick={() => delAddr(a.id)} className="text-[#4A5568] hover:text-[#DC2626] transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Street" value={newAddr.street} onChange={(v) => setNewAddr({ ...newAddr, street: v })} className="sm:col-span-2" />
            <Field label="City"        value={newAddr.city}        onChange={(v) => setNewAddr({ ...newAddr, city: v })} />
            <Field label="Postal code" value={newAddr.postal_code} onChange={(v) => setNewAddr({ ...newAddr, postal_code: v })} />
          </div>
          <button
            onClick={addAddr}
            className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#F2A900] px-3 py-2 text-xs font-extrabold text-[#1A2B4C] shadow-sm hover:bg-[#E09B00] transition"
          >
            <Plus className="h-3 w-3" /> Add address
          </button>
        </Card>

        {/* Saved Payment Methods */}
        <Card title="Saved payment methods" icon={CreditCard}>
          <div className="space-y-2">
            {(payments.data ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#E2E1D0] bg-[#FAFAED] p-3 text-sm">
                <div>
                  <div className="font-semibold text-[#1A2B4C]">{p.brand} •••• {p.last4}</div>
                  <div className="text-xs text-[#4A5568]">Expires {p.exp_month}/{p.exp_year}</div>
                </div>
                <button onClick={() => delCard(p.id)} className="text-[#4A5568] hover:text-[#DC2626] transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Field label="Brand"  value={newCard.brand}  onChange={(v) => setNewCard({ ...newCard, brand: v })} />
            <Field label="Last 4" value={newCard.last4}  onChange={(v) => setNewCard({ ...newCard, last4: v.replace(/\D/g, "").slice(0, 4) })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="MM"   value={String(newCard.exp_month)} onChange={(v) => setNewCard({ ...newCard, exp_month: Math.min(12, Math.max(1, +v || 1)) })} />
              <Field label="YYYY" value={String(newCard.exp_year)}  onChange={(v) => setNewCard({ ...newCard, exp_year: +v || 2028 })} />
            </div>
          </div>
          <button
            onClick={addCard}
            className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#F2A900] px-3 py-2 text-xs font-extrabold text-[#1A2B4C] shadow-sm hover:bg-[#E09B00] transition"
          >
            <Plus className="h-3 w-3" /> Add card
          </button>
        </Card>
      </div>
    </AppShell>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function Card({
  title, icon: Icon, children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E1D0] bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-[#1A2B4C]">
        {Icon && <Icon className="h-4 w-4 text-[#F2A900]" />} {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, className,
}: {
  label: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <div className="text-[11px] font-bold uppercase tracking-widest text-[#4A5568]">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[#E2E1D0] bg-[#FAFAED] px-3 text-sm text-[#1A2B4C] focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
      />
    </label>
  );
}
