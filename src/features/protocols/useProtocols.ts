import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type CitizenProtocol = Database["public"]["Tables"]["protocols"]["Row"];

async function listMyProtocols(): Promise<CitizenProtocol[]> {
  if (!supabase) {
    throw new Error("A configuração do Supabase não está disponível neste ambiente.");
  }

  const { data, error } = await supabase
    .from("protocols")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export function useProtocols() {
  const { user, loading, configured } = useAuth();

  return useQuery({
    queryKey: ["protocols", user?.id],
    queryFn: listMyProtocols,
    enabled: configured && !loading && Boolean(user),
  });
}
