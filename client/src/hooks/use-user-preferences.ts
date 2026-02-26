import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { UserPreference } from "@shared/types";

export function useUserPreferences() {
  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: () =>
      apiClient.get<{ preferences: UserPreference[] }>(
        "/user/preferences",
      ),
  });
}

export function useUserPreference(key: string) {
  return useQuery({
    queryKey: ["user-preferences", key],
    queryFn: () =>
      apiClient.get<{ key: string; value: string }>(
        `/user/preferences/${key}`,
      ),
    enabled: !!key,
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: { key: string; value: string }[]) =>
      apiClient.put<{ preferences: UserPreference[] }>(
        "/user/preferences",
        { preferences },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
}
