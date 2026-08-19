import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Loads configurable platform settings from the app_settings table.
 *  Falls back to safe defaults while loading or on error. */
export function useAppSettings() {
  const q = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 min — these change rarely
  });

  const settings = q.data ?? {};
  return {
    deliveryFee: Number(settings["delivery_fee"] ?? 1000),
    vatRate:     Number(settings["vat_rate"]     ?? 0.075),
    isLoading:   q.isLoading,
  };
}
