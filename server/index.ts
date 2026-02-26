import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { db } from "./db/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Register all API routes (before static files)
registerRoutes(app, db);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  const publicDir = path.resolve(__dirname, "public");
  app.use(express.static(publicDir));

  // SPA catch-all — MUST be after all API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] ConsoleBlue running on port ${PORT}`);
  console.log(
    `[server] Environment: ${process.env.NODE_ENV || "development"}`,
  );
});

export default app;
