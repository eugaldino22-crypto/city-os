import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";

import type { Database } from "@/types/database";

export function createSupabaseServerClient() {
  // Vite injects VITE_* values in a local Start build, while a deployed
  // runtime may expose them through process.env. Keep one configuration path
  // for browser and server so their cookie names and auth project match.
  const url = process.env["VITE_SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  return createServerClient<Database>(url, key, {
    cookieOptions: {
      sameSite: "lax",
      secure: import.meta.env.PROD,
    },
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },

      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          setResponseHeader(name, value);
        });
      },
    },
  });
}
