import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { journeys } from "@/features/city/journeys";

export const Route = createFileRoute("/jornada/$slug")({
  loader: ({ params }) => {
    const journey = journeys.find((j) => j.to === `/jornada/${params.slug}`);
    if (!journey) throw notFound();
    return { title: journey.title, description: journey.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Jornada indisponível — Gestor.IA" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.title} — Gestor.IA`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  component: JourneyPage,
});

function JourneyPage() {
  const { title, description } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="focus-ring inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>

      <div className="card-premium mt-8 p-6">
        <h2 className="text-base font-semibold">Serviços desta jornada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Os serviços aparecem aqui conforme o município conecta seus sistemas ao Gestor.IA. Nenhum
          dado é simulado.
        </p>
      </div>
    </div>
  );
}
