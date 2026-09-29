import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./AuthProvider";
import {
  ensureCurrentCitizenProfile,
  listActiveMunicipalities,
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

export function useActiveMunicipalities() {
  const { configured } = useAuth();

  return useQuery({
    queryKey: ["active-municipalities"],
    queryFn: listActiveMunicipalities,
    enabled: configured,
    staleTime: 5 * 60 * 1000,
  });
}
