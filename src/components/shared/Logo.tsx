import { cn } from "@/lib/utils";

/**
 * Logomarca oficial Gestor.IA (marca tipográfica institucional).
 * Cores vêm exclusivamente dos tokens do Design System.
 */
export function Logo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn(
          "grid size-8 place-items-center rounded-lg font-bold",
          variant === "onDark"
            ? "bg-accent text-accent-foreground"
            : "surface-institutional",
        )}
      >
        G
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          variant === "onDark" ? "text-primary-foreground" : "text-foreground",
        )}
      >
        Gestor
        <span className={variant === "onDark" ? "text-accent" : "text-primary"}>.IA</span>
      </span>
    </span>
  );
}
