import type { Database } from "@/types/database";
import { supabase } from "@/lib/supabase";

import { classifyOccurrence } from "@/features/occurrences/catalog";
import type {
  AgencyId,
  NewOccurrenceInput,
  Occurrence,
  OccurrenceMedia,
  OccurrencePriority,
  OccurrenceStatus,
} from "@/features/occurrences/types";

type OccurrenceRow = Database["public"]["Tables"]["occurrences"]["Row"];
type ProtocolRow = Database["public"]["Tables"]["protocols"]["Row"];
type MediaRow = Database["public"]["Tables"]["occurrence_media"]["Row"];
type MunicipalityRow = Database["public"]["Tables"]["municipalities"]["Row"];

const priorityToDatabase: Record<OccurrencePriority, string> = {
  baixa: "low",
  media: "medium",
  alta: "high",
  critica: "critical",
};

const priorityFromDatabase: Record<string, OccurrencePriority> = {
  low: "baixa",
  medium: "media",
  high: "alta",
  critical: "critica",
};

const statusFromDatabase: Record<string, OccurrenceStatus> = {
  received: "recebida",
  in_analysis: "em_analise",
  forwarded: "encaminhada",
  in_service: "em_atendimento",
  resolved: "resolvida",
  cancelled: "cancelada",
};

const agencies = new Set<AgencyId>([
  "obras",
  "infraestrutura",
  "iluminacao",
  "meio_ambiente",
  "limpeza_urbana",
  "transito",
  "defesa_civil",
  "saude",
  "educacao",
  "protecao_animal",
  "administracao",
  "outro",
]);

function requireSupabase() {
  if (!supabase) {
    throw new Error("A configuração do Supabase não está disponível neste ambiente.");
  }

  return supabase;
}

function toPriority(priority: string): OccurrencePriority {
  const mapped = priorityFromDatabase[priority];
  if (!mapped) {
    throw new Error("A ocorrência possui uma prioridade inválida no banco de dados.");
  }

  return mapped;
}

function toStatus(status: string): OccurrenceStatus {
  const mapped = statusFromDatabase[status];
  if (!mapped) {
    throw new Error("A ocorrência possui um status inválido no banco de dados.");
  }

  return mapped;
}

function toAgency(agency: string | null): AgencyId {
  if (!agency || !agencies.has(agency as AgencyId)) {
    throw new Error("A ocorrência possui um órgão responsável inválido no banco de dados.");
  }

  return agency as AgencyId;
}

async function mediaUrl(media: MediaRow | undefined): Promise<OccurrenceMedia | null> {
  if (!media) return null;

  const client = requireSupabase();
  const { data, error } = await client.storage
    .from("occurrence-media")
    .createSignedUrl(media.storage_path, 60 * 30);

  if (error) throw error;

  const mimeType = media.mime_type;

  return {
    kind: media.media_type === "image" ? "photo" : "video",
    url: data.signedUrl,
    ...(mimeType !== null ? { mimeType } : {}),
  };
}

async function toOccurrence(
  row: OccurrenceRow,
  protocols: Map<string, ProtocolRow>,
  media: Map<string, MediaRow>,
  municipalities: Map<string, MunicipalityRow>,
): Promise<Occurrence> {
  const municipality = municipalities.get(row.municipality_id);

  return {
    id: row.id,
    protocol: row.protocol_id ? (protocols.get(row.protocol_id)?.protocol_code ?? null) : null,
    typeId: row.type_id,
    description: row.description,
    media: await mediaUrl(media.get(row.id)),
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
      municipality: municipality?.name ?? null,
      state: municipality?.state ?? null,
      neighborhood: row.neighborhood,
      locality: row.locality,
      address: row.address,
      manualLabel: row.latitude == null ? row.address : null,
    },
    priority: toPriority(row.priority),
    agency: toAgency(row.agency),
    status: toStatus(row.status),
    confirmations: row.confirmations_count,
    createdAt: row.created_at,
  };
}

