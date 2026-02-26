import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  GithubReposResponse,
  GithubTreeResponse,
  GithubFileResponse,
  GithubCommitsResponse,
  GithubRoutesResponse,
  GithubSearchResponse,
  SyncResponse,
} from "@shared/types";

export function useGithubRepos(force?: boolean) {
  return useQuery({
    queryKey: ["github-repos", force],
    queryFn: () =>
      apiClient.get<GithubReposResponse>("/github/repos", {
        force: force || undefined,
      }),
  });
}

export function useGithubTree(repo: string, path?: string) {
  return useQuery({
    queryKey: ["github-tree", repo, path],
    queryFn: () =>
      apiClient.get<GithubTreeResponse>("/github/tree", { repo, path }),
    enabled: !!repo,
  });
}

export function useGithubFile(repo: string, path: string) {
  return useQuery({
    queryKey: ["github-file", repo, path],
    queryFn: () =>
      apiClient.get<GithubFileResponse>("/github/file", { repo, path }),
    enabled: !!repo && !!path,
  });
}

export function useGithubCommits(repo: string, count?: number) {
  return useQuery({
    queryKey: ["github-commits", repo, count],
    queryFn: () =>
      apiClient.get<GithubCommitsResponse>("/github/commits", {
        repo,
        count,
      }),
    enabled: !!repo,
  });
}

export function useGithubRoutes(repo: string) {
  return useQuery({
    queryKey: ["github-routes", repo],
    queryFn: () =>
      apiClient.get<GithubRoutesResponse>("/github/routes", { repo }),
    enabled: !!repo,
  });
}

export function useGithubSearch(repo: string, query: string, path?: string) {
  return useQuery({
    queryKey: ["github-search", repo, query, path],
    queryFn: () =>
      apiClient.get<GithubSearchResponse>("/github/search", {
        repo,
        query,
        path,
      }),
    enabled: !!repo && !!query,
  });
}

export function useGithubSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { projectId?: number; repo?: string }) =>
      apiClient.post<SyncResponse>("/github/sync", params),
    onSuccess: () => {
      // Invalidate all github-related queries after sync
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
      queryClient.invalidateQueries({ queryKey: ["github-tree"] });
      queryClient.invalidateQueries({ queryKey: ["github-file"] });
      queryClient.invalidateQueries({ queryKey: ["github-commits"] });
      queryClient.invalidateQueries({ queryKey: ["github-routes"] });
      queryClient.invalidateQueries({ queryKey: ["github-search"] });
    },
  });
}
