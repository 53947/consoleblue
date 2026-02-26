import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { projects, projectSettings } from "../../shared/schema";
import { upsertSettingsSchema } from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createProjectSettingsRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router({ mergeParams: true });

  // Helper: find project by ID or slug
  async function findProject(idOrSlug: string) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const condition = isNumeric
      ? eq(projects.id, parseInt(idOrSlug, 10))
      : eq(projects.slug, idOrSlug);
    const rows = await db.select().from(projects).where(condition).limit(1);
    return rows[0] || null;
  }

  // GET /api/projects/:idOrSlug/settings
  router.get("/", async (req, res, next) => {
    try {
      const project = await findProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({
          error: "Not Found",
          message: `Project "${req.params.idOrSlug}" not found`,
        });
      }

      let settings = await db
        .select()
        .from(projectSettings)
        .where(eq(projectSettings.projectId, project.id));

      // Filter by category if specified
      if (req.query.category) {
        settings = settings.filter(
          (s) => s.category === req.query.category,
        );
      }

      res.json({ settings });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/projects/:idOrSlug/settings
  router.put(
    "/",
    validateBody(upsertSettingsSchema),
    async (req, res, next) => {
      try {
        const project = await findProject(req.params.idOrSlug);
        if (!project) {
          return res.status(404).json({
            error: "Not Found",
            message: `Project "${req.params.idOrSlug}" not found`,
          });
        }

        const { settings: inputSettings } = req.body as {
          settings: {
            key: string;
            value: string | null;
            valueType?: string;
            category?: string;
            description?: string;
          }[];
        };

        const results = [];

        for (const setting of inputSettings) {
          const existing = await db
            .select()
            .from(projectSettings)
            .where(
              and(
                eq(projectSettings.projectId, project.id),
                eq(projectSettings.key, setting.key),
              ),
            )
            .limit(1);

          if (existing.length > 0) {
            const [updated] = await db
              .update(projectSettings)
              .set({
                value: setting.value,
                valueType: setting.valueType || existing[0].valueType,
                category: setting.category || existing[0].category,
                description: setting.description || existing[0].description,
                updatedAt: new Date(),
              })
              .where(eq(projectSettings.id, existing[0].id))
              .returning();
            results.push(updated);
          } else {
            const [created] = await db
              .insert(projectSettings)
              .values({
                projectId: project.id,
                key: setting.key,
                value: setting.value,
                valueType: setting.valueType || "string",
                category: setting.category,
                description: setting.description,
              })
              .returning();
            results.push(created);
          }
        }

        await auditService.log({
          action: "settings_change",
          entityType: "project_settings",
          entityId: project.id,
          entitySlug: project.slug,
          newValue: inputSettings,
        });

        res.json({ settings: results });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/projects/:idOrSlug/settings/:key
  router.delete("/:key", async (req, res, next) => {
    try {
      const project = await findProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({
          error: "Not Found",
          message: `Project "${req.params.idOrSlug}" not found`,
        });
      }

      const existing = await db
        .select()
        .from(projectSettings)
        .where(
          and(
            eq(projectSettings.projectId, project.id),
            eq(projectSettings.key, req.params.key),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: `Setting "${req.params.key}" not found for project "${req.params.idOrSlug}"`,
        });
      }

      await db
        .delete(projectSettings)
        .where(eq(projectSettings.id, existing[0].id));

      await auditService.log({
        action: "settings_change",
        entityType: "project_settings",
        entityId: project.id,
        entitySlug: project.slug,
        previousValue: existing[0],
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
