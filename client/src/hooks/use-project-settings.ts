import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ProjectSetting } from "@shared/types";

export function useProjectSettings(
  idOrSlug: string,
  category?: string,
) {
  return useQuery({
    queryKey: ["project-settings", idOrSlug, category],
    queryFn: () =>
      apiClient.get<{ settings: ProjectSetting[] }>(
        `/projects/${idOrSlug}/settings`,
        category ? { category } : undefined,
      ),
    enabled: !!idOrSlug,
  });
}

export function useUpsertProjectSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrSlug,
      settings,
    }: {
      idOrSlug: string;
      settings: {
        key: string;
        value: string | null;
        valueType?: string;
        category?: string;
        description?: string;
      }[];
    }) =>
      apiClient.put<{ settings: ProjectSetting[] }>(
        `/projects/${idOrSlug}/settings`,
        { settings },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-settings", variables.idOrSlug],
      });
    },
  });
}

export function useDeleteProjectSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrSlug,
      key,
    }: {
      idOrSlug: string;
      key: string;
    }) =>
      apiClient.delete<{ success: boolean }>(
        `/projects/${idOrSlug}/settings/${key}`,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-settings", variables.idOrSlug],
      });
    },
  });
}
