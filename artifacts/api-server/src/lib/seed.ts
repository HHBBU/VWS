import { db } from "@workspace/db";
import { moduleSettingsTable, usersTable, configTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedData() {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const modules: Array<{
    moduleKey: "M1" | "M2" | "M3";
    title: string;
  }> = [
    { moduleKey: "M1", title: "Module 1: Global Sourcing & Procurement" },
    { moduleKey: "M2", title: "Module 2: Operations Planning & MRP" },
    { moduleKey: "M3", title: "Module 3: Distribution Network & Inventory" },
  ];

  for (const m of modules) {
    await db
      .insert(moduleSettingsTable)
      .values({
        moduleKey: m.moduleKey,
        title: m.title,
        startAt: now,
        endAt: thirtyDaysLater,
        isEnabled: true,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  const configDefaults = [
    { key: "seed_offset", value: "1000" },
    { key: "app_version", value: "2.0.0" },
    { key: "app_name", value: "Veloce Wear Simulation" },
    { key: "timezone", value: "America/New_York" },
  ];

  for (const c of configDefaults) {
    await db.insert(configTable).values(c).onConflictDoNothing();
  }

  const instructorEmail = process.env.INSTRUCTOR_EMAIL || "instructor@ggc.edu";
  const instructorPassword = process.env.INSTRUCTOR_PASSWORD || "instructor123";

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, instructorEmail))
    .limit(1);

  if (!existing) {
    const hash = await bcrypt.hash(instructorPassword, 10);
    await db
      .insert(usersTable)
      .values({
        name: "Instructor",
        email: instructorEmail,
        studentId: "INSTRUCTOR",
        role: "instructor",
        passwordHash: hash,
      })
      .onConflictDoNothing();
  }
}
