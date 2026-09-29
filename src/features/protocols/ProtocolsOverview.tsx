import { Link } from "@tanstack/react-router";
import { CalendarClock, FileText, FolderOpen, History } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProtocols } from "./useProtocols";

const AREAS = [
  { icon: FileText, title: "Solicitações", description: "Tudo que você pediu à prefeitura." },
  {
    icon: FolderOpen,
    title: "Documentos",
    description: "Comprovantes e anexos dos seus serviços.",
  },
  {
    icon: CalendarClock,
    title: "Agendamentos",
    description: "Datas, horários e locais confirmados.",
  },
  { icon: History, title: "Histórico", description: "Linha do tempo completa do atendimento." },
];

export function ProtocolsOverview({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { data: protocols = [], isLoading, error } = useProtocols();

  return (
    <section aria-labelledby="meus-protocolos">
      <SectionHeader
        eyebrow="Meus protocolos"
        title="Acompanhe tudo em um só lugar"
        description="Solicitações, documentos, agendamentos, histórico e notificações do seu atendimento."
        action={
          compact ? (
            <Link
              to="/protocolos"
              className="focus-ring shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition hover:border-primary"
            >
              Abrir
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {AREAS.map((area) => (
          <article key={area.title} className="card-premium p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
              <area.icon className="size-4.5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold">{area.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{area.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3">
        {isLoading ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Carregando protocolos oficiais…
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível carregar seus protocolos: {error.message}
          </p>
        ) : null}

        {!isLoading && !error && user && protocols.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Você ainda não possui protocolos. Ao registrar uma solicitação, ela aparecerá aqui.
          </p>
        ) : null}

        {!user ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Entre na sua conta para acompanhar protocolos reais.
          </p>
        ) : null}

        {protocols.map((protocol) => (
          <article
            key={protocol.id}
            className="card-premium flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="text-sm font-bold text-foreground">{protocol.protocol_code}</p>
              <p className="mt-1 text-xs text-muted-foreground">{protocol.subject}</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
              {protocolStatusLabel(protocol.status)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function protocolStatusLabel(status: string) {
  const labels: Record<string, string> = {
    received: "Recebido",
    in_analysis: "Em análise",
    forwarded: "Encaminhado",
    in_service: "Em atendimento",
    resolved: "Resolvido",
    cancelled: "Cancelado",
  };

  return labels[status] ?? "Status indisponível";
}
