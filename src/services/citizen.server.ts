import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

const avatarPathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/avatar\.(?:jpg|jpeg|png|webp)$/i;

const citizenProfileUpdateSchema = z
  .object({
    full_name: z.string().trim().min(1).max(160).nullable().optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    avatar_path: z.string().regex(avatarPathPattern).nullable().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, "Informe ao menos um campo do perfil.");

export type CurrentCitizenProfileUpdateInput = z.infer<typeof citizenProfileUpdateSchema>;

/**
 * Same-origin profile mutation. The browser sends only allowlisted profile
 * fields; the canonical citizen id always comes from the Supabase SSR cookie.
 */
export const updateCurrentCitizenProfileServer = createServerFn({ method: "POST" })
  .validator(citizenProfileUpdateSchema)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    if (data.avatar_path != null && !data.avatar_path.startsWith(`${user.id}/avatar.`)) {
      throw new Error("AVATAR_PATH_NOT_OWNED_BY_CURRENT_USER");
    }

    const update: Database["public"]["Tables"]["citizen_profiles"]["Update"] = {};

    if (data.full_name !== undefined) update.full_name = data.full_name;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.avatar_path !== undefined) update.avatar_path = data.avatar_path;

    const { data: profile, error } = await supabase
      .from("citizen_profiles")
      .update(update)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return profile;
  });
