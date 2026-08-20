import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CitizenHeader } from "@/components/citizen/CitizenHeader";
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
    <div className="min-h-screen bg-background pb-16">
      <CitizenHeader
        query={query}
        onQueryChange={setQuery}
      />

      <main className="mx-auto mt-6 flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        {/* CIDADE EM TEMPO REAL */}
        <CityLive />

        {/* ASSISTENTE IA */}
        <AIAssistant />

        {/* JORNADAS DO CIDADÃO */}
        <JourneyGrid filter={query} />

        {/* PREFEITURA CONECTADA */}
        <ConnectedCityHall />

        {/* MEUS PROTOCOLOS */}
        <ProtocolsOverview compact />
      </main>
    </div>
  );
}
