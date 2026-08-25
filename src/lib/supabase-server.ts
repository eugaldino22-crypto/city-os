import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

type ServerCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function createSupabaseServerClient(request: Request) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll(): ServerCookie[] {
        const cookieHeader = request.headers.get("cookie") ?? "";

        return cookieHeader
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const index = part.indexOf("=");

            return {
              name: index >= 0 ? part.slice(0, index) : part,
              value: index >= 0 ? part.slice(index + 1) : "",
            };
          });
      },
      setAll(_cookiesToSet) {
        // O gerenciamento dos Set-Cookie será integrado ao pipeline
        // de resposta do TanStack Start em uma etapa específica.
      },
    },
  );
}
