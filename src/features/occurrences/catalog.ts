import {
  AlertTriangle,
  Ambulance,
  Bug,
  Building2,
  Car,
  Construction,
  Droplets,
  Flame,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  MapPin,
  Megaphone,
  PawPrint,
  Recycle,
  Signpost,
  Sprout,
  Stethoscope,
  Trash2,
  TrafficCone,
  TreeDeciduous,
  TriangleAlert,
  Utensils,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type {
  AgencyId,
  OccurrenceGroup,
  OccurrenceIconKey,
  OccurrencePriority,
  OccurrenceStatus,
  OccurrenceType,
} from "./types";

export const OCCURRENCE_ICONS: Record<OccurrenceIconKey, LucideIcon> = {
  animal: PawPrint,
  acidente: Car,
  incendio: Flame,
  risco: TriangleAlert,
  buraco: Construction,
  via: TrafficCone,
  calcada: Signpost,
  sinalizacao: Signpost,
  semaforo: TrafficCone,
  lampada: Lightbulb,
  poste: Zap,
  fiacao: Zap,
  arvore: TreeDeciduous,
  poda: Sprout,
  lixo: Trash2,
  entulho: Recycle,
  alagamento: Waves,
  agua: Droplets,
  esgoto: Droplets,
  praca: Utensils,
  escola: GraduationCap,
  saude: Stethoscope,
  equipamento: Building2,
  denuncia: Megaphone,
  solicitacao: Wrench,
  outro: MapPin,
};

export const AGENCIES: Record<AgencyId, string> = {
  obras: "Obras",
  infraestrutura: "Infraestrutura",
  iluminacao: "Iluminação Pública",
  meio_ambiente: "Meio Ambiente",
  limpeza_urbana: "Limpeza Urbana",
  transito: "Trânsito",
  defesa_civil: "Defesa Civil",
  saude: "Saúde",
  educacao: "Educação",
  protecao_animal: "Proteção Animal",
  administracao: "Administração",
  outro: "Outro órgão",
};

export const OCCURRENCE_GROUPS: OccurrenceGroup[] = [
  { id: "emergencia", label: "Segurança e emergência", icon: "risco" },
  { id: "infraestrutura", label: "Infraestrutura", icon: "buraco" },
  { id: "iluminacao", label: "Iluminação", icon: "lampada" },
  { id: "ambiente", label: "Meio ambiente", icon: "arvore" },
  { id: "servicos", label: "Serviços públicos", icon: "equipamento" },
  { id: "outros", label: "Outros", icon: "outro" },
];

function type(
  id: string,
  label: string,
  groupId: string,
  icon: OccurrenceIconKey,
  agency: AgencyId,
  defaultPriority: OccurrencePriority,
  hints: string[] = [],
): OccurrenceType {
  return { id, label, groupId, icon, agency, defaultPriority, hints };
}

export const OCCURRENCE_TYPES: OccurrenceType[] = [
  // SEGURANÇA E EMERGÊNCIA
  type("acidente", "Acidente", "emergencia", "acidente", "transito", "critica", [
    "Acidente entre veículos na via.",
  ]),
  type("incendio", "Incêndio ou fumaça", "emergencia", "incendio", "defesa_civil", "critica", [
    "Foco de incêndio próximo a residências.",
  ]),
  type("animal-pista", "Animal na pista", "emergencia", "animal", "protecao_animal", "alta", [
    "Cavalo solto próximo à entrada da cidade.",
    "Animal solto oferecendo risco aos motoristas.",
  ]),
  type("animal-ferido", "Animal ferido ou abandonado", "emergencia", "animal", "protecao_animal", "media"),
  type("risco", "Situação de risco", "emergencia", "risco", "defesa_civil", "critica", [
    "Estrutura ameaçando desabar.",
    "Risco de deslizamento no barranco.",
  ]),
  type("fiacao-caida", "Fiação caída ou exposta", "emergencia", "fiacao", "iluminacao", "critica"),
  type("emergencia-outra", "Outra emergência", "emergencia", "risco", "defesa_civil", "alta"),

  // INFRAESTRUTURA
  type("buraco", "Buraco na via", "infraestrutura", "buraco", "obras", "media", [
    "Buraco grande no meio da pista.",
  ]),
  type("rua-danificada", "Rua danificada / pavimentação", "infraestrutura", "via", "obras", "media"),
  type("calcada", "Calçada ou meio-fio danificado", "infraestrutura", "calcada", "obras", "baixa"),
  type("sinalizacao", "Sinalização danificada", "infraestrutura", "sinalizacao", "transito", "media"),
  type("semaforo", "Semáforo com defeito", "infraestrutura", "semaforo", "transito", "alta"),
  type("obstrucao", "Obstrução ou interdição da via", "infraestrutura", "via", "transito", "alta"),
  type("veiculo-abandonado", "Veículo abandonado", "infraestrutura", "acidente", "transito", "baixa"),
  type("ponte", "Ponte ou estrutura danificada", "infraestrutura", "risco", "infraestrutura", "alta"),

  // ILUMINAÇÃO
  type("lampada", "Lâmpada apagada", "iluminacao", "lampada", "iluminacao", "baixa", [
    "Poste apagado há alguns dias na minha rua.",
  ]),
  type("iluminacao-piscando", "Iluminação piscando", "iluminacao", "lampada", "iluminacao", "baixa"),
  type("poste", "Poste danificado", "iluminacao", "poste", "iluminacao", "alta"),
  type("sem-iluminacao", "Área sem iluminação", "iluminacao", "lampada", "iluminacao", "media"),

  // MEIO AMBIENTE
  type("arvore-caida", "Árvore caída", "ambiente", "arvore", "meio_ambiente", "alta", [
    "Árvore caída bloqueando parcialmente a via.",
  ]),
  type("poda", "Poda de árvore", "ambiente", "poda", "meio_ambiente", "baixa"),
  type("arvore-risco", "Árvore oferecendo risco", "ambiente", "arvore", "meio_ambiente", "alta"),
  type("lixo", "Lixo acumulado", "ambiente", "lixo", "limpeza_urbana", "media", [
    "Lixo acumulado na esquina há vários dias.",
  ]),
  type("descarte", "Descarte irregular / entulho", "ambiente", "entulho", "limpeza_urbana", "media"),
  type("alagamento", "Alagamento ou enchente", "ambiente", "alagamento", "defesa_civil", "alta"),
  type("queimada", "Queimada ou poluição", "ambiente", "incendio", "meio_ambiente", "alta"),

  // SERVIÇOS PÚBLICOS
  type("agua", "Falta ou vazamento de água", "servicos", "agua", "infraestrutura", "media"),
  type("esgoto", "Esgoto a céu aberto", "servicos", "esgoto", "infraestrutura", "alta"),
  type("coleta", "Coleta de lixo / limpeza urbana", "servicos", "lixo", "limpeza_urbana", "baixa"),
  type("praca", "Praça ou parque", "servicos", "praca", "administracao", "baixa"),
  type("escola", "Escola", "servicos", "escola", "educacao", "media"),
  type("unidade-saude", "Unidade de saúde", "servicos", "saude", "saude", "media"),
  type("equipamento", "Equipamento público danificado", "servicos", "equipamento", "administracao", "media"),

  // OUTROS
  type("denuncia", "Denúncia", "outros", "denuncia", "administracao", "media"),
  type("manutencao", "Solicitação de manutenção", "outros", "solicitacao", "administracao", "baixa"),
  type("outra", "Outra ocorrência", "outros", "outro", "administracao", "baixa"),
];

export function getOccurrenceType(typeId: string): OccurrenceType {
  return (
    OCCURRENCE_TYPES.find((item) => item.id === typeId) ??
    OCCURRENCE_TYPES[OCCURRENCE_TYPES.length - 1]!
  );
}

export const PRIORITY_LABELS: Record<OccurrencePriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

/** Cores dos marcadores/badges por prioridade (fora da paleta institucional apenas como sinalização). */
export const PRIORITY_COLORS: Record<OccurrencePriority, string> = {
  baixa: "#1F6B3A",
  media: "#F4C430",
  alta: "#E07B26",
  critica: "#C62828",
};

export const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  encaminhada: "Encaminhada",
  em_atendimento: "Em atendimento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

/**
 * Matriz de encaminhamento: categoria → prioridade → órgão responsável.
 * Preparada para configuração futura pela prefeitura (sem integração externa).
 */
export function routeOccurrence(typeId: string): {
  priority: OccurrencePriority;
  agency: AgencyId;
} {
  const occurrenceType = getOccurrenceType(typeId);

  return {
    priority: occurrenceType.defaultPriority,
    agency: occurrenceType.agency,
  };
}

/**
 * Classificação local (regras) — ponto de extensão para IA no futuro.
 * Nenhum serviço externo é chamado nesta etapa.
 */
export function classifyOccurrence(input: {
  typeId: string;
  description: string;
}): { priority: OccurrencePriority; agency: AgencyId; reason: string } {
  const base = routeOccurrence(input.typeId);
  const text = input.description.toLowerCase();

  const escalate =
    /(risco|perigo|criança|bloquean|bloqueand|interditad|caído sobre|energizad|desabar)/.test(
      text,
    );

  const priority: OccurrencePriority = escalate
    ? base.priority === "baixa"
      ? "media"
      : base.priority === "media"
        ? "alta"
        : "critica"
    : base.priority;

  return {
    priority,
    agency: base.agency,
    reason: escalate
      ? "Prioridade elevada por indício de risco na descrição."
      : "Classificação padrão da categoria selecionada.",
  };
}

export { Ambulance, AlertTriangle, Bug };
