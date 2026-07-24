import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Flame, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = schema.safeParse({ password, confirm });
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! Please sign in.");
      nav({ to: "/auth" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-elegant">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-hero shadow-glow">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-xl font-extrabold">ELIZADE&nbsp;FOODS</div>
            <div className="text-xs text-muted-foreground">Order · Track · Enjoy</div>
          </div>
        </Link>

        {/* Heading */}
        <div className="mt-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-white/5">
            <KeyRound className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black">Set new password</h1>
            <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Field label="New password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
          <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat your password" />
          <button
            onClick={submit}
            disabled={busy}
            className="mt-2 w-full rounded-xl gradient-hero py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
          >
            {busy ? "Updating..." : "Update password"}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Remembered it?{" "}
          <Link to="/auth" className="font-semibold text-accent hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-xl border border-border/60 bg-white/5 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
