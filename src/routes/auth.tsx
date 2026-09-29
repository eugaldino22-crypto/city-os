import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/" });
    }
  }, [loading, navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const client = supabase;
    if (!client) {
      setError("A autenticação não está configurada neste ambiente.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    await navigate({ to: "/" });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
      <section className="card-premium w-full p-6 sm:p-8" aria-labelledby="auth-title">
        <Link
          to="/"
          className="focus-ring text-sm font-medium text-primary hover:text-primary-deep"
        >
          Voltar ao portal
        </Link>

        <h1 id="auth-title" className="mt-6 text-2xl font-bold tracking-tight">
          Entrar no Gestor.IA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Use o email e a senha da sua conta.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="auth-email" className="text-sm font-semibold">
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={!configured || submitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-password" className="text-sm font-semibold">
              Senha
            </label>
            <Input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={!configured || submitting}
            />
          </div>

          {!configured ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              A autenticação não está configurada neste ambiente.
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={!configured || submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </section>
    </main>
  );
}
