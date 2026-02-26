import { useState } from "react";
import { useGithubTree } from "@/hooks/use-github";
import { FileViewer } from "./FileViewer";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RepoExplorerProps {
  repo: string;
  className?: string;
}

export function RepoExplorer({ repo, className }: RepoExplorerProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data, isLoading, error } = useGithubTree(repo, currentPath);

  const breadcrumbs = currentPath
    ? currentPath.split("/").reduce<{ label: string; path: string }[]>(
        (acc, part, i) => {
          const path = acc.length > 0 ? `${acc[acc.length - 1].path}/${part}` : part;
          return [...acc, { label: part, path }];
        },
        [],
      )
    : [];

  const handleItemClick = (item: { name: string; path: string; type: string }) => {
    if (item.type === "dir") {
      setCurrentPath(item.path);
      setSelectedFile(null);
    } else {
      setSelectedFile(item.path);
    }
  };

  const goUp = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
    setSelectedFile(null);
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b text-sm overflow-x-auto">
        <button
          onClick={() => {
            setCurrentPath("");
            setSelectedFile(null);
          }}
          className="text-blue-600 hover:underline font-medium flex-shrink-0"
        >
          {repo}
        </button>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.path} className="flex items-center gap-1 flex-shrink-0">
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <button
              onClick={() => {
                setCurrentPath(crumb.path);
                setSelectedFile(null);
              }}
              className="text-blue-600 hover:underline"
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>

      <div className="flex divide-x" style={{ minHeight: "400px" }}>
        {/* File tree */}
        <div className="w-72 flex-shrink-0 overflow-y-auto">
          {currentPath && (
            <button
              onClick={goUp}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b"
            >
              <ArrowLeft className="h-4 w-4" />
              ..
            </button>
          )}

          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-3 text-sm text-red-500">
              Failed to load: {error.message}
            </div>
          ) : (
            <div>
              {/* Sort: directories first, then files */}
              {data?.contents
                ?.sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === "dir" ? -1 : 1;
                })
                .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors text-left",
                      selectedFile === item.path && "bg-blue-50 text-blue-700",
                    )}
                  >
                    {item.type === "dir" ? (
                      <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                    {item.size !== null && item.type !== "dir" && (
                      <span className="ml-auto text-xs text-gray-300 flex-shrink-0">
                        {item.size > 1024
                          ? `${(item.size / 1024).toFixed(1)}KB`
                          : `${item.size}B`}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* File content viewer */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            <FileViewer repo={repo} path={selectedFile} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a file to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
