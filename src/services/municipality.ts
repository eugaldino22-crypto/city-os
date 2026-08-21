export type MunicipalityGeometry = GeoJSON.GeoJsonObject;

export type MunicipalityBoundary = {
  latitude: number;
  longitude: number;
  boundingBox: [number, number, number, number];
  geometry: MunicipalityGeometry;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  boundingbox?: string[];
  display_name?: string;
  osm_type?: string;
  osm_id?: number;
  type?: string;
  category?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  geojson?: MunicipalityGeometry;
};

function normalize(value: string | null | undefined) {
  return (
    value
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() ?? ""
  );
}

/**
 * Obtém o limite geográfico real do município.
 *
 * Nenhuma cidade é fixada no código.
 *
 * GPS
 * ↓
 * Município identificado
 * ↓
 * Busca do município
 * ↓
 * Geometria municipal
 */
export async function fetchMunicipalityBoundary(
  city: string,
  state: string,
): Promise<MunicipalityBoundary | null> {
  const normalizedCity = normalize(city);

  const params = new URLSearchParams({
    q: `${city}, ${state}, Brazil`,
    format: "jsonv2",
    addressdetails: "1",
    polygon_geojson: "1",
    polygon_threshold: "0.00005",
    limit: "10",
    countrycodes: "br",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível obter os limites do município.",
    );
  }

  const results =
    (await response.json()) as NominatimResult[];

  /*
   * Primeiro tentamos encontrar exatamente
   * o município identificado pelo GPS.
   */
  const exactMatch = results.find((result) => {
    const addressName =
      result.address?.municipality ??
      result.address?.city ??
      result.address?.town ??
      result.address?.village;

    const normalizedAddress =
      normalize(addressName);

    const country =
      normalize(result.address?.country_code);

    return (
      normalizedAddress === normalizedCity &&
      country === "br" &&
      Boolean(result.geojson)
    );
  });

  /*
   * Segundo nível: procurar pelo nome do município
   * dentro do display_name.
   */
  const nameMatch =
    exactMatch ??
    results.find((result) => {
      const displayName =
        normalize(result.display_name);

      const country =
        normalize(result.address?.country_code);

      return (
        country === "br" &&
        displayName.includes(normalizedCity) &&
        Boolean(result.geojson)
      );
    });

  /*
   * IMPORTANTE:
   *
   * Não usamos mais:
   *
   * results.find(result => result.geojson)
   *
   * Isso poderia escolher Monte Alegre,
   * Carira, Nossa Senhora da Glória etc.
   *
   * Se não encontrarmos o município correto,
   * retornamos null.
   */
  const municipality = nameMatch;

  if (!municipality?.geojson) {
    return null;
  }

  const latitude = Number(
    municipality.lat,
  );

  const longitude = Number(
    municipality.lon,
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  if (
    !municipality.boundingbox ||
    municipality.boundingbox.length !== 4
  ) {
    return null;
  }

  const south = Number(municipality.boundingbox[0]);
  const north = Number(municipality.boundingbox[1]);
  const west = Number(municipality.boundingbox[2]);
  const east = Number(municipality.boundingbox[3]);

  if (
    ![
      south,
      north,
      west,
      east,
    ].every(Number.isFinite)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    boundingBox: [
      south,
      north,
      west,
      east,
    ],
    geometry:
      municipality.geojson,
  };
}
