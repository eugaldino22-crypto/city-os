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
      className="
        relative z-10
        -mt-8
        w-full
        px-2
        sm:-mt-10 sm:px-4
      "
    >
      <div
        className="
          rounded-[30px]
          border border-border
          bg-white
          px-3 py-5
          shadow-[var(--shadow-lift)]
          sm:px-6 sm:py-6
        "
      >
        <div
          className="
            grid grid-cols-4
            gap-1
            sm:gap-4
          "
        >
          {ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.to}
                className="
                  focus-ring group
                  flex min-w-0
                  flex-col items-center
                  justify-center
                  rounded-2xl
                  px-1 py-2
                  text-center
                  transition
                  hover:bg-secondary
                  active:scale-[0.98]
                "
              >
                <span
                  className="
                    grid
                    size-14
                    place-items-center
                    rounded-[18px]
                    bg-secondary
                    text-primary
                    transition
                    group-hover:bg-primary
                    group-hover:text-primary-foreground
                    sm:size-16
                    sm:rounded-[20px]
                  "
                >
                  <Icon
                    className="size-7 sm:size-8"
                    strokeWidth={2}
                  />
                </span>

                <span
                  className="
                    mt-3
                    max-w-full
                    truncate
                    text-[13px]
                    font-semibold
                    text-foreground
                    sm:text-sm
                  "
                >
                  {action.title}
                </span>

                <span
                  className="
                    mt-1
                    max-w-full
                    truncate
                    text-[11px]
                    text-muted-foreground
                    sm:text-xs
                  "
                >
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
