import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./AuthProvider";
import {
  ensureCurrentCitizenProfile,
  getCurrentCitizenAvatarUrl,
  linkCurrentCitizenMunicipality,
  listActiveMunicipalities,
  uploadCurrentCitizenAvatar,
  updateCurrentCitizenProfile,
} from "@/services/citizen";

export function useCitizenProfile() {
  const { user, loading, configured } = useAuth();

  return useQuery({
    queryKey: ["citizen-profile", user?.id],
    queryFn: () => ensureCurrentCitizenProfile(),
    enabled: configured && !loading && Boolean(user),
  });
}

export function useUpdateCitizenProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentCitizenProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["citizen-profile", user?.id], profile);
    },
  });
}

export function useCitizenAvatarUrl(
  profile: Awaited<ReturnType<typeof ensureCurrentCitizenProfile>> | undefined,
) {
  const { user, loading, configured } = useAuth();

  return useQuery({
    queryKey: ["citizen-avatar-url", user?.id, profile?.avatar_path, profile?.updated_at],
    queryFn: () => getCurrentCitizenAvatarUrl(profile?.avatar_path ?? null, profile?.updated_at),
    enabled: configured && !loading && Boolean(user) && Boolean(profile?.avatar_path),
    staleTime: 55 * 60 * 1000,
  });
}

export function useUploadCitizenAvatar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadCurrentCitizenAvatar,
    onSuccess: (profile) => {
      queryClient.setQueryData(["citizen-profile", user?.id], profile);
      void queryClient.invalidateQueries({ queryKey: ["citizen-avatar-url", user?.id] });
    },
  });
}

export function useLinkCurrentCitizenMunicipality() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkCurrentCitizenMunicipality,
    onSuccess: (profile) => {
      queryClient.setQueryData(["citizen-profile", user?.id], profile);
      void queryClient.invalidateQueries({ queryKey: ["municipal-occurrences", user?.id] });
    },
  });
}

export function useActiveMunicipalities() {
  const { configured } = useAuth();

  return useQuery({
    queryKey: ["active-municipalities"],
    queryFn: listActiveMunicipalities,
    enabled: configured,
    staleTime: 5 * 60 * 1000,
  });
}
