import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { CitizenHeader } from "@/components/citizen/CitizenHeader";
import { CitizenBottomNav } from "@/components/citizen/CitizenBottomNav";
import { JourneyGrid } from "@/components/citizen/JourneyGrid";

import { AIAssistant } from "@/components/ai/AIAssistant";

import { CityLive } from "@/features/city/CityLive";
import { ConnectedCityHall } from "@/features/city/ConnectedCityHall";
import { ProtocolsOverview } from "@/features/protocols/ProtocolsOverview";

const TITLE = "Gestor.IA — O Sistema Operacional da Cidade";

const DESCRIPTION =
  "Portal do Cidadão Gestor.IA: resolva problemas, solicite serviços, acompanhe protocolos e veja sua cidade em tempo real.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CitizenHome,
});

function CitizenHome() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative isolate min-h-screen bg-background pb-[270px] sm:pb-[290px]">
      <CitizenHeader
        query={query}
        onQueryChange={setQuery}
      />

      <main className="mx-auto flex max-w-6xl flex-col px-4 sm:px-6">
        {/* MAPA MUNICIPAL */}
        <div className="mt-6">
          <CityLive />
        </div>

        {/* ASSISTENTE IA */}
        <section className="mt-10">
          <AIAssistant />
        </section>

        {/* JORNADAS DO CIDADÃO */}
        <section className="mt-10">
          <JourneyGrid filter={query} />
        </section>

        {/* PREFEITURA CONECTADA */}
        <section className="mt-10">
          <ConnectedCityHall />
        </section>

        {/* MEUS PROTOCOLOS */}
        <section className="mt-10">
          <ProtocolsOverview compact />
        </section>
      </main>

      <CitizenBottomNav />
    </div>
  );
}
