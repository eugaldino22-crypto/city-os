import { useEffect, useRef } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { createRoot, type Root } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import type { MunicipalityBoundary } from "@/services/municipality";
import { MAPBOX_STYLE, MAPBOX_TOKEN, hasMapboxToken } from "./mapbox";
import {
  OCCURRENCE_ICONS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  getOccurrenceType,
} from "@/features/occurrences/catalog";
import type { Occurrence } from "@/features/occurrences/types";
import { resolveCoordinates, timeAgo } from "@/features/occurrences/utils";
import "mapbox-gl/dist/mapbox-gl.css";

type MunicipalityMapProps = {
  municipality: MunicipalityBoundary;
  citizenLatitude?: number | null;
  citizenLongitude?: number | null;
  title: string;
  occurrences?: Occurrence[];
};

export function MunicipalityMap({
  municipality,
  citizenLatitude,
  citizenLongitude,
  title,
  occurrences = [],
}: MunicipalityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; root: Root }[]>([]);

  useEffect(() => {
    if (!containerRef.current || !hasMapboxToken()) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [municipality.longitude, municipality.latitude],
      zoom: 15,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.on("load", () => {
      map.addSource("municipality-boundary", {
        type: "geojson",
        data: municipality.geometry as Feature | FeatureCollection | Geometry,
      });

      map.addLayer({
        id: "municipality-fill",
        type: "fill",
        source: "municipality-boundary",
        paint: {
          "fill-color": "#1F6B3A",
          "fill-opacity": 0.08,
        },
      });

      map.addLayer({
        id: "municipality-outline",
        type: "line",
        source: "municipality-boundary",
        paint: {
          "line-color": "#1F6B3A",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });

      if (citizenLatitude != null && citizenLongitude != null) {
        const marker = document.createElement("div");

        marker.style.width = "18px";
        marker.style.height = "18px";
        marker.style.borderRadius = "9999px";
        marker.style.background = "#174F2C";
        marker.style.border = "3px solid #FFFFFF";
        marker.style.boxShadow = "0 3px 12px rgba(23,79,44,0.35)";

        new mapboxgl.Marker({ element: marker })
          .setLngLat([citizenLongitude, citizenLatitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setText("Você está aqui"),
          )
          .addTo(map);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [municipality, citizenLatitude, citizenLongitude]);

  /** Marcadores de ocorrências — camada adicional, sem alterar o mapa municipal. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    markersRef.current.forEach(({ marker, root }) => {
      marker.remove();
      setTimeout(() => root.unmount(), 0);
    });
    markersRef.current = [];

    const center = {
      latitude: municipality.latitude,
      longitude: municipality.longitude,
    };

    occurrences.forEach((occurrence) => {
      const coords = resolveCoordinates(occurrence, center);

      if (!coords) return;

      const occurrenceType = getOccurrenceType(occurrence.typeId);
      const Icon = OCCURRENCE_ICONS[occurrenceType.icon];
      const color = PRIORITY_COLORS[occurrence.priority];

      const element = document.createElement("div");
      element.style.cursor = "pointer";

      const root = createRoot(element);

      root.render(
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 9999,
            background: "#FFFFFF",
            border: `2px solid ${color}`,
            color,
            boxShadow: "0 4px 14px rgba(23,79,44,0.28)",
          }}
          aria-label={occurrenceType.label}
        >
          <Icon size={18} />
        </span>,
      );

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        `<div style="font-family: inherit; min-width: 150px">
           <strong style="display:block;font-size:12px">${escapeHtml(occurrenceType.label)}</strong>
           <span style="display:block;font-size:11px;color:${color}">Prioridade ${PRIORITY_LABELS[occurrence.priority].toLowerCase()}</span>
           <span style="display:block;font-size:11px;color:#5a6b60">${escapeHtml(STATUS_LABELS[occurrence.status])} · ${escapeHtml(timeAgo(occurrence.createdAt))}</span>
         </div>`,
      );

      const marker = new mapboxgl.Marker({ element })
        .setLngLat([coords.longitude, coords.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push({ marker, root });
    });

    return () => {
      markersRef.current.forEach(({ marker, root }) => {
        marker.remove();
        setTimeout(() => root.unmount(), 0);
      });
      markersRef.current = [];
    };
  }, [occurrences, municipality]);

  if (!hasMapboxToken()) {
    return (
      <div className="flex size-full items-center justify-center bg-muted p-4 text-center text-sm text-muted-foreground">
        Mapa indisponível: token do Mapbox não configurado neste ambiente.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={title}
      className="relative z-0 size-full overflow-hidden"
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
