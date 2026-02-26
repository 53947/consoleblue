import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { useDeleteProject } from "@/hooks/use-projects";

interface ProjectDeleteDialogProps {
  projectSlug: string;
  projectName: string;
  onDeleted?: () => void;
}

export function ProjectDeleteDialog({
  projectSlug,
  projectName,
  onDeleted,
}: ProjectDeleteDialogProps) {
  const [hardDelete, setHardDelete] = useState(false);
  const deleteProject = useDeleteProject();

  const handleDelete = () => {
    deleteProject.mutate(
      { idOrSlug: projectSlug, hard: hardDelete },
      { onSuccess: onDeleted },
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {projectName}?</AlertDialogTitle>
          <AlertDialogDescription>
            By default, this will archive the project and hide it from the
            dashboard. You can restore it later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="hard-delete"
            checked={hardDelete}
            onCheckedChange={(checked) =>
              setHardDelete(checked === true)
            }
          />
          <label
            htmlFor="hard-delete"
            className="text-sm text-red-600 font-medium cursor-pointer"
          >
            Permanently delete (cannot be undone)
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className={
              hardDelete
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }
          >
            {deleteProject.isPending
              ? "Deleting..."
              : hardDelete
                ? "Permanently Delete"
                : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
