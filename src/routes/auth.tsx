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
  const { user, loading, configured, sessionError } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/" });
    }
  }, [loading, navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const client = supabase;
    if (!client) {
      setError("A autenticação não está configurada neste ambiente.");
      return;
    }

    if (mode === "sign-up") {
      if (fullName.trim().length === 0) {
        setError("Informe seu nome completo para criar a conta.");
        return;
      }

      if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
        return;
      }

      if (password !== passwordConfirmation) {
        setError("A confirmação de senha não corresponde à senha informada.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(toFriendlyAuthError(signInError.message));
          return;
        }

        await navigate({ to: "/" });
        return;
      }

      const { data, error: signUpError } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (signUpError) {
        setError(toFriendlyAuthError(signUpError.message));
        return;
      }

      if (!data.session) {
        setNotice("Conta criada. Verifique seu email para confirmar o cadastro antes de entrar.");
        setPassword("");
        setPasswordConfirmation("");
        setMode("sign-in");
        return;
      }

      // The auth event updates AuthProvider. The home route then presents the
      // municipality onboarding if the citizen profile has no tenant yet.
      await navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  }

  const isSignUp = mode === "sign-up";

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
          {isSignUp ? "Criar conta no Gestor.IA" : "Entrar no Gestor.IA"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp
            ? "Crie sua conta para acompanhar os serviços da sua cidade."
            : "Use o email e a senha da sua conta."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isSignUp ? (
            <div className="space-y-2">
              <label htmlFor="auth-full-name" className="text-sm font-semibold">
                Nome completo
              </label>
              <Input
                id="auth-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                maxLength={160}
                disabled={!configured || submitting}
              />
            </div>
          ) : null}

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
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={!configured || submitting}
            />
          </div>

          {isSignUp ? (
            <div className="space-y-2">
              <label htmlFor="auth-password-confirmation" className="text-sm font-semibold">
                Confirmar senha
              </label>
              <Input
                id="auth-password-confirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
                minLength={8}
                disabled={!configured || submitting}
              />
            </div>
          ) : null}

          {!configured ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              A autenticação não está configurada neste ambiente.
            </p>
          ) : null}

          {sessionError || error ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {error ?? sessionError}
            </p>
          ) : null}

          {notice ? (
            <p
              className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary"
              role="status"
            >
              {notice}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={!configured || submitting}>
            {submitting
              ? isSignUp
                ? "Criando conta…"
                : "Entrando…"
              : isSignUp
                ? "Criar conta"
                : "Entrar"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(isSignUp ? "sign-in" : "sign-up");
              setError(null);
              setNotice(null);
              setPassword("");
              setPasswordConfirmation("");
            }}
            disabled={submitting}
            className="focus-ring w-full text-sm font-medium text-primary hover:text-primary-deep disabled:opacity-60"
          >
            {isSignUp ? "Já tenho uma conta" : "Criar uma conta"}
          </button>
        </form>
      </section>
    </main>
  );
}

function toFriendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Email ou senha inválidos.";
  }

  if (/user already registered/i.test(message)) {
    return "Já existe uma conta com este email. Entre ou recupere sua senha.";
  }

  if (/password should be at least/i.test(message)) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (/email.*invalid/i.test(message)) {
    return "Informe um email válido.";
  }

  if (/invalid api key/i.test(message)) {
    return "A chave pública do Supabase configurada neste ambiente não é válida para este projeto.";
  }

  return "Não foi possível concluir a autenticação. Tente novamente.";
}
