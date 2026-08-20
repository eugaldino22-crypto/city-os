import { AlertTriangle, MapPin, RefreshCcw } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useCityContext } from "@/hooks/useCityContext";

/** Mapa vivo centrado na posição real do cidadão. */
export function CityLive() {
  const { status, coords, place, error, request } = useCityContext();

  const bbox = coords
    ? [
        coords.longitude - 0.012,
        coords.latitude - 0.008,
        coords.longitude + 0.012,
        coords.latitude + 0.008,
      ].join("%2C")
    : null;

  return (
    <section aria-labelledby="cidade-tempo-real">
      <SectionHeader
        eyebrow="Cidade em tempo real"
        title="O que está acontecendo ao seu redor"
        description="Mapa vivo com sua localização, ocorrências, obras, alertas e eventos da cidade."
      />

      <div className="card-premium overflow-hidden p-0">
        <div className="relative aspect-[16/10] w-full bg-muted sm:aspect-[21/9]">
          {coords && bbox ? (
            <iframe
              title="Mapa da cidade em tempo real"
              className="size-full border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.latitude}%2C${coords.longitude}`}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
              <MapPin className="size-8 text-primary" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {status === "loading"
                  ? "Obtendo sua localização por GPS…"
                  : (error ?? "Permita o acesso à localização para ver sua cidade em tempo real.")}
              </p>
              <button
                type="button"
                onClick={request}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-deep"
              >
                <RefreshCcw className="size-4" />
                Ativar localização
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            {place?.city
              ? `Você está em ${[place.city, place.state].filter(Boolean).join(" · ")}`
              : "Município identificado automaticamente pela sua localização."}
          </p>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <AlertTriangle className="size-3.5" />
            Camadas de ocorrências, obras e eventos exibidas quando a prefeitura conectar suas fontes de dados
          </span>
        </div>
      </div>
    </section>
  );
}
