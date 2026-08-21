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
              className="flex min-w-0 flex-col items-center px-1 text-center sm:px-0"
            >
              <span className="grid size-10 place-items-center rounded-[14px] bg-secondary text-primary sm:size-12">
                <Icon className="size-5 sm:size-6" strokeWidth={2} />
              </span>

              <span className="mt-2 w-full text-[11px] font-bold leading-none text-foreground sm:whitespace-nowrap sm:text-[13px]">
                {action.title}
              </span>

              <span className="mt-2 w-full text-[10px] leading-none text-muted-foreground sm:whitespace-nowrap sm:text-xs">
                {action.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
