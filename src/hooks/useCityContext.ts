import { useEffect, useState } from "react";
import { getCurrentPosition, reverseGeocode, type Coordinates, type PlaceInfo } from "@/services/location";
import { fetchWeather, type Weather } from "@/services/weather";

export type CityContextState = {
  status: "idle" | "loading" | "ready" | "denied";
  coords: Coordinates | null;
  place: PlaceInfo | null;
  weather: Weather | null;
  error: string | null;
  request: () => void;
};

/**
 * Contexto real da cidade do cidadão: GPS + município + clima.
 * Nenhum dado é inventado — se não houver permissão, o estado fica explícito.
 */
export function useCityContext(): CityContextState {
  const [status, setStatus] = useState<CityContextState["status"]>("idle");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError(null);

    (async () => {
      try {
        const position = await getCurrentPosition();
        if (!active) return;
        setCoords(position);
        const [placeResult, weatherResult] = await Promise.allSettled([
          reverseGeocode(position),
          fetchWeather(position),
        ]);
        if (!active) return;
        if (placeResult.status === "fulfilled") setPlace(placeResult.value);
        if (weatherResult.status === "fulfilled") setWeather(weatherResult.value);
        setStatus("ready");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Localização indisponível.");
        setStatus("denied");
      }
    })();

    return () => {
      active = false;
    };
  }, [attempt]);

  return { status, coords, place, weather, error, request: () => setAttempt((a) => a + 1) };
}
