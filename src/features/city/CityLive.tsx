import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, RefreshCcw } from "lucide-react";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useActiveMunicipalities,
  useCitizenProfile,
  useLinkCurrentCitizenMunicipality,
} from "@/features/auth/useCitizen";
import { useMunicipalOccurrences } from "@/features/occurrences/store";
import { useCityContext } from "@/hooks/useCityContext";
import { fetchMunicipalityBoundary, type MunicipalityBoundary } from "@/services/municipality";

import { MunicipalityMap } from "./MunicipalityMap";

function normalize(value: string | null | undefined) {
  return (
    value
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() ?? ""
  );
}

function useCanonicalMunicipalityBoundary(
  municipality: { id: string; name: string; state: string } | undefined,
) {
  const [boundary, setBoundary] = useState<MunicipalityBoundary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const municipalityId = municipality?.id;
  const municipalityName = municipality?.name;
  const municipalityState = municipality?.state;

  useEffect(() => {
    let active = true;

    if (!municipalityId || !municipalityName || !municipalityState) {
      setBoundary(null);
      setError(null);
      return () => {
        active = false;
      };
    }

    setBoundary(null);
    setError(null);

    void fetchMunicipalityBoundary(municipalityName, municipalityState)
      .then((nextBoundary) => {
        if (!active) return;
        setBoundary(nextBoundary);
        if (!nextBoundary) {
          setError("Não foi possível carregar o limite geográfico do município selecionado.");
        }
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível carregar o limite geográfico do município selecionado.");
        }
      });

    return () => {
      active = false;
    };
  }, [municipalityId, municipalityName, municipalityState]);

  return { boundary, error };
}

export function CityLive() {
  const { user } = useAuth();
  const { status, coords, place, error: locationError, request } = useCityContext();
  const { data: profile } = useCitizenProfile();
  const { data: municipalities = [] } = useActiveMunicipalities();
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState("");
  const linkMunicipality = useLinkCurrentCitizenMunicipality();

  const canonicalMunicipality = municipalities.find(
    (municipality) => municipality.id === profile?.municipality_id,
  );
  const { boundary: canonicalBoundary, error: canonicalBoundaryError } =
    useCanonicalMunicipalityBoundary(canonicalMunicipality);
  const { data: occurrences = [] } = useMunicipalOccurrences(Boolean(canonicalMunicipality));

  const gpsMatchesCanonicalMunicipality = Boolean(
    canonicalMunicipality &&
    place?.city &&
    normalize(canonicalMunicipality.name) === normalize(place.city) &&
    normalize(canonicalMunicipality.state) === normalize(place.state),
  );
  const canonicalLabel = canonicalMunicipality
    ? [canonicalMunicipality.name, canonicalMunicipality.state].filter(Boolean).join(" · ")
    : null;
  const suggestedLabel = place?.city ? [place.city, place.state].filter(Boolean).join(" · ") : null;
  const requiresMunicipalityLink = Boolean(user && profile && !profile.municipality_id);

  const mapBoundary = canonicalBoundary ?? (!user ? (place?.municipality ?? null) : null);
  const mapTitle = canonicalLabel
    ? `Mapa municipal de ${canonicalLabel}`
    : suggestedLabel
      ? `Mapa de ${suggestedLabel}`
      : "Mapa municipal";

  return (
    <section aria-labelledby="cidade-tempo-real">
      <SectionHeader
        eyebrow="Cidade em tempo real"
        title={`O que está acontecendo em ${canonicalLabel ?? suggestedLabel ?? "sua cidade"}`}
        description={
          canonicalLabel
            ? "Dados municipais segregados pelo município vinculado ao seu perfil."
            : "Escolha seu município no primeiro acesso para ver dados municipais oficiais."
        }
      />

      <div className="card-premium overflow-hidden p-0">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
          {requiresMunicipalityLink ? (
            <MunicipalityOnboarding
              municipalities={municipalities}
              selectedMunicipalityId={selectedMunicipalityId}
              suggestedLabel={suggestedLabel}
              loading={linkMunicipality.isPending}
              error={linkMunicipality.error}
              onSelectionChange={setSelectedMunicipalityId}
              onSubmit={() => {
                if (selectedMunicipalityId) {
                  linkMunicipality.mutate(selectedMunicipalityId);
                }
              }}
            />
          ) : mapBoundary ? (
            <MunicipalityMap
              municipality={mapBoundary}
              citizenLatitude={gpsMatchesCanonicalMunicipality ? (coords?.latitude ?? null) : null}
              citizenLongitude={
                gpsMatchesCanonicalMunicipality ? (coords?.longitude ?? null) : null
              }
              title={mapTitle}
              occurrences={canonicalMunicipality ? occurrences : []}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
              <MapPin className="size-8 text-primary" />

              <p className="max-w-sm text-sm text-muted-foreground">
                {canonicalBoundaryError ??
                  (status === "loading"
                    ? "Carregando o mapa municipal…"
                    : (locationError ??
                      "Escolha um município para consultar os dados municipais oficiais."))}
              </p>

              {!canonicalLabel ? (
                <button
                  type="button"
                  onClick={request}
                  className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-deep"
                >
                  <RefreshCcw className="size-4" />
                  Atualizar sugestão por localização
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {canonicalLabel ?? suggestedLabel ?? "Município ainda não vinculado"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {canonicalLabel
                ? "O município do perfil define o mapa, o feed e os eventos autenticados."
                : "A localização pode sugerir uma cidade, mas não altera o vínculo do perfil."}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <AlertTriangle className="size-3.5" />
            Dados municipais aparecem apenas no tenant selecionado
          </span>
        </div>
      </div>
    </section>
  );
}

function MunicipalityOnboarding({
  municipalities,
  selectedMunicipalityId,
  suggestedLabel,
  loading,
  error,
  onSelectionChange,
  onSubmit,
}: {
  municipalities: { id: string; name: string; state: string }[];
  selectedMunicipalityId: string;
  suggestedLabel: string | null;
  loading: boolean;
  error: Error | null;
  onSelectionChange: (municipalityId: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-6 text-center">
      <MapPin className="size-8 text-primary" />

      <div>
        <p className="text-base font-semibold text-foreground">Escolha seu município</p>

        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Esse vínculo é definido uma única vez neste onboarding.{" "}
          {suggestedLabel
            ? `Sua localização sugere ${suggestedLabel}, mas a escolha é sempre sua.`
            : "A localização nunca altera essa escolha automaticamente."}
        </p>
      </div>

      <select
        aria-label="Município canônico"
        value={selectedMunicipalityId}
        onChange={(event) => onSelectionChange(event.target.value)}
        disabled={loading}
        className="h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm"
      >
        <option value="">Selecione um município</option>
        {municipalities.map((municipality) => (
          <option key={municipality.id} value={municipality.id}>
            {municipality.name} · {municipality.state}
          </option>
        ))}
      </select>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!selectedMunicipalityId || loading}
        className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Vinculando…" : "Confirmar município"}
      </button>
    </div>
  );
}
