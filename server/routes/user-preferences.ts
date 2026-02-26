import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { userPreferences } from "../../shared/schema";
import { upsertPreferencesSchema } from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createUserPreferencesRoutes(db: NodePgDatabase) {
  const router = Router();

  // For now, use a fixed user ID. When auth is integrated, pull from session.
  function getUserId(_req: Express.Request): number {
    return 1;
  }

  // GET /api/user/preferences
  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      res.json({ preferences: prefs });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/user/preferences/:key
  router.get("/:key", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const rows = await db
        .select()
        .from(userPreferences)
        .where(
          and(
            eq(userPreferences.userId, userId),
            eq(userPreferences.key, req.params.key),
          ),
        )
        .limit(1);

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: `Preference "${req.params.key}" not found`,
        });
      }

      res.json({ key: rows[0].key, value: rows[0].value });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/user/preferences
  router.put(
    "/",
    validateBody(upsertPreferencesSchema),
    async (req, res, next) => {
      try {
        const userId = getUserId(req);
        const { preferences } = req.body as {
          preferences: { key: string; value: string }[];
        };

        const results = [];

        for (const pref of preferences) {
          const existing = await db
            .select()
            .from(userPreferences)
            .where(
              and(
                eq(userPreferences.userId, userId),
                eq(userPreferences.key, pref.key),
              ),
            )
            .limit(1);

          if (existing.length > 0) {
            const [updated] = await db
              .update(userPreferences)
              .set({ value: pref.value, updatedAt: new Date() })
              .where(eq(userPreferences.id, existing[0].id))
              .returning();
            results.push(updated);
          } else {
            const [created] = await db
              .insert(userPreferences)
              .values({ userId, key: pref.key, value: pref.value })
              .returning();
            results.push(created);
          }
        }

        res.json({ preferences: results });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
