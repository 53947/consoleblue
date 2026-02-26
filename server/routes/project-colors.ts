import { Router } from "express";
import { eq } from "drizzle-orm";
import { projects } from "../../shared/schema";
import { updateColorsSchema } from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createProjectColorRoutes(
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

  // GET /api/projects/:idOrSlug/colors
  router.get("/", async (req, res, next) => {
    try {
      const project = await findProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({
          error: "Not Found",
          message: `Project "${req.params.idOrSlug}" not found`,
        });
      }

      res.json({
        projectId: project.id,
        slug: project.slug,
        colorPrimary: project.colorPrimary,
        colorAccent: project.colorAccent,
        colorBackground: project.colorBackground,
      });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/projects/:idOrSlug/colors
  router.put(
    "/",
    validateBody(updateColorsSchema),
    async (req, res, next) => {
      try {
        const existing = await findProject(req.params.idOrSlug);
        if (!existing) {
          return res.status(404).json({
            error: "Not Found",
            message: `Project "${req.params.idOrSlug}" not found`,
          });
        }

        const previousColors = {
          colorPrimary: existing.colorPrimary,
          colorAccent: existing.colorAccent,
          colorBackground: existing.colorBackground,
        };

        const [updated] = await db
          .update(projects)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(projects.id, existing.id))
          .returning();

        await auditService.log({
          action: "update",
          entityType: "project",
          entityId: existing.id,
          entitySlug: existing.slug,
          previousValue: previousColors,
          newValue: {
            colorPrimary: updated.colorPrimary,
            colorAccent: updated.colorAccent,
            colorBackground: updated.colorBackground,
          },
          metadata: { field: "colors" },
        });

        res.json({ project: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
