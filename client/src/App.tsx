import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProjectListPage from "@/pages/ProjectListPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectGitHubPage from "@/pages/ProjectGitHubPage";
import AuditLogPage from "@/pages/AuditLogPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProjectListPage} />
      <Route path="/projects" component={ProjectListPage} />
      <Route path="/projects/:slug" component={ProjectDetailPage} />
      <Route path="/projects/:slug/github" component={ProjectGitHubPage} />
      <Route path="/audit" component={AuditLogPage} />
      <Route>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
            <p className="text-gray-500">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
