import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, MapPin, Plus, ThumbsUp } from "lucide-react";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { useAuth } from "@/features/auth/AuthProvider";
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
import { useConfirmOccurrence, useOccurrences } from "./store";
import type { Occurrence, OccurrenceStatus } from "./types";
import { locationLabel, timeAgo } from "./utils";

const FILTERS: { id: "todas" | OccurrenceStatus; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "recebida", label: "Recebidas" },
  { id: "em_atendimento", label: "Em atendimento" },
  { id: "resolvida", label: "Resolvidas" },
];

export function OccurrenceFeed({ cityName }: { cityName?: string | null | undefined }) {
  const { data: occurrences = [], isLoading, error } = useOccurrences();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"todas" | OccurrenceStatus>("todas");
  const [open, setOpen] = useState(false);

  const visible = useMemo(
    () => (filter === "todas" ? occurrences : occurrences.filter((item) => item.status === filter)),
    [occurrences, filter],
  );

  return (
    <section aria-labelledby="feed-ocorrencias">
      <SectionHeader
        eyebrow="Central de ocorrências"
        title="Minhas ocorrências"
        description="Registros oficiais enviados por você e acompanhados pela prefeitura."
      />

      <button
        type="button"
        onClick={() => {
          if (!user) {
            void navigate({ to: "/auth" });
            return;
          }
          setOpen(true);
        }}
        className="focus-ring mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-deep active:scale-[0.99] sm:w-auto"
      >
        <Plus className="size-4" />
        Registrar ocorrência
      </button>

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
          <OccurrenceCard key={occurrence.id} occurrence={occurrence} cityName={cityName} />
        ))}

        {isLoading ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Carregando ocorrências oficiais…
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Não foi possível carregar suas ocorrências: {error.message}
          </p>
        ) : null}

        {!isLoading && !error && visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma ocorrência neste filtro.
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Seus dados continuam protegidos: esta lista mostra apenas registros da sua conta.
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
  const confirmation = useConfirmOccurrence();

  return (
    <article className="card-premium overflow-hidden p-0">
      {occurrence.media?.kind === "photo" ? (
        <img
          src={occurrence.media.url}
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
              <h3 className="text-sm font-bold text-foreground">{occurrenceType.label}</h3>

              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                {PRIORITY_LABELS[occurrence.priority]}
              </span>
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

            <span className="text-muted-foreground">{AGENCIES[occurrence.agency]}</span>
          </div>

          <button
            type="button"
            onClick={() => confirmation.mutate(occurrence.id)}
            disabled={confirmation.isPending}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ThumbsUp className="size-3.5" />
            Confirmo ({occurrence.confirmations})
          </button>
        </div>
      </div>
    </article>
  );
}
