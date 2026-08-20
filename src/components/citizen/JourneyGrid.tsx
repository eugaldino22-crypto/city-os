import { Link } from "@tanstack/react-router";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { journeys } from "@/features/city/journeys";

export function JourneyGrid({ filter = "" }: { filter?: string }) {
  const term = filter.trim().toLowerCase();
  const items = term
    ? journeys.filter(
        (j) =>
          j.title.toLowerCase().includes(term) || j.description.toLowerCase().includes(term),
      )
    : journeys;

  return (
    <section aria-labelledby="jornadas">
      <SectionHeader
        eyebrow="Jornadas do cidadão"
        title="Organizado pela sua vida, não pela estrutura da prefeitura"
        description="Escolha o que você precisa. O sistema cuida de encontrar o setor responsável."
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma jornada encontrada para “{filter}”.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((journey) => (
            <Link
              key={journey.id}
              to={journey.to}
              className="card-premium focus-ring flex flex-col gap-3 p-4"
            >
              <span
                className={
                  journey.tone === "accent"
                    ? "grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"
                    : "grid size-10 place-items-center rounded-xl bg-secondary text-primary"
                }
              >
                <journey.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold text-foreground">{journey.title}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {journey.description}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
