import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { LocateFixed, MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

import { Input } from "@/components/ui/input";
import { MAPBOX_STYLE, MAPBOX_TOKEN, hasMapboxToken } from "@/features/city/mapbox";
import { getCurrentPosition } from "@/services/location";
import { reverseAddress } from "@/services/address";

import type { OccurrenceLocation } from "./types";

export function OccurrenceLocationPicker({
  location,
  onChange,
  onConfirm,
}: {
  location: OccurrenceLocation;
  onChange: (location: OccurrenceLocation) => void;
  onConfirm: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "denied">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  async function detect() {
    setStatus("loading");
    setError(null);

    try {
      const position = await getCurrentPosition();

      let address = {
        municipality: null as string | null,
        state: null as string | null,
        neighborhood: null as string | null,
        locality: null as string | null,
        address: null as string | null,
      };

      try {
        address = await reverseAddress(position);
      } catch {
        /* endereço opcional */
      }

      onChange({
        ...location,
        latitude: position.latitude,
        longitude: position.longitude,
        ...address,
      });

      setStatus("ready");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível obter sua localização.",
      );
      setStatus("denied");
    }
  }

  useEffect(() => {
    if (location.latitude == null) {
      void detect();
    } else {
      setStatus("ready");
    }
    // detecta apenas na abertura da etapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapa de confirmação (Mapbox — mesmo provedor do mapa municipal)
  useEffect(() => {
    if (
      !hasMapboxToken() ||
      !containerRef.current ||
      location.latitude == null ||
      location.longitude == null
    ) {
      return;
    }

    if (mapRef.current) {
      mapRef.current.setCenter([location.longitude, location.latitude]);
      markerRef.current?.setLngLat([location.longitude, location.latitude]);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [location.longitude, location.latitude],
      zoom: 16,
    });

    const element = document.createElement("div");
    element.style.width = "20px";
    element.style.height = "20px";
    element.style.borderRadius = "9999px";
    element.style.background = "#1F6B3A";
    element.style.border = "3px solid #FFFFFF";
    element.style.boxShadow = "0 3px 12px rgba(23,79,44,0.35)";

    const marker = new mapboxgl.Marker({ element, draggable: true })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLngLat();

      onChange({
        ...location,
        latitude: position.lat,
        longitude: position.lng,
      });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [location, onChange]);

  const hasCoords = location.latitude != null && location.longitude != null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl bg-secondary p-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />

        <div className="min-w-0 text-xs">
          <p className="font-semibold text-foreground">
            {status === "loading"
              ? "Obtendo localização…"
              : hasCoords
                ? "Localização detectada"
                : "Localização não detectada"}
          </p>

          <p className="mt-1 text-muted-foreground">
            {hasCoords
              ? [location.neighborhood, location.municipality, location.state]
                  .filter(Boolean)
                  .join(" · ") || "Endereço aproximado indisponível"
              : (error ?? "Informe o local manualmente abaixo.")}
          </p>

          {hasCoords ? (
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}
            </p>
          ) : null}
        </div>
      </div>

      {hasCoords && hasMapboxToken() ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div ref={containerRef} className="h-44 w-full" />

          <p className="border-t border-border p-2 text-center text-[11px] text-muted-foreground">
            Arraste o marcador para ajustar o local exato.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="occurrence-manual-location"
          className="text-xs font-semibold text-foreground"
        >
          Referência do local (opcional)
        </label>

        <Input
          id="occurrence-manual-location"
          value={location.manualLabel ?? ""}
          maxLength={140}
          placeholder="Rua, bairro, povoado ou ponto de referência"
          onChange={(event) =>
            onChange({ ...location, manualLabel: event.target.value })
          }
          className="mt-2"
        />
      </div>

      <button
        type="button"
        onClick={() => void detect()}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-primary"
      >
        <LocateFixed className="size-4" />
        Atualizar localização pelo GPS
      </button>

      <button
        type="button"
        onClick={onConfirm}
        className="focus-ring w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-deep active:scale-[0.99]"
      >
        Confirmar localização
      </button>
    </div>
  );
}
