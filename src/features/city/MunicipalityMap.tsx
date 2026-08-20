import { useEffect, useRef } from "react";
import type { MunicipalityBoundary } from "@/services/municipality";
import "leaflet/dist/leaflet.css";

type MunicipalityMapProps = {
  municipality: MunicipalityBoundary;
  citizenLatitude?: number | null;
  citizenLongitude?: number | null;
  title: string;
};

export function MunicipalityMap({
  municipality,
  citizenLatitude,
  citizenLongitude,
  title,
}: MunicipalityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;

    const initializeMap = async () => {
      if (!containerRef.current) return;

      const L = await import("leaflet");

      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      ).addTo(map);

      const geoJsonLayer = L.geoJSON(
        municipality.geometry as GeoJSON.GeoJsonObject,
        {
          style: {
            color: "#F4C430",
            weight: 3,
            opacity: 1,
            fillColor: "#1F6B3A",
            fillOpacity: 0.12,
          },
        },
      ).addTo(map);

      const bounds = geoJsonLayer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 14,
        });
      } else {
        map.setView(
          [
            municipality.latitude,
            municipality.longitude,
          ],
          12,
        );
      }

      /*
       * Mantemos o cidadão como referência visual,
       * sem utilizar sua posição para definir o enquadramento.
       */
      if (
        citizenLatitude != null &&
        citizenLongitude != null
      ) {
        const citizenMarker = L.circleMarker(
          [
            citizenLatitude,
            citizenLongitude,
          ],
          {
            radius: 7,
            color: "#FFFFFF",
            weight: 3,
            fillColor: "#174F2C",
            fillOpacity: 1,
          },
        );

        citizenMarker
          .bindTooltip("Você está aqui", {
            direction: "top",
          })
          .addTo(map);
      }

      /*
       * Corrige o tamanho do mapa caso o navegador
       * tenha calculado o container antes da renderização.
       */
      setTimeout(() => {
        map?.invalidateSize();
      }, 100);
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
        map = null;
      }
    };
  }, [
    municipality,
    citizenLatitude,
    citizenLongitude,
  ]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={title}
      className="size-full"
    />
  );
}
