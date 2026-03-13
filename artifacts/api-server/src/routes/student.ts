import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  moduleSettingsTable,
  simulationRunsTable,
  moduleSubmissionsTable,
} from "@workspace/db/schema";
import { and, eq, desc, count } from "drizzle-orm";
import {
  getModuleWindowStatus,
  moduleIsUnlocked,
  getModuleStatus,
  hasFinalSubmission,
  getNextRunNumber,
  getFinalSubmission,
  type ModuleKey,
} from "../lib/helpers";
import {
  GetStudentDashboardResponse as DashboardDataSchema,
  GetModuleDataResponse as ModuleDataSchema,
  RunPracticeResponse as RunResultSchema,
} from "@workspace/api-zod";
import { runModule1Simulation, type M1Decisions } from "../lib/module1Engine";
import { getHistoricalData } from "../lib/historicalData";

const ErrorResponseSchema = { parse: (v: any) => v };

const router: IRouter = Router();

function requireStudent(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Not authenticated" }));
  }
  if (req.session.userRole !== "student") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Student access only" }));
  }
  next();
}

router.get("/dashboard", requireStudent, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const moduleKeys: ModuleKey[] = ["M1", "M2", "M3"];

  const modules = await Promise.all(
    moduleKeys.map(async (key) => {
      const [settings] = await db
        .select()
        .from(moduleSettingsTable)
        .where(eq(moduleSettingsTable.moduleKey, key))
        .limit(1);

      const submission = await getFinalSubmission(userId, key);
      const status = await getModuleStatus(userId, key);
      const window = await getModuleWindowStatus(userId, key);
      const isUnlocked = await moduleIsUnlocked(userId, key);

      const [practiceRunRow] = await db
        .select({ count: count() })
        .from(simulationRunsTable)
        .where(
          and(
            eq(simulationRunsTable.userId, userId),
            eq(simulationRunsTable.moduleKey, key),
            eq(simulationRunsTable.isFinal, false),
          ),
        );

      return {
        key,
        title: settings?.title ?? `Module ${key.slice(1)}`,
        maxScore: 55,
        status,
        window,
        isUnlocked,
        score: submission?.score ?? null,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
        practiceRunCount: practiceRunRow?.count ?? 0,
      };
    }),
  );

  const totalScore = modules.reduce((sum, m) => sum + (m.score ?? 0), 0);

  const [totalPracticeRow] = await db
    .select({ count: count() })
    .from(simulationRunsTable)
    .where(
      and(
        eq(simulationRunsTable.userId, userId),
        eq(simulationRunsTable.isFinal, false),
      ),
    );

  return res.json(
    DashboardDataSchema.parse({
      modules,
      totalScore,
      maxTotal: 165,
      totalPracticeRuns: totalPracticeRow?.count ?? 0,
      userName: req.session.userName ?? "Student",
    }),
  );
});

router.get("/modules/:moduleKey", requireStudent, async (req: Request, res: Response) => {
  const { moduleKey } = req.params;
  if (!["M1", "M2", "M3"].includes(moduleKey)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid module" }));
  }

  const userId = req.session.userId!;
  const key = moduleKey as ModuleKey;

  const isUnlocked = await moduleIsUnlocked(userId, key);

  if (!isUnlocked) {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Module is locked" }));
  }

  const finalSubmission = await getFinalSubmission(userId, key);
  const isSubmitted = !!finalSubmission?.submittedAt;

  const runs = await db
    .select()
    .from(simulationRunsTable)
    .where(
      and(
        eq(simulationRunsTable.userId, userId),
        eq(simulationRunsTable.moduleKey, key),
      ),
    )
    .orderBy(desc(simulationRunsTable.runNumber))
    .limit(10);

  const [practiceCountRow] = await db
    .select({ count: count() })
    .from(simulationRunsTable)
    .where(
      and(
        eq(simulationRunsTable.userId, userId),
        eq(simulationRunsTable.moduleKey, key),
        eq(simulationRunsTable.isFinal, false),
      ),
    );

  return res.json(
    ModuleDataSchema.parse({
      moduleKey: key,
      isSubmitted,
      isUnlocked: true,
      finalSubmission: finalSubmission?.submittedAt
        ? {
            score: finalSubmission.score,
            maxScore: finalSubmission.maxScore,
            submittedAt: finalSubmission.submittedAt.toISOString(),
          }
        : null,
      recentRuns: runs.map((r) => ({
        runNumber: r.runNumber,
        score: r.score,
        isFinal: r.isFinal,
        createdAt: r.createdAt.toISOString(),
      })),
      practiceCount: practiceCountRow?.count ?? 0,
    }),
  );
});

// GET historical data for M1
router.get("/modules/M1/historical", requireStudent, async (_req: Request, res: Response) => {
  const data = getHistoricalData();
  return res.json(data);
});

// GET detailed run data for a specific run
router.get(
  "/modules/:moduleKey/runs/:runNumber",
  requireStudent,
  async (req: Request, res: Response) => {
    const { moduleKey, runNumber } = req.params;
    if (!["M1", "M2", "M3"].includes(moduleKey)) {
      return res.status(400).json({ error: "Invalid module" });
    }

    const userId = req.session.userId!;
    const key = moduleKey as ModuleKey;

    const [run] = await db
      .select()
      .from(simulationRunsTable)
      .where(
        and(
          eq(simulationRunsTable.userId, userId),
          eq(simulationRunsTable.moduleKey, key),
          eq(simulationRunsTable.runNumber, parseInt(runNumber, 10)),
        ),
      )
      .limit(1);

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    return res.json({
      runNumber: run.runNumber,
      score: run.score,
      isFinal: run.isFinal,
      createdAt: run.createdAt.toISOString(),
      decisions: JSON.parse(run.decisionsJson || "{}"),
      kpis: JSON.parse(run.kpiJson || "{}"),
    });
  },
);

