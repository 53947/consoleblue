import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LayoutGrid } from "lucide-react";

export default function ProjectListPage() {
  const { data, isLoading, error } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            {data && (
              <span className="text-sm text-gray-400">
                {data.total} total
              </span>
            )}
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <ProjectForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-2">Failed to load projects</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        ) : (
          <ProjectGrid projects={data?.projects || []} />
        )}
      </div>
    </div>
  );
}
