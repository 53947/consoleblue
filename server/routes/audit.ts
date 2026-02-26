import { Router } from "express";
import type { AuditService } from "../services/audit.service";
import type { AuditAction } from "../../shared/types";

export function createAuditRoutes(auditService: AuditService) {
  const router = Router();

  // GET /api/audit
  router.get("/", async (req, res, next) => {
    try {
      const filters = {
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId
          ? parseInt(req.query.entityId as string, 10)
          : undefined,
        action: req.query.action as AuditAction | undefined,
        limit: req.query.limit
          ? Math.min(parseInt(req.query.limit as string, 10), 200)
          : 50,
        offset: req.query.offset
          ? parseInt(req.query.offset as string, 10)
          : 0,
      };

      const result = await auditService.query(filters);

      res.json({
        entries: result.entries,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
