import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@shared/types";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  active: {
    label: "Active",
    variant: "default",
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  development: {
    label: "Development",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  },
  maintenance: {
    label: "Maintenance",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  },
  planned: {
    label: "Planned",
    variant: "outline",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200",
  },
  archived: {
    label: "Archived",
    variant: "destructive",
    className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
  },
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} text-xs font-medium ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}
