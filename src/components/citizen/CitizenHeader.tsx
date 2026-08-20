import { useEffect, useState } from "react";
import {
  Bell,
  CloudSun,
  LocateFixed,
  Radio,
  Search,
} from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { CitizenProfileMenu } from "@/components/citizen/CitizenProfileMenu";
import { useCityContext } from "@/hooks/useCityContext";

const PROFILE_NAME_KEY = "gestoria-citizen-name";
const PROFILE_PHOTO_KEY = "gestoria-citizen-photo";

function greeting(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

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

  const [profileName, setProfileName] = useState(
    citizenName ?? "Cidadão",
  );

  const [profilePhoto, setProfilePhoto] = useState("");

  /*
   * Estado global do painel de notificações do Header.
   */
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(PROFILE_NAME_KEY);
    const savedPhoto = localStorage.getItem(PROFILE_PHOTO_KEY);

    if (savedName) {
      setProfileName(savedName);
    }

    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    }
  }, []);

  useEffect(() => {
    if (citizenName) {
      setProfileName(citizenName);
    }
  }, [citizenName]);

  const locationLabel =
    city.status === "loading"
      ? "Obtendo localização..."
      : city.place?.city
        ? [city.place.city, city.place.state]
            .filter(Boolean)
            .join(" - ")
        : city.status === "ready"
          ? "Localização obtida"
          : "Ative a localização";

  const temperature =
    city.weather?.temperature != null
      ? `${Math.round(city.weather.temperature)}°C`
      : "--";

  const weatherDescription =
    city.weather?.description || "Clima indisponível";

  function handleProfileChange(profile: {
    name: string;
    photoUrl: string;
  }) {
    setProfileName(profile.name);
    setProfilePhoto(profile.photoUrl);

    localStorage.setItem(
      PROFILE_NAME_KEY,
      profile.name,
    );

    if (profile.photoUrl) {
      localStorage.setItem(
        PROFILE_PHOTO_KEY,
        profile.photoUrl,
      );
    } else {
      localStorage.removeItem(PROFILE_PHOTO_KEY);
    }
  }

  return (
    <header className="surface-institutional relative overflow-hidden rounded-b-[32px] px-4 pb-7 pt-5 shadow-[var(--shadow-lift)] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex items-center justify-between">
          <Logo variant="onDark" />

          <div className="flex items-center gap-2">
            {/* SINO FUNCIONAL */}
            <button
              type="button"
              aria-label="Abrir notificações"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(true)}
              className="focus-ring relative grid size-11 place-items-center rounded-full bg-white/10 text-primary-foreground backdrop-blur-sm transition duration-200 hover:bg-white/20 active:scale-[0.97]"
            >
              <Bell className="size-5" />

              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent shadow-[0_0_0_3px_rgba(244,196,48,0.12)]" />
            </button>

            <CitizenProfileMenu
              citizenName={profileName}
              cityName={locationLabel}
              photoUrl={profilePhoto}
              onProfileChange={handleProfileChange}
              notificationsOpen={notificationsOpen}
              onNotificationsOpenChange={setNotificationsOpen}
            />
          </div>
        </div>

        <div className="pt-1">
          <p className="text-sm font-medium text-primary-foreground/75">
            {greeting()}
            {profileName !== "Cidadão" ? "," : ""}
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-primary-foreground sm:text-4xl">
            {profileName}
          </h1>

          <p className="mt-1.5 text-sm font-medium text-primary-foreground/75">
            Portal do Cidadão
          </p>
        </div>

        <label className="relative block">
          <span className="sr-only">
            Pesquisar serviços públicos
          </span>

          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) =>
              onQueryChange(event.target.value)
            }
            placeholder="Pesquisar serviços públicos..."
            className="focus-ring w-full rounded-2xl border border-white/20 bg-white px-5 py-4 pl-13 text-base text-foreground shadow-[var(--shadow-lift)] outline-none transition placeholder:text-muted-foreground focus:border-white/40"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* LOCALIZAÇÃO */}
          <button
            type="button"
            onClick={city.request}
            className="focus-ring card-premium group min-h-[112px] border-white/10 bg-white/10 p-4 text-left text-primary-foreground backdrop-blur-md hover:bg-white/[0.14] sm:min-h-[118px]"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-white/10">
                <LocateFixed className="size-6 text-accent" />
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-primary-foreground/65">
              Sua Cidade
            </p>

            <p className="mt-1 truncate text-sm font-bold text-primary-foreground">
              {locationLabel}
            </p>
          </button>

          {/* CLIMA */}
          <div className="card-premium min-h-[112px] border-white/10 bg-white/10 p-4 text-primary-foreground backdrop-blur-md sm:min-h-[118px]">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-white/10">
                <CloudSun className="size-6 text-accent" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-black">
                {temperature}
              </span>

              <span className="truncate text-xs font-medium text-primary-foreground/65">
                {weatherDescription}
              </span>
            </div>
          </div>

          {/* AO VIVO */}
          <div className="card-premium min-h-[112px] border-white/10 bg-white/10 p-4 text-primary-foreground backdrop-blur-md sm:min-h-[118px]">
            <div className="flex items-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-300 opacity-60" />
                <span className="relative inline-flex size-3 rounded-full bg-green-400" />
              </span>

              <Radio className="size-5 text-green-300" />
            </div>

            <p className="mt-3 text-xs font-bold tracking-[0.12em] text-primary-foreground/70">
              AO VIVO
            </p>

            <p className="mt-1 text-sm font-bold text-primary-foreground">
              Atualizado agora
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
