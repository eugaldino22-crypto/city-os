import {
  fetchMunicipalityBoundary,
  type MunicipalityBoundary,
} from "@/services/municipality";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PlaceInfo = {
  city: string | null;
  state: string | null;
  country: string | null;

  /**
   * Centro aproximado do município.
   * Nunca representa a residência do cidadão.
   */
  latitude: number | null;
  longitude: number | null;

  /**
   * Limite geográfico real do município.
   */
  municipality: MunicipalityBoundary | null;
};

/**
 * Geolocalização real do navegador.
 * Usada para descobrir o município do cidadão.
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      reject(
        new Error(
          "Geolocalização indisponível neste dispositivo.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) =>
        reject(
          new Error(
            err.message ||
              "Não foi possível obter sua localização.",
          ),
        ),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  });
}

/**
 * GPS
 * ↓
 * Reverse geocoding
 * ↓
 * Município
 * ↓
 * Limite geográfico do município
 */
export async function reverseGeocode({
  latitude,
  longitude,
}: Coordinates): Promise<PlaceInfo> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&localityLanguage=pt`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      "Falha ao identificar o município.",
    );
  }

  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivisionCode?: string;
    principalSubdivision?: string;
    countryName?: string;
  };

  const city =
    data.city ||
    data.locality ||
    null;

  const state =
    data.principalSubdivisionCode?.split("-")[1] ||
    data.principalSubdivision ||
    null;

  const country =
    data.countryName ||
    null;

  let municipality = null;

  if (city && state) {
    try {
      municipality =
        await fetchMunicipalityBoundary(
          city,
          state,
        );
    } catch {
      municipality = null;
    }
  }

  return {
    city,
    state,
    country,

    latitude:
      municipality?.latitude ??
      latitude,

    longitude:
      municipality?.longitude ??
      longitude,

    municipality,
  };
}
