import type { Request, Response, NextFunction } from "express";

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const expectedKey = process.env.CONSOLE_API_KEY;

  if (!expectedKey) {
    console.warn("[api-key] CONSOLE_API_KEY not set — API key auth disabled");
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing x-api-key header",
    });
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API key",
    });
  }

  next();
}
