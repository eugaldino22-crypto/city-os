import type { Occurrence } from "./types";

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diff / 60_000));

  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;

  const days = Math.round(hours / 24);
  return days === 1 ? "Ontem" : `Há ${days} dias`;
}

export function locationLabel(occurrence: Occurrence, fallbackCity?: string | null) {
  const { location } = occurrence;

  const place =
    location.neighborhood ??
    location.locality ??
    location.address ??
    location.manualLabel ??
    "Local não informado";

  const city = location.municipality ?? fallbackCity ?? null;
  const state = location.state ?? null;

  const cityLabel = city ? `${city}${state ? `/${state}` : ""}` : null;

  return cityLabel ? `${place} — ${cityLabel}` : place;
}

/** Coordenadas registradas pelo cidadão para exibição no mapa. */
export function resolveCoordinates(
  occurrence: Occurrence,
  _center: { latitude: number; longitude: number } | null,
): { latitude: number; longitude: number } | null {
  if (occurrence.location.latitude != null && occurrence.location.longitude != null) {
    return {
      latitude: occurrence.location.latitude,
      longitude: occurrence.location.longitude,
    };
  }

  return null;
}
