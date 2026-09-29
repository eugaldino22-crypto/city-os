import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type MunicipalFeedItem =
  Database["public"]["Functions"]["list_municipal_city_feed"]["Returns"][number];
export type MunicipalEvent =
  Database["public"]["Functions"]["list_municipal_city_events"]["Returns"][number];

function requireSupabase() {
  if (!supabase) {
    throw new Error("A configuração do Supabase não está disponível neste ambiente.");
  }

  return supabase;
}

/**
 * With a session, the database ignores a missing argument and derives the
 * tenant from auth.uid() -> citizen_profiles. The optional parameter exists
 * solely for the future explicit public municipality context.
 */
export async function listMunicipalCityFeed(
  municipalityId?: string | null,
): Promise<MunicipalFeedItem[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("list_municipal_city_feed", {
    p_municipality_id: municipalityId ?? null,
  });

  if (error) throw error;

  return data ?? [];
}

/** See listMunicipalCityFeed for the database-enforced tenancy contract. */
export async function listMunicipalCityEvents(
  municipalityId?: string | null,
): Promise<MunicipalEvent[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("list_municipal_city_events", {
    p_municipality_id: municipalityId ?? null,
  });

  if (error) throw error;

  return data ?? [];
}
