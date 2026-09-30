import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import { updateCurrentCitizenProfileServer } from "./citizen.server";

export type CitizenProfile = Database["public"]["Tables"]["citizen_profiles"]["Row"];
export type ActiveMunicipality = Database["public"]["Tables"]["municipalities"]["Row"];
export type CitizenProfileUpdate = Pick<CitizenProfile, "full_name" | "phone" | "avatar_path">;

export const citizenAvatarBucket = "citizen-avatars";
export const citizenAvatarMaxBytes = 5 * 1024 * 1024;

const avatarMimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AvatarMimeType = keyof typeof avatarMimeToExtension;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Sua sessão expirou. Entre novamente para continuar.");
    this.name = "AuthenticationRequiredError";
  }
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  return supabase;
}

async function requireAuthenticatedCitizen() {
  const client = requireSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new AuthenticationRequiredError();
  }

  return { client, user };
}

function isAvatarMimeType(type: string): type is AvatarMimeType {
  return Object.prototype.hasOwnProperty.call(avatarMimeToExtension, type);
}

export function validateCitizenAvatarFile(file: File) {
  if (!isAvatarMimeType(file.type)) {
    throw new Error("Selecione uma imagem JPG, PNG ou WebP.");
  }

  if (file.size <= 0) {
    throw new Error("A imagem selecionada está vazia.");
  }

  if (file.size > citizenAvatarMaxBytes) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
}

function getCurrentCitizenAvatarPath(citizenId: string, mimeType: AvatarMimeType) {
  return `${citizenId}/avatar.${avatarMimeToExtension[mimeType]}`;
}

function isCurrentCitizenAvatarPath(citizenId: string, avatarPath: string) {
  return ["jpg", "jpeg", "png", "webp"].some(
    (extension) => avatarPath === `${citizenId}/avatar.${extension}`,
  );
}

export async function getCurrentCitizenProfile(): Promise<CitizenProfile | null> {
  const { client, user } = await requireAuthenticatedCitizen();

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
  const { client, user } = await requireAuthenticatedCitizen();

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
  // This client-side check produces a clear redirectable error for an expired
  // cookie. The mutation itself is still re-authenticated by the same-origin
  // server function, which derives the profile id from auth.getUser().
  await requireAuthenticatedCitizen();

  try {
    return await updateCurrentCitizenProfileServer({ data: input });
  } catch (error) {
    if (
      error instanceof Error &&
      /AUTHENTICATION_REQUIRED|Auth session missing|JWT expired/i.test(error.message)
    ) {
      throw new AuthenticationRequiredError();
    }

    throw error;
  }
}

export async function uploadCurrentCitizenAvatar(file: File): Promise<CitizenProfile> {
  validateCitizenAvatarFile(file);

  const { client, user } = await requireAuthenticatedCitizen();
  const path = getCurrentCitizenAvatarPath(user.id, file.type as AvatarMimeType);
  const { error } = await client.storage.from(citizenAvatarBucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (error) {
    throw error;
  }

  // Only the storage path is persisted. The URL is ephemeral and generated
  // below with a signed request for the authenticated owner.
  return updateCurrentCitizenProfile({ avatar_path: path });
}

export async function getCurrentCitizenAvatarUrl(
  avatarPath: string | null,
  updatedAt: string | null | undefined,
): Promise<string | null> {
  if (!avatarPath) {
    return null;
  }

  const { client, user } = await requireAuthenticatedCitizen();

  if (!isCurrentCitizenAvatarPath(user.id, avatarPath)) {
    throw new Error("O caminho do avatar não pertence ao cidadão autenticado.");
  }

  const { data, error } = await client.storage
    .from(citizenAvatarBucket)
    .createSignedUrl(avatarPath, 60 * 60);

  if (error) {
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error("Não foi possível gerar uma URL segura para o avatar.");
  }

  const version = updatedAt ? `&v=${encodeURIComponent(updatedAt)}` : "";
  return `${data.signedUrl}${version}`;
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
