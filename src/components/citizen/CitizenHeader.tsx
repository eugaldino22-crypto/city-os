import { Bell, CloudSun, LocateFixed, Search } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useCityContext } from "@/hooks/useCityContext";

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function CitizenHeader({
  citizenName,
  query,
  onQueryChange,
}: {
  citizenName?: string;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const city = useCityContext();

  const locationLabel =
    city.status === "loading"
      ? "Localizando…"
      : city.place?.city
        ? [city.place.city, city.place.state].filter(Boolean).join(" · ")
        : city.status === "ready"
          ? "Localização obtida"
          : "Ative a localização";

  return (
    <header className="surface-institutional sticky top-0 z-30 rounded-b-3xl px-4 pb-6 pt-4 shadow-[var(--shadow-lift)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <Logo variant="onDark" />
          <button
            type="button"
            aria-label="Notificações"
            className="focus-ring relative grid size-10 place-items-center rounded-full bg-white/12 text-primary-foreground transition hover:bg-white/20"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
          </button>
        </div>

        <div>
          <p className="text-sm text-primary-foreground/80">
            {greeting()}
            {citizenName ? "," : ""}
          </p>
          <h1 className="text-2xl font-semibold text-primary-foreground sm:text-3xl">
            {citizenName ?? "Cidadão"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/90">
          <button
            type="button"
            onClick={city.request}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 transition hover:bg-white/20"
          >
            <LocateFixed className="size-4" />
            {locationLabel}
          </button>
          {city.weather ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5">
              <CloudSun className="size-4" />
              {city.weather.temperature}° · {city.weather.description}
            </span>
          ) : null}
        </div>

        <label className="relative block">
          <span className="sr-only">Buscar serviços</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar serviços, protocolos ou locais"
            className="focus-ring w-full rounded-2xl border border-white/20 bg-surface py-3.5 pl-12 pr-4 text-base text-foreground shadow-[var(--shadow-soft)] placeholder:text-muted-foreground"
          />
        </label>
      </div>
    </header>
  );
}
