import { Megaphone, HardHat, CalendarDays, Info } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const CHANNELS = [
  { icon: Megaphone, title: "Comunicados", description: "Avisos oficiais da gestão municipal." },
  { icon: HardHat, title: "Obras", description: "Andamento e impacto das obras na sua região." },
  { icon: CalendarDays, title: "Eventos", description: "Agenda pública e campanhas da cidade." },
  { icon: Info, title: "Informações", description: "Serviços, prazos e orientações essenciais." },
];

/**
 * Prefeitura Conectada — canais oficiais.
 * Sem dados fictícios: cada canal exibe conteúdo real assim que a fonte municipal é conectada.
 */
export function ConnectedCityHall() {
  return (
    <section aria-labelledby="prefeitura-conectada">
      <SectionHeader
        eyebrow="Prefeitura conectada"
        title="A cidade falando com você"
        description="Comunicados, obras, eventos, avisos e campanhas em um único canal oficial."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <article key={channel.title} className="card-premium p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <channel.icon className="size-5" />
            </span>
            <h3 className="mt-3 text-base font-semibold">{channel.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
            <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Nenhuma publicação disponível no momento.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
