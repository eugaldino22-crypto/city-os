import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/AuthProvider";
import { confirmOccurrence, createOccurrence, listMyOccurrences } from "@/services/occurrences";

import type { NewOccurrenceInput } from "./types";

const occurrenceQueryKey = (citizenId?: string) => ["occurrences", citizenId] as const;

/**
 * The database is the sole source of truth. React Query only caches the latest
 * server response; it never persists occurrences in browser storage.
 */
export function useOccurrences() {
  const { user, loading, configured } = useAuth();

  return useQuery({
    queryKey: occurrenceQueryKey(user?.id),
    queryFn: listMyOccurrences,
    enabled: configured && !loading && Boolean(user),
  });
}

export function useAddOccurrence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewOccurrenceInput) => createOccurrence(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: occurrenceQueryKey(user?.id),
      }),
  });
}

export function useConfirmOccurrence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmOccurrence,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: occurrenceQueryKey(user?.id),
      }),
  });
}
