import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ProjectListResponse,
  ProjectDetailResponse,
  ReorderResponse,
  DeleteResponse,
  Project,
} from "@shared/types";
import type { InsertProject, UpdateProject } from "@shared/validators";

export function useProjects(filters?: {
  status?: string;
  visible?: string;
  tag?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: () => apiClient.get<ProjectListResponse>("/projects", filters),
  });
}

export function useProject(idOrSlug: string) {
  return useQuery({
    queryKey: ["projects", idOrSlug],
    queryFn: () =>
      apiClient.get<ProjectDetailResponse>(`/projects/${idOrSlug}`),
    enabled: !!idOrSlug,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertProject) =>
      apiClient.post<{ project: Project }>("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrSlug,
      data,
    }: {
      idOrSlug: string;
      data: UpdateProject;
    }) => apiClient.put<{ project: Project }>(`/projects/${idOrSlug}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.idOrSlug],
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrSlug,
      hard,
    }: {
      idOrSlug: string;
      hard?: boolean;
    }) =>
      apiClient.delete<DeleteResponse>(`/projects/${idOrSlug}`, {
        hard: hard || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectIds: number[]) =>
      apiClient.post<ReorderResponse>("/projects/reorder", { projectIds }),
    onMutate: async (projectIds) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous =
        queryClient.getQueryData<ProjectListResponse>(["projects"]);

      // Optimistic reorder
      if (previous) {
        const reordered = projectIds
          .map((id) => previous.projects.find((p) => p.id === id))
          .filter(Boolean) as Project[];

        queryClient.setQueryData<ProjectListResponse>(["projects"], {
          projects: reordered,
          total: reordered.length,
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
