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
    <div className="w-full">
      <div className="grid w-full grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              to={action.to}
              className="flex min-w-0 flex-col items-center text-center"
            >
              <span className="grid size-12 place-items-center rounded-[14px] bg-secondary text-primary">
                <Icon className="size-6" strokeWidth={2} />
              </span>

              <span className="mt-2 whitespace-nowrap text-[13px] font-bold leading-none text-foreground">
                {action.title}
              </span>

              <span className="mt-2 whitespace-nowrap text-[10px] leading-none text-muted-foreground sm:text-xs">
                {action.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
