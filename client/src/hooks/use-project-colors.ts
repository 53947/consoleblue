import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ProjectColorsResponse, Project } from "@shared/types";
import type { UpdateColors } from "@shared/validators";

export function useProjectColors(idOrSlug: string) {
  return useQuery({
    queryKey: ["project-colors", idOrSlug],
    queryFn: () =>
      apiClient.get<ProjectColorsResponse>(
        `/projects/${idOrSlug}/colors`,
      ),
    enabled: !!idOrSlug,
  });
}

export function useUpdateProjectColors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrSlug,
      colors,
    }: {
      idOrSlug: string;
      colors: UpdateColors;
    }) =>
      apiClient.put<{ project: Project }>(
        `/projects/${idOrSlug}/colors`,
        colors,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-colors", variables.idOrSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.idOrSlug],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
