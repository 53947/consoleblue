import { db } from "./index";
import { projects } from "../../shared/schema";
import { SEED_PROJECTS } from "./seed";
import { eq } from "drizzle-orm";

async function runSeed() {
  console.log("[seed] Starting...");

  for (const project of SEED_PROJECTS) {
    const existing = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, project.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed] Skipping "${project.slug}" — already exists`);
      continue;
    }

    await db.insert(projects).values(project);
    console.log(`[seed] Created "${project.slug}"`);
  }

  console.log("[seed] Done.");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
