import { routeOccurrence } from "./catalog";
import type { Occurrence, OccurrenceStatus } from "./types";

type Seed = {
  typeId: string;
  description: string;
  neighborhood: string;
  minutesAgo: number;
  status: OccurrenceStatus;
  confirmations: number;
  offset: [number, number];
};

const SEEDS: Seed[] = [
  {
    typeId: "animal-pista",
    description: "Cavalo solto próximo à entrada da cidade.",
    neighborhood: "Centro",
    minutesAgo: 4,
    status: "em_analise",
    confirmations: 3,
    offset: [0.004, 0.003],
  },
  {
    typeId: "buraco",
    description: "Buraco profundo no meio da pista, atrapalhando o trânsito.",
    neighborhood: "Bairro Novo",
    minutesAgo: 52,
    status: "encaminhada",
    confirmations: 7,
    offset: [-0.005, 0.002],
  },
  {
    typeId: "lampada",
    description: "Poste apagado há três noites na rua principal.",
    neighborhood: "Alto da Boa Vista",
    minutesAgo: 180,
    status: "em_atendimento",
    confirmations: 2,
    offset: [0.003, -0.004],
  },
  {
    typeId: "arvore-caida",
    description: "Árvore caída bloqueando parcialmente a via.",
    neighborhood: "Centro",
    minutesAgo: 320,
    status: "em_atendimento",
    confirmations: 11,
    offset: [-0.002, -0.005],
  },
  {
    typeId: "descarte",
    description: "Descarte irregular de entulho no terreno da esquina.",
    neighborhood: "Vila Operária",
    minutesAgo: 640,
    status: "recebida",
    confirmations: 1,
    offset: [0.006, -0.001],
  },
  {
    typeId: "semaforo",
    description: "Semáforo do cruzamento piscando em amarelo desde ontem.",
    neighborhood: "Centro",
    minutesAgo: 900,
    status: "encaminhada",
    confirmations: 5,
    offset: [-0.006, 0.005],
  },
  {
    typeId: "alagamento",
    description: "Rua alagada após a chuva forte da madrugada.",
    neighborhood: "Baixa Grande",
    minutesAgo: 1450,
    status: "resolvida",
    confirmations: 9,
    offset: [0.001, 0.006],
  },
];

/**
 * Dados de demonstração do City OS.
 * Marcados com `demo: true` — nenhuma informação real de cidadãos.
 */
export function createDemoOccurrences(): Occurrence[] {
  const now = Date.now();

  return SEEDS.map((seed, index) => {
    const routing = routeOccurrence(seed.typeId);

    return {
      id: `demo-${index + 1}`,
      protocol: `#${new Date().getFullYear()}-${String(index + 1).padStart(6, "0")}`,
      typeId: seed.typeId,
      description: seed.description,
      media: null,
      location: {
        latitude: null,
        longitude: null,
        municipality: null,
        state: null,
        neighborhood: seed.neighborhood,
        locality: null,
        address: null,
        manualLabel: null,
      },
      priority: routing.priority,
      agency: routing.agency,
      status: seed.status,
      confirmations: seed.confirmations,
      createdAt: new Date(now - seed.minutesAgo * 60_000).toISOString(),
      demo: true,
      // deslocamento relativo usado para posicionar no mapa do município
      demoOffset: seed.offset,
    } as Occurrence & { demoOffset: [number, number] };
  });
}
