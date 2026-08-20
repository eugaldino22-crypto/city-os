import {
  Building2,
  GraduationCap,
  HeartPulse,
  Home,
  LifeBuoy,
  MapPinned,
  Briefcase,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type Journey = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  tone: "primary" | "accent";
};

/** Jornadas organizadas pela vida do cidadão — nunca por secretarias. */
export const journeys: Journey[] = [
  {
    id: "city",
    title: "Minha Cidade",
    description: "Acompanhe obras, alertas e o que acontece perto de você.",
    icon: MapPinned,
    to: "/jornada/minha-cidade",
    tone: "primary",
  },
  {
    id: "help",
    title: "Preciso de Ajuda",
    description: "Buraco, iluminação, árvore caída, lixo, emergências.",
    icon: LifeBuoy,
    to: "/jornada/preciso-de-ajuda",
    tone: "accent",
  },
  {
    id: "health",
    title: "Minha Saúde",
    description: "Consultas, exames, vacinas e unidades de saúde.",
    icon: HeartPulse,
    to: "/jornada/minha-saude",
    tone: "primary",
  },
  {
    id: "education",
    title: "Minha Educação",
    description: "Matrículas, vagas em creche, transporte escolar.",
    icon: GraduationCap,
    to: "/jornada/minha-educacao",
    tone: "primary",
  },
  {
    id: "housing",
    title: "Minha Casa",
    description: "IPTU, regularização, água, energia e endereço.",
    icon: Home,
    to: "/jornada/minha-casa",
    tone: "primary",
  },
  {
    id: "family",
    title: "Minha Família",
    description: "Benefícios sociais, assistência e proteção.",
    icon: Building2,
    to: "/jornada/minha-familia",
    tone: "primary",
  },
  {
    id: "work",
    title: "Meu Trabalho",
    description: "Vagas, qualificação, alvarás e empreendedorismo.",
    icon: Briefcase,
    to: "/jornada/meu-trabalho",
    tone: "primary",
  },
  {
    id: "protocols",
    title: "Meus Protocolos",
    description: "Solicitações, documentos, agendamentos e histórico.",
    icon: FileText,
    to: "/protocolos",
    tone: "accent",
  },
];
