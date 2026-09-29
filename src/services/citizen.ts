import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type CitizenProfile = Database["public"]["Tables"]["citizen_profiles"]["Row"];
export type ActiveMunicipality = Database["public"]["Tables"]["municipalities"]["Row"];
export type CitizenProfileUpdate = Pick<CitizenProfile, "full_name" | "phone" | "avatar_path">;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  return supabase;
}

export async function getCurrentCitizenProfile(): Promise<CitizenProfile | null> {
  const client = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await client
    .from("citizen_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureCurrentCitizenProfile(
  initialName?: string | null,
): Promise<CitizenProfile | null> {
  const client = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const existing = await getCurrentCitizenProfile();

  if (existing) {
    return existing;
  }

  const metadataName = user.user_metadata["full_name"];
  const name = initialName?.trim() || (typeof metadataName === "string" ? metadataName : null);

  const { data, error } = await client
    .from("citizen_profiles")
    .insert({
      id: user.id,
      full_name: name,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCurrentCitizenProfile(
  input: Partial<CitizenProfileUpdate>,
): Promise<CitizenProfile> {
  const client = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await client
    .from("citizen_profiles")
    .update(input)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * The only browser-accessible municipality mutation. The database allows it
 * once, validates that the municipality is active, and derives the citizen
 * from auth.uid(). GPS is intentionally not an input to this operation.
 */
export async function linkCurrentCitizenMunicipality(
  municipalityId: string,
): Promise<CitizenProfile> {
  const client = requireSupabase();
  const { error } = await client.rpc("link_current_citizen_municipality", {
    p_municipality_id: municipalityId,
  });

  if (error) {
    throw error;
  }

  const profile = await getCurrentCitizenProfile();

  if (!profile) {
    throw new Error("O perfil do cidadão não foi encontrado após o vínculo do município.");
  }

  return profile;
}

export async function listActiveMunicipalities(): Promise<ActiveMunicipality[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("municipalities")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}
