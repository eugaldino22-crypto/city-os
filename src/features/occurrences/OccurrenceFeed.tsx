import { useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin, Plus, ThumbsUp } from "lucide-react";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { cn } from "@/lib/utils";

import {
  AGENCIES,
  OCCURRENCE_ICONS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  getOccurrenceType,
} from "./catalog";
import { NewOccurrenceDialog } from "./NewOccurrenceDialog";
import { confirmOccurrence, useOccurrences } from "./store";
import type { Occurrence, OccurrenceStatus } from "./types";
import { locationLabel, timeAgo } from "./utils";

const FILTERS: { id: "todas" | OccurrenceStatus; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "recebida", label: "Recebidas" },
  { id: "em_atendimento", label: "Em atendimento" },
  { id: "resolvida", label: "Resolvidas" },
];

export function OccurrenceFeed({
  cityName,
}: {
  cityName?: string | null | undefined;
}) {
  const occurrences = useOccurrences();
  const [filter, setFilter] = useState<"todas" | OccurrenceStatus>("todas");
  const [open, setOpen] = useState(false);

  const visible = useMemo(
    () =>
      filter === "todas"
        ? occurrences
        : occurrences.filter((item) => item.status === filter),
    [occurrences, filter],
  );

  return (
    <section aria-labelledby="feed-ocorrencias">
      <SectionHeader
        eyebrow="Central de ocorrências"
        title="Ocorrências da cidade"
        description="Registros enviados pelos cidadãos e acompanhados pela prefeitura."
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary-deep active:scale-[0.98] sm:text-sm"
          >
            <Plus className="size-4" />
            Registrar ocorrência
          </button>
        }
      />

      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((occurrence) => (
          <OccurrenceCard
            key={occurrence.id}
            occurrence={occurrence}
            cityName={cityName}
          />
        ))}

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma ocorrência neste filtro.
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Feed institucional. Nenhum dado pessoal do cidadão é exibido
        publicamente.
      </p>

      <NewOccurrenceDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}

export function OccurrenceCard({
  occurrence,
  cityName,
}: {
  occurrence: Occurrence;
  cityName?: string | null | undefined;
}) {
  const occurrenceType = getOccurrenceType(occurrence.typeId);
  const Icon = OCCURRENCE_ICONS[occurrenceType.icon];
  const color = PRIORITY_COLORS[occurrence.priority];

  return (
    <article className="card-premium overflow-hidden p-0">
      {occurrence.media?.kind === "photo" ? (
        <img
          src={occurrence.media.dataUrl}
          alt={`Registro de ${occurrenceType.label}`}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : null}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: `${color}1A`, color }}
          >
            <Icon className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {occurrenceType.label}
              </h3>

              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                {PRIORITY_LABELS[occurrence.priority]}
              </span>

              {occurrence.demo ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  Demonstração
                </span>
              ) : null}
            </div>

            {occurrence.description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {occurrence.description}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {locationLabel(occurrence, cityName)}
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {timeAgo(occurrence.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
              <CheckCircle2 className="size-3.5" />
              {STATUS_LABELS[occurrence.status]}
            </span>

            <span className="text-muted-foreground">
              {AGENCIES[occurrence.agency]}
            </span>
          </div>

          <button
            type="button"
            onClick={() => confirmOccurrence(occurrence.id)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-secondary"
          >
            <ThumbsUp className="size-3.5" />
            Confirmo ({occurrence.confirmations})
          </button>
        </div>
      </div>
    </article>
  );
}
