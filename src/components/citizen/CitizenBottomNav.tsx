import {
  Home,
  ListChecks,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CitizenBottomNav() {
  return (
    <nav
      aria-label="Navegação principal do cidadão"
      className="fixed inset-x-3 bottom-3 z-[1100] sm:inset-x-5 sm:bottom-5"
    >
      <div className="mx-auto flex max-w-3xl items-end justify-between rounded-[32px] border border-border bg-white px-2 py-2 shadow-[var(--shadow-lift)] sm:px-4 sm:py-3">
        <Link
          to="/"
          className="focus-ring flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-primary transition"
        >
          <Home className="size-6 sm:size-7" />
          <span className="text-[10px] font-semibold sm:text-[11px]">
            Início
          </span>
        </Link>

        <Link
          to="/protocolos"
          className="focus-ring flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground transition hover:text-primary"
        >
          <ListChecks className="size-6 sm:size-7" />
          <span className="text-[10px] font-medium sm:text-[11px]">
            Solicitações
          </span>
        </Link>

        <Link
          to="/protocolos"
          aria-label="Nova Solicitação"
          className="focus-ring relative -mt-10 flex size-[68px] shrink-0 items-center justify-center rounded-full bg-primary-deep text-primary-foreground shadow-[0_10px_30px_-8px_rgba(23,79,44,0.55)] transition hover:scale-[1.03] hover:bg-primary active:scale-[0.97] sm:-mt-12 sm:size-[76px]"
        >
          <Plus className="size-9 sm:size-10" strokeWidth={2} />

          <span className="absolute -bottom-7 whitespace-nowrap text-[11px] font-bold text-primary-deep sm:-bottom-8 sm:text-xs">
            Nova Solicitação
          </span>
        </Link>

        <Link
          to="/"
          className="focus-ring flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground transition hover:text-primary"
        >
          <Star className="size-6 sm:size-7" />
          <span className="text-[10px] font-medium sm:text-[11px]">
            Avaliações
          </span>
        </Link>

        <Link
          to="/"
          className="focus-ring flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground transition hover:text-primary"
        >
          <UserRound className="size-6 sm:size-7" />
          <span className="text-[10px] font-medium sm:text-[11px]">
            Perfil
          </span>
        </Link>
      </div>
    </nav>
  );
}
