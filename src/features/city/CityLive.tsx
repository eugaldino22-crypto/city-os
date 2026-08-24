import {
  AlertTriangle,
  MapPin,
  RefreshCcw,
} from "lucide-react";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { useCityContext } from "@/hooks/useCityContext";
import { useOccurrences } from "@/features/occurrences/store";
import { MunicipalityMap } from "./MunicipalityMap";

export function CityLive() {
  const {
    status,
    coords,
    place,
    error,
    request,
  } = useCityContext();

  const occurrences = useOccurrences();

  const municipality = place?.city
    ? [place.city, place.state]
        .filter(Boolean)
        .join(" · ")
    : "Sua cidade";

  const boundary =
    place?.municipality ?? null;

  return (
    <section aria-labelledby="cidade-tempo-real">
      <SectionHeader
        eyebrow="Cidade em tempo real"
        title={`O que está acontecendo em ${municipality}`}
        description="Mapa municipal com ocorrências, obras, alertas, eventos e serviços da sua cidade."
      />

      <div className="card-premium overflow-hidden p-0">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
          {boundary ? (
            <MunicipalityMap
              municipality={boundary}
              citizenLatitude={coords?.latitude ?? null}
              citizenLongitude={coords?.longitude ?? null}
              title={`Mapa municipal de ${municipality}`}
              occurrences={occurrences}
            />

          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
              <MapPin className="size-8 text-primary" />

              <p className="max-w-sm text-sm text-muted-foreground">
                {status === "loading"
                  ? "Identificando seu município e carregando o mapa municipal…"
                  : (error ??
                    "Permita o acesso à localização para identificar sua cidade.")}
              </p>

              <button
                type="button"
                onClick={request}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-deep"
              >
                <RefreshCcw className="size-4" />
                Identificar minha cidade
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {place?.city
                ? municipality
                : "Município identificado automaticamente"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              O mapa e os serviços serão contextualizados para este município.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <AlertTriangle className="size-3.5" />
            Dados municipais aparecerão quando as fontes da prefeitura estiverem conectadas
          </span>
        </div>
      </div>
    </section>
  );
}
