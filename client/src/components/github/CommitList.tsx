import { useGithubCommits } from "@/hooks/use-github";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCommit, ExternalLink } from "lucide-react";

interface CommitListProps {
  repo: string;
  count?: number;
}

export function CommitList({ repo, count = 10 }: CommitListProps) {
  const { data, isLoading, error } = useGithubCommits(repo, count);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to load commits: {error.message}
      </div>
    );
  }

  if (!data?.commits.length) {
    return <div className="text-sm text-gray-400">No commits found</div>;
  }

  return (
    <div className="space-y-1">
      {data.commits.map((commit) => (
        <div
          key={commit.sha}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <GitCommit className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {commit.message.split("\n")[0]}
              </p>
              <a
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-gray-500 flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-mono">{commit.sha.slice(0, 7)}</span>
              <span>{commit.author}</span>
              <span>
                {new Date(commit.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year:
                    new Date(commit.date).getFullYear() !==
                    new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                })}
              </span>
            </div>
          </div>
        </div>
      ))}

      {data.cached && (
        <div className="text-xs text-gray-300 text-right pt-1">
          Cached {data.cachedAt ? `at ${new Date(data.cachedAt).toLocaleTimeString()}` : ""}
        </div>
      )}
    </div>
  );
}
