import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, MapPin, Plus, Trash2, CreditCard } from "lucide-react";
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

  if (loading) return <AppShell><div className="h-64 animate-pulse rounded-2xl bg-white/5" /></AppShell>;
  if (!user) return (
    <AppShell>
      <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
        <div className="font-display text-xl font-bold">Sign in to manage your account</div>
        <Link to="/auth" className="mt-4 inline-flex rounded-xl gradient-hero px-4 py-2 text-xs font-semibold text-white shadow-glow">Sign in</Link>
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
        <Card title="Profile">
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <button onClick={saveProfile} className="mt-3 rounded-xl gradient-hero px-4 py-2 text-xs font-semibold text-white shadow-glow">Save profile</button>
          <button onClick={signOut} className="ml-2 inline-flex items-center gap-1 rounded-xl border border-border/60 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10">
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </Card>

        <Card title="Delivery addresses" icon={MapPin}>
          <div className="space-y-2">
            {(addresses.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-white/5 p-3 text-sm">
                <div>
                  <div className="font-semibold">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.street}, {a.city} {a.postal_code}</div>
                </div>
                <button onClick={() => delAddr(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Street" value={newAddr.street} onChange={(v) => setNewAddr({ ...newAddr, street: v })} className="sm:col-span-2" />
            <Field label="City" value={newAddr.city} onChange={(v) => setNewAddr({ ...newAddr, city: v })} />
            <Field label="Postal code" value={newAddr.postal_code} onChange={(v) => setNewAddr({ ...newAddr, postal_code: v })} />
          </div>
          <button onClick={addAddr} className="mt-2 inline-flex items-center gap-1 rounded-xl gradient-hero px-3 py-2 text-xs font-semibold text-white shadow-glow">
            <Plus className="h-3 w-3" /> Add address
          </button>
        </Card>

        <Card title="Saved payment methods" icon={CreditCard}>
          <div className="space-y-2">
            {(payments.data ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-white/5 p-3 text-sm">
                <div>
                  <div className="font-semibold">{p.brand} •••• {p.last4}</div>
                  <div className="text-xs text-muted-foreground">Expires {p.exp_month}/{p.exp_year}</div>
                </div>
                <button onClick={() => delCard(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Field label="Brand" value={newCard.brand} onChange={(v) => setNewCard({ ...newCard, brand: v })} />
            <Field label="Last 4" value={newCard.last4} onChange={(v) => setNewCard({ ...newCard, last4: v.replace(/\D/g, "").slice(0, 4) })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="MM" value={String(newCard.exp_month)} onChange={(v) => setNewCard({ ...newCard, exp_month: Math.min(12, Math.max(1, +v || 1)) })} />
              <Field label="YYYY" value={String(newCard.exp_year)} onChange={(v) => setNewCard({ ...newCard, exp_year: +v || 2028 })} />
            </div>
          </div>
          <button onClick={addCard} className="mt-2 inline-flex items-center gap-1 rounded-xl gradient-hero px-3 py-2 text-xs font-semibold text-white shadow-glow">
            <Plus className="h-3 w-3" /> Add card
          </button>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: typeof MapPin; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
        {Icon && <Icon className="h-4 w-4 text-accent" />} {title}
      </div>
      {children}
    </div>
  );
}
function Field({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-white/5 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}
