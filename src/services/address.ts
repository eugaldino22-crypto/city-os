import type { Coordinates } from "./location";

export type AddressInfo = {
  municipality: string | null;
  state: string | null;
  neighborhood: string | null;
  locality: string | null;
  address: string | null;
};

/**
 * Reverse geocoding leve (BigDataCloud, API aberta) usado no registro de ocorrências.
 * Não substitui o serviço de município já existente.
 */
export async function reverseAddress({
  latitude,
  longitude,
}: Coordinates): Promise<AddressInfo> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Não foi possível identificar o endereço.");
  }

  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    principalSubdivisionCode?: string;
    localityInfo?: {
      administrative?: { name?: string; adminLevel?: number }[];
      informative?: { name?: string; description?: string }[];
    };
  };

  const administrative = data.localityInfo?.administrative ?? [];

  const neighborhood =
    administrative.find((item) => (item.adminLevel ?? 0) >= 9)?.name ?? null;

  return {
    municipality: data.city || data.locality || null,
    state:
      data.principalSubdivisionCode?.split("-")[1] ||
      data.principalSubdivision ||
      null,
    neighborhood,
    locality: data.locality || null,
    address: null,
  };
}
