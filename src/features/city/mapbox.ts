/**
 * Token público do Mapbox.
 * Nunca hardcodar o token — ele vem sempre das variáveis de ambiente do projeto.
 */
export const MAPBOX_TOKEN: string =
  (import.meta.env["VITE_MAPBOX_TOKEN"] as string | undefined) ??
  (import.meta.env["VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN"] as
    | string
    | undefined) ??
  "";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

export function hasMapboxToken() {
  return MAPBOX_TOKEN.length > 0;
}
