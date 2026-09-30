import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  sessionError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const sessionValidationTimeoutMs = 12_000;

function withSessionValidationTimeout<T>(promise: Promise<T>) {
  let timeoutId: number | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("SESSION_VALIDATION_TIMEOUT"));
    }, sessionValidationTimeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let initialSessionReceived = false;

    const isMissingSessionError = (error: { message: string }) =>
      /auth session missing/i.test(error.message);

    const sessionValidationMessage = (error: { message: string }) => {
      if (/invalid api key/i.test(error.message)) {
        return "A chave pública do Supabase configurada neste ambiente não é válida para este projeto.";
      }

      return "Não foi possível validar sua sessão. Entre novamente para continuar.";
    };

    const loadAuthenticatedUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await withSessionValidationTimeout(client.auth.getUser());

        if (!mounted) return;

        if (error) {
          // `getUser` validates the cookie-backed access token with Supabase.
          // A cached browser session must never be treated as authenticated here.
          setUser(null);

          if (isMissingSessionError(error)) {
            setSessionError(null);
          } else {
            console.error("Sessão do Supabase não pôde ser validada:", error.message);
            setSessionError(sessionValidationMessage(error));
          }
        } else {
          setUser(user ?? null);
          setSessionError(null);
        }
      } catch (error) {
        if (!mounted) return;

        setUser(null);
        console.error("A validação da sessão do Supabase falhou:", error);
        setSessionError(
          "Não foi possível alcançar o Supabase para validar sua sessão. Verifique a configuração deste ambiente.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // INITIAL_SESSION is emitted by Supabase after it reads its cookie store.
    // Keep the application recoverable if browser storage itself becomes
    // unavailable instead of leaving protected routes in a loading state.
    const initialSessionTimeoutId = window.setTimeout(() => {
      if (!mounted || initialSessionReceived) return;

      setUser(null);
      setSessionError(
        "Não foi possível iniciar sua sessão neste navegador. Atualize a página ou entre novamente.",
      );
      setLoading(false);
    }, sessionValidationTimeoutMs);

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "INITIAL_SESSION") {
        initialSessionReceived = true;

        if (initialSessionTimeoutId !== undefined) {
          window.clearTimeout(initialSessionTimeoutId);
        }

        // A missing session is an expected anonymous state. Avoid calling
        // getUser() in that case: it can wait for an unnecessary auth lock
        // before returning "Auth session missing!", delaying route guards.
        if (!session) {
          setUser(null);
          setSessionError(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        void loadAuthenticatedUser();
        return;
      }

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setSessionError(null);
        setLoading(false);
        return;
      }

      // Do not trust the user object cached in cookie storage as the final
      // source of identity. Re-validate after SIGNED_IN and TOKEN_REFRESHED;
      // the callback itself must remain synchronous to avoid auth deadlocks.
      if (event === "SIGNED_IN") {
        setLoading(true);
      }

      void loadAuthenticatedUser();
    });

    return () => {
      mounted = false;

      window.clearTimeout(initialSessionTimeoutId);

      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: Boolean(supabase),
      sessionError,

      signOut: async () => {
        const client = supabase;
        if (!client) return;

        const { error } = await client.auth.signOut();

        if (error) {
          throw error;
        }

        setUser(null);
      },
    }),
    [user, loading, sessionError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
