import { Link } from "@tanstack/react-router";
import { CalendarClock, FileText, FolderOpen, History } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const AREAS = [
  { icon: FileText, title: "Solicitações", description: "Tudo que você pediu à prefeitura." },
  { icon: FolderOpen, title: "Documentos", description: "Comprovantes e anexos dos seus serviços." },
  { icon: CalendarClock, title: "Agendamentos", description: "Datas, horários e locais confirmados." },
  { icon: History, title: "Histórico", description: "Linha do tempo completa do atendimento." },
];

export function ProtocolsOverview({ compact = false }: { compact?: boolean }) {
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

      <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Você ainda não possui protocolos. Ao solicitar um serviço, ele aparece aqui com andamento em
        tempo real.
      </p>
    </section>
  );
}
