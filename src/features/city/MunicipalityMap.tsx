import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { MunicipalityBoundary } from "@/services/municipality";
import "mapbox-gl/dist/mapbox-gl.css";

type MunicipalityMapProps = {
  municipality: MunicipalityBoundary;
  citizenLatitude?: number | null;
  citizenLongitude?: number | null;
  title: string;
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function MunicipalityMap({
  municipality,
  citizenLatitude,
  citizenLongitude,
  title,
}: MunicipalityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [
        municipality.longitude,
        municipality.latitude,
      ],
      zoom: 15,
      attributionControl: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl(),
      "top-left",
    );

    map.on("load", () => {
      const geometry = municipality.geometry;

      map.addSource("municipality-boundary", {
        type: "geojson",
        data: geometry as GeoJSON.GeoJsonObject,
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

      if (
        citizenLatitude != null &&
        citizenLongitude != null
      ) {
        const marker = document.createElement("div");

        marker.style.width = "18px";
        marker.style.height = "18px";
        marker.style.borderRadius = "9999px";
        marker.style.background = "#174F2C";
        marker.style.border = "3px solid #FFFFFF";
        marker.style.boxShadow =
          "0 3px 12px rgba(23,79,44,0.35)";

        new mapboxgl.Marker({
          element: marker,
        })
          .setLngLat([
            citizenLongitude,
            citizenLatitude,
          ])
          .setPopup(
            new mapboxgl.Popup({
              offset: 12,
            }).setText("Você está aqui"),
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
    };
  }, [
    municipality,
    citizenLatitude,
    citizenLongitude,
  ]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Mapbox não configurado.
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
