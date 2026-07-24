import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

/** Returns whether the currently signed-in user holds the 'admin' role.
 *  Uses the security-definer `is_admin()` RPC so it can't be spoofed client-side. */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); setLoading(false); return; }

    supabase.rpc("is_admin").then(({ data }) => {
      setIsAdmin(data === true);
      setLoading(false);
    });
  }, [user, authLoading]);

  return { isAdmin, loading };
}
