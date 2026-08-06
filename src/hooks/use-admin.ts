import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type AdminScope = {
  isSuper: boolean;
  kitchenId: string | null;
  kitchenName: string | null;
  kitchenCode: string | null;
};

/** Returns the admin scope of the signed-in user.
 *  Super admin => full access. Kitchen admin => scoped to one kitchen. */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [scope, setScope] = useState<AdminScope | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setScope(null); setLoading(false); return; }

    supabase.rpc("get_my_admin_scope").then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      setScope(
        row
          ? {
              isSuper: row.is_super === true,
              kitchenId: row.kitchen_id ?? null,
              kitchenName: row.kitchen_name ?? null,
              kitchenCode: row.kitchen_code ?? null,
            }
          : null,
      );
      setLoading(false);
    });
  }, [user, authLoading]);

  return {
    isAdmin: !!scope,
    isSuper: scope?.isSuper ?? false,
    kitchenId: scope?.kitchenId ?? null,
    kitchenName: scope?.kitchenName ?? null,
    scope,
    loading,
  };
}