function extractM1Decisions(body: any): M1Decisions {
  const allocations = (body.allocations || []).map((a: any) => ({
    supplierId: a.supplierId || a.supplier_id || "",
    materialType: a.materialType || a.material_type || "cotton",
    kg: parseFloat(a.kg) || 0,
    transportMode: a.transportMode || a.transport_mode || "truck",
    assurancePackage: a.assurancePackage || a.assurance_package || "standard",
    numBatches: Math.max(1, parseInt(a.numBatches || a.num_batches || "1", 10)),
  }));

  return {
    forecastA: parseFloat(body.forecastA || body.forecast_A || "0") || 0,
    forecastB: parseFloat(body.forecastB || body.forecast_B || "0") || 0,
    forecastMethod: body.forecastMethod || body.forecast_method || "unknown",
    purchaseReport: body.purchaseReport === true || body.purchase_report === true,
    allocations,
    justification: (body.justification || "").trim(),
  };
}

router.post("/modules/:moduleKey/practice", requireStudent, async (req: Request, res: Response) => {
  const { moduleKey } = req.params;
  if (!["M1", "M2", "M3"].includes(moduleKey)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid module" }));
  }

  const userId = req.session.userId!;
  const key = moduleKey as ModuleKey;

  const isUnlocked = await moduleIsUnlocked(userId, key);
  if (!isUnlocked) {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Module is locked" }));
  }

  const alreadySubmitted = await hasFinalSubmission(userId, key);
  if (alreadySubmitted) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Module already submitted" }));
  }

  const runNumber = await getNextRunNumber(userId, key);

  let practiceScore: number;
  let kpiData: any = {};
  let decisionsData: any = {};
  let extraResult: any = {};

  if (key === "M1") {
    const decisions = extractM1Decisions(req.body);
    const result = runModule1Simulation(userId, decisions, runNumber);
    practiceScore = result.score;
    kpiData = result.kpis;
    decisionsData = decisions;
    extraResult = result;
  } else {
    practiceScore = Math.floor(Math.random() * 55);
    decisionsData = { placeholder: "practice" };
    kpiData = { score: practiceScore };
  }

  await db.insert(simulationRunsTable).values({
    userId,
    moduleKey: key,
    runNumber,
    decisionsJson: JSON.stringify(decisionsData),
    kpiJson: JSON.stringify(kpiData),
    score: practiceScore,
    isFinal: false,
  });

  const baseResult = RunResultSchema.parse({
    runNumber,
    score: practiceScore,
    isFinal: false,
    message: `Practice run #${runNumber} completed with score ${practiceScore}/55`,
  });

  return res.json({ ...baseResult, ...extraResult });
});

router.post("/modules/:moduleKey/submit", requireStudent, async (req: Request, res: Response) => {
  const { moduleKey } = req.params;
  if (!["M1", "M2", "M3"].includes(moduleKey)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid module" }));
  }

  const userId = req.session.userId!;
  const key = moduleKey as ModuleKey;

  const isUnlocked = await moduleIsUnlocked(userId, key);
  if (!isUnlocked) {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Module is locked" }));
  }

  const alreadySubmitted = await hasFinalSubmission(userId, key);
  if (alreadySubmitted) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Module already submitted" }));
  }

  const runNumber = await getNextRunNumber(userId, key);
  const now = new Date();

  let finalScore: number;
  let kpiData: any = {};
  let decisionsData: any = {};
  let extraResult: any = {};

  if (key === "M1") {
    const decisions = extractM1Decisions(req.body);
    const result = runModule1Simulation(userId, decisions, runNumber);
    finalScore = result.score;
    kpiData = result.kpis;
    decisionsData = decisions;
    extraResult = result;
  } else {
    finalScore = Math.floor(Math.random() * 55);
    decisionsData = { placeholder: "final" };
    kpiData = { score: finalScore };
  }

  const [run] = await db
    .insert(simulationRunsTable)
    .values({
      userId,
      moduleKey: key,
      runNumber,
      decisionsJson: JSON.stringify(decisionsData),
      kpiJson: JSON.stringify(kpiData),
      score: finalScore,
      isFinal: true,
    })
    .returning();

  const submissionJson = JSON.stringify({
    runId: run.id,
    scoreBreakdown: extraResult.scoreBreakdown ?? {},
    feedback: extraResult.feedback ?? [],
    kpis: kpiData,
    decisions: decisionsData,
    letterGrade: extraResult.letterGrade ?? "",
    validationFlags: extraResult.validationFlags ?? [],
  });

  await db
    .insert(moduleSubmissionsTable)
    .values({
      userId,
      moduleKey: key,
      score: finalScore,
      maxScore: 55,
      submittedAt: now,
      submissionJson,
    })
    .onConflictDoUpdate({
      target: [moduleSubmissionsTable.userId, moduleSubmissionsTable.moduleKey],
      set: {
        score: finalScore,
        submittedAt: now,
        submissionJson,
      },
    });

  const baseResult = RunResultSchema.parse({
    runNumber,
    score: finalScore,
    isFinal: true,
    message: `${key} submitted successfully with score ${finalScore}/55!`,
  });

  return res.json({ ...baseResult, ...extraResult });
});

export default router;