export async function listMyOccurrences(): Promise<Occurrence[]> {
  const client = requireSupabase();
  const { data: rows, error: occurrencesError } = await client
    .from("occurrences")
    .select("*")
    .order("created_at", { ascending: false });

  if (occurrencesError) throw occurrencesError;
  if (rows.length === 0) return [];

  const protocolIds = rows.flatMap((row) => (row.protocol_id ? [row.protocol_id] : []));
  const municipalityIds = [...new Set(rows.map((row) => row.municipality_id))];

  const [
    { data: protocolRows, error: protocolsError },
    { data: mediaRows, error: mediaError },
    { data: municipalityRows, error: municipalitiesError },
  ] = await Promise.all([
    protocolIds.length > 0
      ? client.from("protocols").select("*").in("id", protocolIds)
      : Promise.resolve({ data: [] as ProtocolRow[], error: null }),
    client
      .from("occurrence_media")
      .select("*")
      .in(
        "occurrence_id",
        rows.map((row) => row.id),
      ),
    client.from("municipalities").select("*").in("id", municipalityIds),
  ]);

  if (protocolsError) throw protocolsError;
  if (mediaError) throw mediaError;
  if (municipalitiesError) throw municipalitiesError;

  const protocols = new Map((protocolRows ?? []).map((row) => [row.id, row]));
  const media = new Map((mediaRows ?? []).map((row) => [row.occurrence_id, row]));
  const municipalities = new Map((municipalityRows ?? []).map((row) => [row.id, row]));

  return Promise.all(rows.map((row) => toOccurrence(row, protocols, media, municipalities)));
}

function extensionFor(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  const extension = extensions[file.type];
  if (!extension) {
    throw new Error("Use JPG, PNG, WEBP, MP4 ou WEBM para a mídia da ocorrência.");
  }
  return extension;
}

async function uploadOccurrenceMedia(occurrenceId: string, userId: string, media: OccurrenceMedia) {
  if (!media.file) return media;
  if (media.file.size > 25 * 1024 * 1024) {
    throw new Error("A mídia da ocorrência deve ter no máximo 25 MB.");
  }

  const client = requireSupabase();
  const path = `${userId}/${occurrenceId}/${crypto.randomUUID()}.${extensionFor(media.file)}`;
  const { error: uploadError } = await client.storage
    .from("occurrence-media")
    .upload(path, media.file, { contentType: media.file.type, upsert: false });

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await client
    .from("occurrence_media")
    .insert({
      occurrence_id: occurrenceId,
      media_type: media.kind === "photo" ? "image" : "video",
      mime_type: media.file.type,
      storage_path: path,
    })
    .select()
    .single();

  if (insertError) {
    await client.storage.from("occurrence-media").remove([path]);
    throw insertError;
  }

  return mediaUrl(data);
}

export type CreatedOccurrence = {
  occurrence: Occurrence;
  mediaError: Error | null;
};

export async function createOccurrence(input: NewOccurrenceInput): Promise<CreatedOccurrence> {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Entre na sua conta para criar uma ocorrência.");

  const classification = classifyOccurrence({
    typeId: input.typeId,
    description: input.description,
  });
  const { data, error } = await client.rpc("create_occurrence", {
    p_type_id: input.typeId,
    p_description: input.description.trim(),
    p_latitude: input.location.latitude,
    p_longitude: input.location.longitude,
    p_address: input.location.address ?? input.location.manualLabel,
    p_neighborhood: input.location.neighborhood,
    p_locality: input.location.locality,
    p_priority: priorityToDatabase[classification.priority],
    p_agency: classification.agency,
  });

  if (error) throw error;
  const created = data[0];
  if (!created) throw new Error("O protocolo não foi retornado pelo servidor.");

  let savedMedia: OccurrenceMedia | null = null;
  let mediaError: Error | null = null;
  if (input.media) {
    try {
      savedMedia = await uploadOccurrenceMedia(created.occurrence_id, user.id, input.media);
    } catch (error) {
      mediaError = error instanceof Error ? error : new Error("Não foi possível salvar a mídia.");
    }
  }

  return {
    occurrence: {
      id: created.occurrence_id,
      protocol: created.protocol_code,
      typeId: input.typeId,
      description: input.description.trim(),
      media: savedMedia,
      location: input.location,
      priority: classification.priority,
      agency: classification.agency,
      status: "recebida",
      confirmations: 0,
      createdAt: created.created_at,
    },
    mediaError,
  };
}

export async function confirmOccurrence(id: string) {
  const client = requireSupabase();
  const { error } = await client.rpc("confirm_occurrence", {
    p_occurrence_id: id,
  });

  if (error) throw error;
}
