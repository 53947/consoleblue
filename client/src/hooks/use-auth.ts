import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<{ user: AuthUser }>("/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ success: boolean }>("/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
