import {
  FileText,
  ListChecks,
  MessageCircleWarning,
  Mail,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const ACTIONS = [
  {
    title: "Abrir Protocolo",
    description: "Solicitações e serviços",
    icon: FileText,
    to: "/protocolos",
  },
  {
    title: "Acompanhar",
    description: "Consulte protocolos",
    icon: ListChecks,
    to: "/protocolos",
  },
  {
    title: "Ouvidoria",
    description: "Sugestões e denúncias",
    icon: MessageCircleWarning,
    to: "/",
  },
  {
    title: "Chamados",
    description: "Serviços públicos",
    icon: Mail,
    to: "/",
  },
] as const;

export function QuickActions() {
  return (
    <section
      aria-labelledby="acoes-rapidas"
      className="fixed inset-x-3 bottom-[92px] z-[1000] sm:inset-x-5 sm:bottom-[108px]"
    >
      <div className="mx-auto max-w-3xl rounded-[28px] border border-border bg-white px-2 py-4 shadow-[var(--shadow-lift)] sm:px-4 sm:py-5">
        <h2 id="acoes-rapidas" className="sr-only">
          Ações rápidas
        </h2>

        <div className="grid grid-cols-4 gap-1 sm:gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.to}
                className="focus-ring group flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition hover:bg-secondary active:scale-[0.98]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground sm:size-12">
                  <Icon className="size-5 sm:size-6" />
                </span>

                <span className="mt-2 line-clamp-1 text-[11px] font-bold text-foreground sm:text-sm">
                  {action.title}
                </span>

                <span className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground sm:text-xs">
                  {action.description}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
