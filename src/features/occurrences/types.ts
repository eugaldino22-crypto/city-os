/**
 * Central de Ocorrências — tipos base do City OS.
 * Estrutura preparada para futura integração com backend e órgãos municipais.
 */

export type OccurrencePriority =
  | "baixa"
  | "media"
  | "alta"
  | "critica";

export type OccurrenceStatus =
  | "recebida"
  | "em_analise"
  | "encaminhada"
  | "em_atendimento"
  | "resolvida"
  | "cancelada";

export type AgencyId =
  | "obras"
  | "infraestrutura"
  | "iluminacao"
  | "meio_ambiente"
  | "limpeza_urbana"
  | "transito"
  | "defesa_civil"
  | "saude"
  | "educacao"
  | "protecao_animal"
  | "administracao"
  | "outro";

export type OccurrenceIconKey =
  | "animal"
  | "acidente"
  | "incendio"
  | "risco"
  | "buraco"
  | "via"
  | "calcada"
  | "sinalizacao"
  | "semaforo"
  | "lampada"
  | "poste"
  | "fiacao"
  | "arvore"
  | "poda"
  | "lixo"
  | "entulho"
  | "alagamento"
  | "agua"
  | "esgoto"
  | "praca"
  | "escola"
  | "saude"
  | "equipamento"
  | "denuncia"
  | "solicitacao"
  | "outro";

export type OccurrenceType = {
  id: string;
  label: string;
  groupId: string;
  icon: OccurrenceIconKey;
  agency: AgencyId;
  defaultPriority: OccurrencePriority;
  /** Sugestões contextuais de descrição. */
  hints: string[];
};

export type OccurrenceGroup = {
  id: string;
  label: string;
  icon: OccurrenceIconKey;
};

export type OccurrenceLocation = {
  latitude: number | null;
  longitude: number | null;
  municipality: string | null;
  state: string | null;
  neighborhood: string | null;
  locality: string | null;
  address: string | null;
  /** Local informado manualmente quando o GPS não está disponível. */
  manualLabel: string | null;
};

export type OccurrenceMedia = {
  kind: "photo" | "video";
  /** Data URL local (demonstração — nenhuma mídia é enviada a serviços externos). */
  dataUrl: string;
};

export type Occurrence = {
  id: string;
  protocol: string;
  typeId: string;
  description: string;
  media: OccurrenceMedia | null;
  location: OccurrenceLocation;
  priority: OccurrencePriority;
  agency: AgencyId;
  status: OccurrenceStatus;
  confirmations: number;
  createdAt: string;
  /** Marca claramente registros de demonstração. */
  demo: boolean;
};
