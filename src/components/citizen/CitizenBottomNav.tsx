import {
  Home,
  ListChecks,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { QuickActions } from "@/components/citizen/QuickActions";

export function CitizenBottomNav() {
  return (
    <footer
      aria-label="Navegação principal do cidadão"
      className="
        fixed
        inset-x-0
        bottom-0
        z-[1100]
        w-full
        rounded-t-[34px]
        bg-white
        px-3
        pt-7
        pb-5
        shadow-[0_-12px_40px_-24px_rgba(23,79,44,0.35)]
        sm:px-5
      "
    >
      {/* AÇÕES SUPERIORES */}
      <QuickActions />

      {/* NAVEGAÇÃO INFERIOR */}
      <div className="relative mx-auto mt-9 w-full max-w-2xl">
        <div
          className="
            relative
            flex
            h-[84px]
            w-full
            items-center
            rounded-[32px]
            border
            border-border
            bg-white
            px-2
            shadow-[0_4px_20px_-12px_rgba(23,79,44,0.25)]
          "
        >
          {/* INÍCIO */}
          <Link
            to="/"
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-primary"
          >
            <Home className="size-7" strokeWidth={2} />

            <span className="text-[10px] font-semibold truncate sm:text-sm">
              Início
            </span>
          </Link>

          {/* SOLICITAÇÕES */}
          <Link
            to="/protocolos"
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
          >
            <ListChecks className="size-7" strokeWidth={2} />

            <span className="text-[10px] font-medium truncate sm:text-sm">
              Solicitações
            </span>
          </Link>

          {/* NOVA SOLICITAÇÃO */}
          <Link
            to="/protocolos"
            aria-label="Nova Solicitação"
            className="
              relative
              flex
              h-full
              w-[96px]
              shrink-0
              flex-col
              items-center
              justify-end
              pb-3
              text-primary-deep
              sm:w-[112px]
            "
          >
            <span
              className="
                absolute
                -top-[32px]
                grid
                size-[64px]
                place-items-center
                rounded-full
                bg-primary-deep
                text-primary-foreground
                shadow-[0_10px_30px_-8px_rgba(23,79,44,0.55)]
                sm:-top-[38px]
                sm:size-[76px]
              "
            >
              <Plus className="size-10" strokeWidth={2} />
            </span>

            <span className="inline-block max-w-full whitespace-nowrap text-[9px] font-semibold leading-none sm:text-[15px]">
              Nova Solicitação
            </span>
          </Link>

          {/* AVALIAÇÕES */}
          <Link
            to="/"
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
          >
            <Star className="size-7" strokeWidth={2} />

            <span className="text-[10px] font-medium truncate sm:text-sm">
              Avaliações
            </span>
          </Link>

          {/* PERFIL */}
          <Link
            to="/"
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
          >
            <UserRound className="size-7" strokeWidth={2} />

            <span className="text-[10px] font-medium truncate sm:text-sm">
              Perfil
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
