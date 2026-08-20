import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useKitchens() {
  return useQuery({
    queryKey: ["kitchens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kitchens")
        .select("id, name, code, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data as { id: string; name: string; code: string; sort_order: number }[];
    },
  });
}
