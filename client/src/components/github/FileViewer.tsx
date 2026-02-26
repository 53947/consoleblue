import { useGithubFile } from "@/hooks/use-github";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FileViewerProps {
  repo: string;
  path: string;
}

export function FileViewer({ repo, path }: FileViewerProps) {
  const { data, isLoading, error } = useGithubFile(repo, path);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (data?.content) {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load file: {error.message}
      </div>
    );
  }

  if (!data) return null;

  const lines = data.content.split("\n");
  const extension = path.split(".").pop()?.toLowerCase() || "";

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b sticky top-0">
        <div className="text-sm">
          <span className="font-medium text-gray-700">{data.name}</span>
          <span className="text-gray-400 ml-2">
            {data.size > 1024
              ? `${(data.size / 1024).toFixed(1)} KB`
              : `${data.size} bytes`}
          </span>
          <span className="text-gray-400 ml-2">{lines.length} lines</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-auto">
        <pre className="text-sm leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-yellow-50">
                <span className="select-none text-right text-gray-300 pr-4 pl-4 py-0 w-12 flex-shrink-0 text-xs leading-relaxed">
                  {i + 1}
                </span>
                <span className="flex-1 pr-4 whitespace-pre-wrap break-all">
                  {line}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
