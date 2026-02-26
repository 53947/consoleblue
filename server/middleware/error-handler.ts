import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(
    `[${new Date().toISOString()}] Error:`,
    err.message,
  );

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
    });
  }

  // Octokit / GitHub API errors
  if (err.status && typeof err.status === "number") {
    const status = err.status;
    const message =
      status === 404
        ? "Resource not found on GitHub"
        : status === 403
          ? "GitHub API rate limit exceeded or access denied"
          : err.message;

    return res.status(status).json({
      error: `GitHub API Error (${status})`,
      message,
    });
  }

  // Default 500
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
}
