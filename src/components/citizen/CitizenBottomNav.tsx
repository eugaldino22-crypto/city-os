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
    <footer
      aria-label="Navegação principal do cidadão"
      className="
        fixed inset-x-0 bottom-0 z-[1100]
        w-full
        rounded-t-[38px]
        border border-b-0 border-border
        bg-white
        shadow-[0_-18px_50px_-28px_rgba(23,79,44,0.45)]
      "
    >
      <div
        className="
          relative mx-auto
          flex h-[92px] w-full
          items-end justify-between
          rounded-t-[38px]
          bg-white
          px-2 pb-2
          sm:h-[96px] sm:px-5
        "
      >
        {/* INÍCIO */}
        <Link
          to="/"
          className="
            focus-ring
            flex h-full min-w-0 flex-1
            flex-col items-center justify-end
            gap-1 rounded-2xl
            px-1 pb-2
            text-primary
            transition
          "
        >
          <Home
            className="size-6 sm:size-7"
            strokeWidth={2}
          />

          <span className="text-[11px] font-semibold sm:text-xs">
            Início
          </span>
        </Link>

        {/* SOLICITAÇÕES */}
        <Link
          to="/protocolos"
          className="
            focus-ring
            flex h-full min-w-0 flex-1
            flex-col items-center justify-end
            gap-1 rounded-2xl
            px-1 pb-2
            text-muted-foreground
            transition hover:text-primary
          "
        >
          <ListChecks
            className="size-6 sm:size-7"
            strokeWidth={2}
          />

          <span className="text-[11px] font-medium sm:text-xs">
            Solicitações
          </span>
        </Link>

        {/* NOVA SOLICITAÇÃO */}
        <Link
          to="/protocolos"
          aria-label="Nova Solicitação"
          className="
            focus-ring
            relative flex h-full
            w-[112px] shrink-0
            flex-col items-center justify-end
            text-primary-deep
          "
        >
          <span
            className="
              absolute -top-10
              grid size-[72px]
              place-items-center
              rounded-full
              bg-primary-deep
              text-primary-foreground
              shadow-[0_12px_32px_-8px_rgba(23,79,44,0.60)]
              transition
              hover:scale-[1.04]
              hover:bg-primary
              active:scale-[0.97]
            "
          >
            <Plus
              className="size-9 sm:size-10"
              strokeWidth={2.2}
            />
          </span>

          <span
            className="
              mb-1
              whitespace-nowrap
              text-[15px]
              font-bold
              leading-none
              text-primary-deep
              sm:text-base
            "
          >
            Nova Solicitação
          </span>
        </Link>

        {/* AVALIAÇÕES */}
        <Link
          to="/"
          className="
            focus-ring
            flex h-full min-w-0 flex-1
            flex-col items-center justify-end
            gap-1 rounded-2xl
            px-1 pb-2
            text-muted-foreground
            transition hover:text-primary
          "
        >
          <Star
            className="size-6 sm:size-7"
            strokeWidth={2}
          />

          <span className="text-[11px] font-medium sm:text-xs">
            Avaliações
          </span>
        </Link>

        {/* PERFIL */}
        <Link
          to="/"
          className="
            focus-ring
            flex h-full min-w-0 flex-1
            flex-col items-center justify-end
            gap-1 rounded-2xl
            px-1 pb-2
            text-muted-foreground
            transition hover:text-primary
          "
        >
          <UserRound
            className="size-6 sm:size-7"
            strokeWidth={2}
          />

          <span className="text-[11px] font-medium sm:text-xs">
            Perfil
          </span>
        </Link>
      </div>
    </footer>
  );
}
