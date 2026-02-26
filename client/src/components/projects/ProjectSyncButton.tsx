import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useGithubSync } from "@/hooks/use-github";
import { cn } from "@/lib/utils";

interface ProjectSyncButtonProps {
  repo?: string | null;
  projectId?: number;
  lastSyncedAt?: string | null;
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function ProjectSyncButton({
  repo,
  projectId,
  lastSyncedAt,
  size = "sm",
  className,
}: ProjectSyncButtonProps) {
  const sync = useGithubSync();
  const [justSynced, setJustSynced] = useState(false);

  const handleSync = () => {
    sync.mutate(
      { repo: repo || undefined, projectId },
      {
        onSuccess: () => {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
        },
      },
    );
  };

  const formatSyncTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size={size}
        onClick={handleSync}
        disabled={sync.isPending}
        className="text-gray-500 hover:text-gray-700"
      >
        <RefreshCw
          className={cn(
            "h-4 w-4",
            sync.isPending && "animate-spin",
          )}
        />
        {size !== "icon" && (
          <span className="ml-1">
            {sync.isPending ? "Syncing..." : justSynced ? "Synced" : "Sync"}
          </span>
        )}
      </Button>
      {lastSyncedAt && size !== "icon" && (
        <span className="text-xs text-gray-400">
          {formatSyncTime(lastSyncedAt)}
        </span>
      )}
    </div>
  );
}
