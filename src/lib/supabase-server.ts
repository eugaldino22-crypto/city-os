import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

type CookieData = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function createSupabaseServerClient(
  request: Request,
  responseHeaders: Headers,
) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll(): CookieData[] {
        const header = request.headers.get("cookie") ?? "";

        return header
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => {
            const separator = item.indexOf("=");

            return {
              name:
                separator >= 0 ? item.slice(0, separator) : item,
              value:
                separator >= 0 ? item.slice(separator + 1) : "",
            };
          });
      },

      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          const cookie = [
            `${name}=${value}`,
            "Path=/",
            options?.httpOnly ? "HttpOnly" : "",
            options?.secure ? "Secure" : "",
            options?.sameSite
              ? `SameSite=${String(options.sameSite)}`
              : "",
            options?.maxAge != null
              ? `Max-Age=${String(options.maxAge)}`
              : "",
          ]
            .filter(Boolean)
            .join("; ");

          responseHeaders.append("Set-Cookie", cookie);
        }

        for (const [name, value] of Object.entries(headers)) {
          responseHeaders.set(name, value);
        }
      },
    },
  });
}
