export type Coordinates = { latitude: number; longitude: number };

export type PlaceInfo = {
  city: string | null;
  state: string | null;
  country: string | null;
};

/** Geolocalização real do navegador. Nunca usamos cidades fixas ou fictícias. */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalização indisponível neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Não foi possível obter sua localização.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

/** Reverse geocoding aberto (sem chave) para descobrir o município do cidadão. */
export async function reverseGeocode({
  latitude,
  longitude,
}: Coordinates): Promise<PlaceInfo> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao identificar o município.");
  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivisionCode?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  return {
    city: data.city || data.locality || null,
    state: data.principalSubdivisionCode?.split("-")[1] || data.principalSubdivision || null,
    country: data.countryName || null,
  };
}
