import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Flame, Eye, EyeOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({ redirect: s.redirect as string | undefined }),
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  full_name: z.string().trim().max(80).optional(),
});

function AuthPage() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("elizade-remember-email");
    if (saved) setEmail(saved);
  }, []);

  const submit = async () => {
    const r = schema.safeParse({ email, password, full_name: name });
    if (!r.success) return toast.error(r.error.issues[0].message);
    
    if (rememberMe) {
      localStorage.setItem("elizade-remember-email", email);
    } else {
      localStorage.removeItem("elizade-remember-email");
    }

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
      nav({ to: adminMode ? "/admin" : (redirect || "/") });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    if (!email.trim()) return toast.error("Enter your email first");
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent — check your inbox!");
      setMode("signin");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  /* ── Forgot-password mode ── */
  if (mode === "forgot") {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="relative w-full max-w-md">
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-elegant">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-hero shadow-glow"><Flame className="h-5 w-5 text-white" /></div>
              <div>
                <div className="font-display text-xl font-extrabold">ELIZADE&nbsp;FOODS</div>
                <div className="text-xs text-muted-foreground">Order · Track · Enjoy</div>
              </div>
            </Link>

            <h1 className="mt-6 font-display text-2xl font-black">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your account email and we'll send you a reset link.</p>

            <div className="mt-6 space-y-3">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <button onClick={sendReset} disabled={busy} className="mt-2 w-full rounded-xl gradient-hero py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
                {busy ? "Sending..." : "Send reset link"}
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <button onClick={() => setMode("signin")} className="font-semibold text-accent hover:underline">← Back to sign in</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="relative w-full max-w-md">
        
        {/* User Login Form */}
        <div className={adminMode ? "hidden" : "block"}>
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-elegant">
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
              <div>
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {mode === "signin" && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold">
                    <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground hover:text-slate-600 transition">
                      <div className={`grid h-3.5 w-3.5 place-items-center rounded border transition ${rememberMe ? "border-[#F2A900] bg-[#F2A900] text-[#1A2B4C]" : "border-[#E2E1D0] bg-white"}`}>
                        {rememberMe && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
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

        {/* Admin Login Form */}
        <div className={adminMode ? "block" : "hidden"}>
          <div className="rounded-3xl border border-[#F2A900]/20 bg-[#0E1B31] p-8 shadow-2xl shadow-[#0E1B31]/50 text-white">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2A900] shadow-glow"><Flame className="h-5 w-5 text-[#1A2B4C]" /></div>
              <div>
                <div className="font-display text-xl font-extrabold text-[#F2A900]">ELIZADE&nbsp;FOODS</div>
                <div className="text-xs text-slate-400">Admin Portal</div>
              </div>
            </Link>

            <h1 className="mt-6 font-display text-2xl font-black">Admin Access</h1>
            <p className="mt-1 text-sm text-slate-400">Secure entry for staff and administrators.</p>

            <div className="mt-6 space-y-3">
              <label className="block">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin ID</div>
                <div className="relative mt-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-3 pr-3 text-sm text-white placeholder-slate-500 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
                  />
                </div>
              </label>

              <label className="block">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Password</div>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30"
                  />
                  <div className="absolute right-0 top-0 grid h-11 w-11 place-items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-slate-400 hover:text-white transition">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </label>

              <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-xl bg-[#F2A900] py-3 text-sm font-semibold text-[#1A2B4C] hover:bg-[#E09B00] shadow-glow disabled:opacity-60 transition">
                {busy ? "Authenticating..." : "Sign in to Dashboard"}
              </button>
            </div>
            
            <div className="mt-6 text-center text-xs">
              <button onClick={() => setAdminMode(false)} className="font-semibold text-slate-400 hover:text-white transition">
                ← Back to user login
              </button>
            </div>
          </div>
        </div>

        {/* ── Admin entry ── stealth mode */}
        <button
          type="button"
          onClick={() => setAdminMode(!adminMode)}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute -bottom-8 right-0 cursor-default px-2 py-1 text-[10px] font-medium text-transparent transition-colors duration-300 hover:text-slate-600"
        >
          admin access
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", rightElement }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rightElement?: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="relative mt-1.5">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border border-[#E2E1D0] bg-white pl-3 ${rightElement ? "pr-10" : "pr-3"} text-sm text-[#1A2B4C] placeholder-slate-400 focus:border-[#F2A900] focus:outline-none focus:ring-2 focus:ring-[#F2A900]/30`}
        />
        {rightElement && <div className="absolute right-0 top-0 grid h-11 w-11 place-items-center">{rightElement}</div>}
      </div>
    </label>
  );
}
