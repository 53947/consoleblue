import { Router } from "express";
import { githubService } from "../services/github.service";
import type { CacheService } from "../services/cache.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createHealthRoutes(
  db: NodePgDatabase,
  cacheService: CacheService,
) {
  const router = Router();

  // GET /api/health — no auth required
  router.get("/", async (_req, res) => {
    let dbStatus: "connected" | "error" = "error";
    try {
      // Simple connectivity check
      await db.execute({ sql: "SELECT 1", params: [] });
      dbStatus = "connected";
    } catch {
      dbStatus = "error";
    }

    let cacheStats = { entries: 0, oldestEntry: null as string | null };
    try {
      cacheStats = await cacheService.stats();
    } catch {
      // ignore
    }

    res.json({
      status: dbStatus === "connected" ? "ok" : "error",
      service: "ConsoleBlue",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      github: githubService.isConfigured ? "configured" : "missing_token",
      cache: cacheStats,
    });
  });

  return router;
}
