import { eq } from "drizzle-orm";
import { projects } from "../../shared/schema";
import { githubService } from "./github.service";
import type { CacheService } from "./cache.service";
import type { AuditService } from "./audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export class SyncService {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private db: NodePgDatabase,
    private cacheService: CacheService,
    private auditService: AuditService,
  ) {}

  start(intervalMinutes: number = 30) {
    console.log(
      `[sync] Starting background sync every ${intervalMinutes} minutes`,
    );

    // Run first sync after a short delay (let server finish starting)
    setTimeout(() => this.syncAll(), 10_000);

    this.intervalId = setInterval(
      () => this.syncAll(),
      intervalMinutes * 60 * 1000,
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[sync] Background sync stopped");
    }
  }

  async syncAll() {
    console.log("[sync] Starting full sync...");
    const synced: string[] = [];
    const errors: string[] = [];

    try {
      const allProjects = await this.db
        .select()
        .from(projects)
        .where(eq(projects.syncEnabled, true));

      // Fetch latest repo data from GitHub
      let repos: Awaited<ReturnType<typeof githubService.listRepos>> = [];
      try {
        repos = await githubService.listRepos();
      } catch (err) {
        console.error("[sync] Failed to fetch repos from GitHub:", err);
        return;
      }

      const repoMap = new Map(repos.map((r) => [r.name, r]));

      for (const project of allProjects) {
        if (!project.githubRepo) continue;

        const repo = repoMap.get(project.githubRepo);
        if (!repo) {
          errors.push(`${project.slug}: repo "${project.githubRepo}" not found`);
          continue;
        }

        try {
          const updates: Record<string, unknown> = {
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          };

          // Update default branch if changed
          if (repo.defaultBranch && repo.defaultBranch !== project.defaultBranch) {
            updates.defaultBranch = repo.defaultBranch;
          }

          // Update description from GitHub if local description is empty
          if (!project.description && repo.description) {
            updates.description = repo.description;
          }

          await this.db
            .update(projects)
            .set(updates)
            .where(eq(projects.id, project.id));

          // Invalidate stale cache for this repo
          await this.cacheService.invalidateByRepo(project.githubRepo);

          synced.push(project.slug);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`${project.slug}: ${msg}`);
        }
      }

      // Clean up expired cache entries
      const cleaned = await this.cacheService.cleanup();

      console.log(
        `[sync] Complete. Synced: ${synced.length}, Errors: ${errors.length}, Cache cleaned: ${cleaned}`,
      );

      await this.auditService.log({
        action: "sync",
        entityType: "github_sync",
        metadata: { synced, errors, cacheCleanedEntries: cleaned },
      });
    } catch (err) {
      console.error("[sync] Fatal error during sync:", err);
    }
  }

  async syncProject(projectIdOrSlug: number | string) {
    const isNumeric = typeof projectIdOrSlug === "number";
    const condition = isNumeric
      ? eq(projects.id, projectIdOrSlug as number)
      : eq(projects.slug, projectIdOrSlug as string);

    const rows = await this.db
      .select()
      .from(projects)
      .where(condition)
      .limit(1);

    if (rows.length === 0) {
      throw new Error(`Project "${projectIdOrSlug}" not found`);
    }

    const project = rows[0];
    if (!project.githubRepo) {
      throw new Error(`Project "${project.slug}" has no linked GitHub repo`);
    }

    // Invalidate cache and update sync timestamp
    await this.cacheService.invalidateByRepo(project.githubRepo);
    await this.db
      .update(projects)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(projects.id, project.id));

    await this.auditService.log({
      action: "sync",
      entityType: "project",
      entityId: project.id,
      entitySlug: project.slug,
    });

    return project;
  }
}
