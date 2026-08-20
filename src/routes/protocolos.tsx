import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProtocolsOverview } from "@/features/protocols/ProtocolsOverview";

const TITLE = "Meus Protocolos — Gestor.IA";
const DESCRIPTION =
  "Acompanhe solicitações, documentos, agendamentos, histórico e notificações dos seus serviços municipais.";

export const Route = createFileRoute("/protocolos")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ProtocolsPage,
});

function ProtocolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="focus-ring inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>
      <div className="mt-6">
        <ProtocolsOverview />
      </div>
    </div>
  );
}
