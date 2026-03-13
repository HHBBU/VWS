import { db } from "@workspace/db";
import {
  moduleSettingsTable,
  moduleExtensionsTable,
  moduleSubmissionsTable,
  simulationRunsTable,
} from "@workspace/db/schema";
import { and, eq, max } from "drizzle-orm";

export type ModuleKey = "M1" | "M2" | "M3";

export async function getModuleWindowStatus(
  userId: number,
  moduleKey: ModuleKey,
): Promise<"Open" | "Closed"> {
  const now = new Date();

  const [extension] = await db
    .select()
    .from(moduleExtensionsTable)
    .where(
      and(
        eq(moduleExtensionsTable.userId, userId),
        eq(moduleExtensionsTable.moduleKey, moduleKey),
      ),
    )
    .limit(1);

  if (extension && extension.extendedEndAt > now) {
    return "Open";
  }

  const [settings] = await db
    .select()
    .from(moduleSettingsTable)
    .where(eq(moduleSettingsTable.moduleKey, moduleKey))
    .limit(1);

  if (!settings || !settings.isEnabled) return "Closed";

  if (settings.startAt <= now && now <= settings.endAt) {
    return "Open";
  }

  return "Closed";
}

export async function hasFinalSubmission(
  userId: number,
  moduleKey: ModuleKey,
): Promise<boolean> {
  const [sub] = await db
    .select()
    .from(moduleSubmissionsTable)
    .where(
      and(
        eq(moduleSubmissionsTable.userId, userId),
        eq(moduleSubmissionsTable.moduleKey, moduleKey),
      ),
    )
    .limit(1);

  return !!sub && !!sub.submittedAt;
}

export async function moduleIsUnlocked(
  userId: number,
  moduleKey: ModuleKey,
): Promise<boolean> {
  const window = await getModuleWindowStatus(userId, moduleKey);
  if (window === "Closed") return false;

  if (moduleKey === "M1") return true;
  if (moduleKey === "M2") return await hasFinalSubmission(userId, "M1");
  if (moduleKey === "M3") return await hasFinalSubmission(userId, "M2");

  return false;
}

export async function getModuleStatus(
  userId: number,
  moduleKey: ModuleKey,
): Promise<"Locked" | "Not started" | "In progress" | "Submitted"> {
  const unlocked = await moduleIsUnlocked(userId, moduleKey);
  if (!unlocked) return "Locked";

  const submitted = await hasFinalSubmission(userId, moduleKey);
  if (submitted) return "Submitted";

  const [runCount] = await db
    .select({ count: max(simulationRunsTable.runNumber) })
    .from(simulationRunsTable)
    .where(
      and(
        eq(simulationRunsTable.userId, userId),
        eq(simulationRunsTable.moduleKey, moduleKey),
      ),
    );

  if (runCount?.count && runCount.count > 0) return "In progress";
  return "Not started";
}

export async function getNextRunNumber(
  userId: number,
  moduleKey: ModuleKey,
): Promise<number> {
  const [result] = await db
    .select({ maxRun: max(simulationRunsTable.runNumber) })
    .from(simulationRunsTable)
    .where(
      and(
        eq(simulationRunsTable.userId, userId),
        eq(simulationRunsTable.moduleKey, moduleKey),
      ),
    );

  return (result?.maxRun ?? 0) + 1;
}

export async function getFinalSubmission(userId: number, moduleKey: ModuleKey) {
  const [sub] = await db
    .select()
    .from(moduleSubmissionsTable)
    .where(
      and(
        eq(moduleSubmissionsTable.userId, userId),
        eq(moduleSubmissionsTable.moduleKey, moduleKey),
      ),
    )
    .limit(1);

  return sub ?? null;
}
