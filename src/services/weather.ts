import type { Coordinates } from "./location";

export type Weather = {
  temperature: number;
  code: number;
  description: string;
};

const WMO: Record<number, string> = {
  0: "Céu limpo",
  1: "Predomínio de sol",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Névoa",
  48: "Névoa gelada",
  51: "Garoa fraca",
  53: "Garoa",
  55: "Garoa forte",
  61: "Chuva fraca",
  63: "Chuva",
  65: "Chuva forte",
  71: "Neve fraca",
  80: "Pancadas de chuva",
  81: "Pancadas de chuva",
  82: "Chuva intensa",
  95: "Tempestade",
  96: "Tempestade com granizo",
  99: "Tempestade com granizo",
};

/** Clima real via Open-Meteo (API aberta, sem chave). */
export async function fetchWeather({ latitude, longitude }: Coordinates): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao obter o clima.");
  const data = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number };
  };
  const code = data.current.weather_code;
  return {
    temperature: Math.round(data.current.temperature_2m),
    code,
    description: WMO[code] ?? "Condição atual",
  };
}
