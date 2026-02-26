import { useRoute, Link } from "wouter";
import { useProject } from "@/hooks/use-projects";
import { RepoExplorer } from "@/components/github/RepoExplorer";
import { CommitList } from "@/components/github/CommitList";
import { RouteList } from "@/components/github/RouteList";
import { ProjectSyncButton } from "@/components/projects/ProjectSyncButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FolderTree, GitCommit, Route } from "lucide-react";

export default function ProjectGitHubPage() {
  const [, params] = useRoute("/projects/:slug/github");
  const slug = params?.slug || "";
  const { data, isLoading, error } = useProject(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Project not found</p>
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { project } = data;

  if (!project.githubRepo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No GitHub repo linked</p>
          <Link href={`/projects/${slug}`}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/projects/${slug}`}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {project.displayName}
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              GitHub: {project.githubRepo}
            </h1>
          </div>
          <ProjectSyncButton
            repo={project.githubRepo}
            projectId={project.id}
            lastSyncedAt={project.lastSyncedAt}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="explorer">
          <TabsList className="mb-4">
            <TabsTrigger value="explorer" className="gap-1">
              <FolderTree className="h-4 w-4" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="commits" className="gap-1">
              <GitCommit className="h-4 w-4" />
              Commits
            </TabsTrigger>
            <TabsTrigger value="routes" className="gap-1">
              <Route className="h-4 w-4" />
              Routes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explorer">
            <RepoExplorer repo={project.githubRepo} />
          </TabsContent>

          <TabsContent value="commits">
            <Card>
              <CardHeader>
                <CardTitle>Recent Commits</CardTitle>
              </CardHeader>
              <CardContent>
                <CommitList repo={project.githubRepo} count={20} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <RouteList repo={project.githubRepo} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
