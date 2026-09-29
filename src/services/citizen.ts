import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type CitizenProfile = Database["public"]["Tables"]["citizen_profiles"]["Row"];
export type ActiveMunicipality = Database["public"]["Tables"]["municipalities"]["Row"];

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

export async function updateCurrentCitizenProfile(input: {
  full_name?: string | null;
  phone?: string | null;
  avatar_path?: string | null;
  municipality_id?: string | null;
}): Promise<CitizenProfile> {
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
    .upsert({
      id: user.id,
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
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
