import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : "/" }),
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  full_name: z.string().trim().max(80).optional(),
});

function AuthPage() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = schema.safeParse({ email, password, full_name: name });
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      nav({ to: redirect || "/" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-elegant">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-hero shadow-glow"><Flame className="h-5 w-5 text-white" /></div>
          <div>
            <div className="font-display text-xl font-extrabold">ELIZADE&nbsp;FOODS</div>
            <div className="text-xs text-muted-foreground">Order · Track · Enjoy</div>
          </div>
        </Link>

        <h1 className="mt-6 font-display text-2xl font-black">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to place orders and track them live." : "Sign up in seconds to start ordering."}</p>

        <div className="mt-6 space-y-3">
          {mode === "signup" && (
            <Field label="Full name" value={name} onChange={setName} placeholder="Ada Obi" />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
          <button onClick={submit} disabled={busy} className="mt-2 w-full rounded-xl gradient-hero py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to ELIZADE FOODS?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-accent hover:underline">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 h-11 w-full rounded-xl border border-border/60 bg-white/5 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}
