import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { detectIntent } from "./intent";

const EXAMPLES = [
  "Minha rua está sem iluminação",
  "Preciso marcar uma consulta",
  "Quero pagar meu IPTU",
  "Meu filho precisa de vaga em creche",
  "Tem uma árvore caída na rua",
];

export function AIAssistant() {
  const [value, setValue] = useState("");
  const intent = useMemo(() => detectIntent(value), [value]);

  return (
    <section aria-labelledby="assistente-ia" className="card-premium p-5 sm:p-7">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="size-5" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">Assistente Gestor.IA</span>
      </div>

      <h2 id="assistente-ia" className="mt-3 text-2xl font-semibold sm:text-3xl">
        O que você precisa resolver hoje?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Escreva com suas palavras. A IA entende sua necessidade e leva você direto ao serviço certo.
      </p>

      <div className="mt-5 rounded-2xl border border-border bg-surface-elevated p-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder="Ex.: tem um poste apagado na minha rua há três dias"
          className="focus-ring w-full resize-none rounded-xl bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <p className="text-xs text-muted-foreground">
            {intent ? `Entendi: ${intent.label}` : "Aguardando sua descrição…"}
          </p>
          {intent ? (
            <Link
              to={intent.to}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-deep"
            >
              Continuar
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
              Continuar
            </span>
          )}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => setValue(example)}
              className="focus-ring rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
