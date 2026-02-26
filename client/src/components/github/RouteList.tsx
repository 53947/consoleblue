import { useGithubRoutes } from "@/hooks/use-github";
import { Skeleton } from "@/components/ui/skeleton";
import { Route, FileCode } from "lucide-react";

interface RouteListProps {
  repo: string;
}

export function RouteList({ repo }: RouteListProps) {
  const { data, isLoading, error } = useGithubRoutes(repo);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to extract routes: {error.message}
      </div>
    );
  }

  if (!data || data.routeCount === 0) {
    return <div className="text-sm text-gray-400">No routes found</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-400 pb-2 border-b">
        <FileCode className="h-3 w-3" />
        <span>
          {data.routeCount} routes from{" "}
          <span className="font-mono">{data.sourceFile}</span>
        </span>
      </div>

      <div className="space-y-0.5">
        {data.routes.map((route) => (
          <div
            key={route}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 text-sm font-mono"
          >
            <Route className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-gray-700">{route}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
