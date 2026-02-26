import { Clock, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusIndicatorProps {
  cached: boolean;
  cachedAt?: string;
  className?: string;
}

export function SyncStatusIndicator({
  cached,
  cachedAt,
  className,
}: SyncStatusIndicatorProps) {
  if (!cached) {
    return (
      <span className={cn("flex items-center gap-1 text-xs text-green-500", className)}>
        <Check className="h-3 w-3" />
        Live data
      </span>
    );
  }

  if (!cachedAt) {
    return (
      <span className={cn("flex items-center gap-1 text-xs text-gray-400", className)}>
        <Clock className="h-3 w-3" />
        Cached
      </span>
    );
  }

  const age = Date.now() - new Date(cachedAt).getTime();
  const minutes = Math.floor(age / 60000);
  const isStale = minutes > 10;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        isStale ? "text-yellow-500" : "text-gray-400",
        className,
      )}
    >
      {isStale ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {minutes < 1
        ? "Cached just now"
        : minutes < 60
          ? `Cached ${minutes}m ago`
          : `Cached ${Math.floor(minutes / 60)}h ago`}
    </span>
  );
}
