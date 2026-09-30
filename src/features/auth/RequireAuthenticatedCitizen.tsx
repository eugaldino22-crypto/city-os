import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "./AuthProvider";

export function RequireAuthenticatedCitizen({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!configured || !user)) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [configured, loading, navigate, user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
        Verificando sua sessão…
      </main>
    );
  }

  if (!configured || !user) {
    return null;
  }

  return <>{children}</>;
}
