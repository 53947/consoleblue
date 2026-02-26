import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AuditLogResponse, AuditAction } from "@shared/types";

export function useAuditLog(filters?: {
  entityType?: string;
  entityId?: number;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["audit-log", filters],
    queryFn: () =>
      apiClient.get<AuditLogResponse>("/audit", filters),
  });
}
