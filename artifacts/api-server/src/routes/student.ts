import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  moduleSettingsTable,
  simulationRunsTable,
  moduleSubmissionsTable,
} from "@workspace/db/schema";
import { and, eq, desc, asc, count } from "drizzle-orm";
import {
  getModuleWindowStatus,
  getModuleWindowInfo,
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
import { runModule2Simulation, type M2Decisions } from "../lib/module2Engine";
import { runModule3Simulation, type M3Decisions } from "../lib/module3Engine";
import { getHistoricalData } from "../lib/historicalData";

const ErrorResponseSchema = { parse: (v: any) => v };

function scoreToLetterGrade(score: number): string {
  if (score >= 50) return "A";
  if (score >= 44) return "B";
  if (score >= 38) return "C";
  if (score >= 30) return "D";
  return "F";
}

const router: IRouter = Router();

function requireStudent(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Not authenticated" }));
  }
  if (req.session.userRole !== "student") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Student access only" }));
  }
  return next();
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
      const windowInfo = await getModuleWindowInfo(userId, key);

      const practiceRuns = await db
        .select({ score: simulationRunsTable.score })
        .from(simulationRunsTable)
        .where(
          and(
            eq(simulationRunsTable.userId, userId),
            eq(simulationRunsTable.moduleKey, key),
            eq(simulationRunsTable.isFinal, false),
          ),
        )
        .orderBy(asc(simulationRunsTable.runNumber));

      return {
        key,
        title: settings?.title ?? `Module ${key.slice(1)}`,
        maxScore: 55,
        status,
        window,
        isUnlocked,
        score: submission?.score ?? null,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
        practiceRunCount: practiceRuns.length,
        practiceRunScores: practiceRuns.map((r) => r.score),
        windowStart: windowInfo.windowStart,
        windowEnd: windowInfo.windowEnd,
        windowEnabled: windowInfo.windowEnabled,
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
  if (!["M1", "M2", "M3"].includes(moduleKey as string)) {
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
  const windowInfo = await getModuleWindowInfo(userId, key);

  const runs = await db
    .select()
    .from(simulationRunsTable)
    .where(
      and(
        eq(simulationRunsTable.userId, userId),
        eq(simulationRunsTable.moduleKey, key),
      ),
    )
    .orderBy(asc(simulationRunsTable.runNumber));

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
        letterGrade: scoreToLetterGrade(r.score),
        isFinal: r.isFinal,
        createdAt: r.createdAt.toISOString(),
      })),
      practiceCount: practiceCountRow?.count ?? 0,
      windowStart: windowInfo.windowStart,
      windowEnd: windowInfo.windowEnd,
      windowEnabled: windowInfo.windowEnabled,
    }),
  );
});

// GET historical data for M1
router.get("/modules/M1/historical", requireStudent, async (_req: Request, res: Response) => {
  const data = getHistoricalData();
  return res.json(data);
});

// GET M1+M2 context data for M3 (forecasts, M2 service level, utilization)
router.get("/modules/M3/context", requireStudent, async (req: Request, res: Response) => {
  const userId = req.session.userId!;

  const [m1Sub] = await db
    .select()
    .from(moduleSubmissionsTable)
    .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M1")))
    .limit(1);

  const [m2Sub] = await db
    .select()
    .from(moduleSubmissionsTable)
    .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M2")))
    .limit(1);

  let m1Kpis: any = {};
  try { if (m1Sub?.submissionJson) m1Kpis = JSON.parse(m1Sub.submissionJson).kpis ?? {}; } catch {}

  let m2Kpis: any = {};
  try { if (m2Sub?.submissionJson) m2Kpis = JSON.parse(m2Sub.submissionJson).kpis ?? {}; } catch {}

  return res.json({
    hasM1Data: !!m1Sub,
    hasM2Data: !!m2Sub,
    forecastA:             m1Kpis.forecastA               ?? 17800,
    forecastB:             m1Kpis.forecastB               ?? 9000,
    m2ServiceLevel:        m2Kpis.serviceLevel            ?? 96,
    m2CapacityUtilization: m2Kpis.capacityUtilization     ?? 80,
  });
});

// GET M1 context data for M2 (reliability, lead time, forecasts)
router.get("/modules/M2/m1-context", requireStudent, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const [m1Sub] = await db
    .select()
    .from(moduleSubmissionsTable)
    .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M1")))
    .limit(1);

  if (!m1Sub?.submissionJson) {
    return res.json({
      hasM1Data: false,
      avgReliabilityPct: 95,
      avgLeadTimeDays: 8,
      forecastA: 17800,
      forecastB: 9000,
    });
  }

  let kpis: any = {};
  try {
    const parsed = JSON.parse(m1Sub.submissionJson);
    kpis = parsed.kpis ?? {};
  } catch {
    kpis = {};
  }

  return res.json({
    hasM1Data: true,
    avgReliabilityPct: kpis.avgReliabilityPct ?? 95,
    avgLeadTimeDays: kpis.avgLeadTimeDays ?? 8,
    forecastA: kpis.forecastA ?? 17800,
    forecastB: kpis.forecastB ?? 9000,
  });
});

// GET detailed run data for a specific run
router.get(
  "/modules/:moduleKey/runs/:runNumber",
  requireStudent,
  async (req: Request, res: Response) => {
    const { moduleKey, runNumber } = req.params;
    if (!["M1", "M2", "M3"].includes(moduleKey as string)) {
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
          eq(simulationRunsTable.runNumber, parseInt(runNumber as string, 10)),
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

function extractM2Decisions(body: any): M2Decisions {
  const safeInt = (v: any, def = 0) => {
    const n = parseInt(v, 10);
    return isNaN(n) ? def : Math.max(0, n);
  };
  const sopPlanA = Array.from({ length: 8 }, (_, i) => safeInt(body.sopPlanA?.[i] ?? body[`w${i + 1}_a`]));
  const sopPlanB = Array.from({ length: 8 }, (_, i) => safeInt(body.sopPlanB?.[i] ?? body[`w${i + 1}_b`]));
  const validCapacity = ["standard", "overtime", "two_shift"];
  const validLot      = ["small", "medium", "large"];
  const validPriority = ["balanced", "priority_a", "priority_b"];
  const validSS       = ["3_dos", "6_dos", "9_dos"];
  return {
    sopPlanA,
    sopPlanB,
    capacityMode: validCapacity.includes(body.capacityMode) ? body.capacityMode : "standard",
    lotSize:      validLot.includes(body.lotSize)           ? body.lotSize       : "medium",
    priorityRule: validPriority.includes(body.priorityRule) ? body.priorityRule  : "balanced",
    safetyStock:  validSS.includes(body.safetyStock)        ? body.safetyStock   : "6_dos",
    justification: (body.justification || "").trim(),
  };
}

function extractM3Decisions(body: any): M3Decisions {
  const validNetwork  = ["centralized", "hybrid", "decentralized"];
  const validService  = ["standard", "express", "mixed"];
  const validForecast = ["moving_average", "exponential_smoothing", "seasonal", "naive"];
  const safeInt = (v: any, def = 0) => { const n = parseInt(v, 10); return isNaN(n) ? def : Math.max(0, n); };
  return {
    networkStrategy: validNetwork.includes(body.networkStrategy)   ? body.networkStrategy : "hybrid",
    rop:             safeInt(body.rop,  4500),
    q:               safeInt(body.q,   9000),
    serviceMode:     validService.includes(body.serviceMode)        ? body.serviceMode     : "standard",
    forecastMethod:  validForecast.includes(body.forecastMethod)    ? body.forecastMethod  : "moving_average",
    justification:   (body.justification || "").trim(),
  };
}

function extractM1Decisions(body: any): M1Decisions {
  const allocations = (body.allocations || []).map((a: any) => ({
    supplierId: a.supplierId || a.supplier_id || "",
    materialType: a.materialType || a.material_type || "cotton",
    kg: parseFloat(a.kg) || 0,
    transportMode: a.transportMode || a.transport_mode || "truck",
    assurancePackage: a.assurancePackage || a.assurance_package || "standard",
    numBatches: Math.max(1, parseInt(a.numBatches || a.num_batches || "1", 10)),
  }));

  const legacyMethod = body.forecastMethod || body.forecast_method || "";
  const forecastMethodA = body.forecastMethodA || body.forecast_method_a || legacyMethod || "unknown";
  const forecastMethodB = body.forecastMethodB || body.forecast_method_b || legacyMethod || "unknown";
  return {
    forecastA: parseFloat(body.forecastA || body.forecast_A || "0") || 0,
    forecastB: parseFloat(body.forecastB || body.forecast_B || "0") || 0,
    forecastMethod: legacyMethod || forecastMethodA,
    forecastMethodA,
    forecastMethodB,
    purchaseReport: body.purchaseReport === true || body.purchase_report === true,
    allocations,
    justification: (body.justification || "").trim(),
  };
}

router.post("/modules/:moduleKey/practice", requireStudent, async (req: Request, res: Response) => {
  const { moduleKey } = req.params;
  if (!["M1", "M2", "M3"].includes(moduleKey as string)) {
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
  } else if (key === "M2") {
    const decisions = extractM2Decisions(req.body);
    const [m1Sub] = await db
      .select()
      .from(moduleSubmissionsTable)
      .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M1")))
      .limit(1);
    let m1Kpis: any = {};
    try { if (m1Sub?.submissionJson) m1Kpis = JSON.parse(m1Sub.submissionJson).kpis ?? {}; } catch {}
    const m1Context = {
      avgReliabilityPct: m1Kpis.avgReliabilityPct ?? 95,
      avgLeadTimeDays:   m1Kpis.avgLeadTimeDays   ?? 8,
      forecastA:         m1Kpis.forecastA          ?? 17800,
      forecastB:         m1Kpis.forecastB          ?? 9000,
    };
    const result = runModule2Simulation(userId, decisions, m1Context, runNumber);
    practiceScore = result.score;
    kpiData = result.kpis;
    decisionsData = decisions;
    extraResult = result;
  } else {
    const decisions = extractM3Decisions(req.body);
    const [m1Sub] = await db
      .select()
      .from(moduleSubmissionsTable)
      .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M1")))
      .limit(1);
    const [m2Sub] = await db
      .select()
      .from(moduleSubmissionsTable)
      .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M2")))
      .limit(1);
    let m1Kpis: any = {};
    try { if (m1Sub?.submissionJson) m1Kpis = JSON.parse(m1Sub.submissionJson).kpis ?? {}; } catch {}
    let m2Kpis: any = {};
    try { if (m2Sub?.submissionJson) m2Kpis = JSON.parse(m2Sub.submissionJson).kpis ?? {}; } catch {}
    const m3Context = {
      forecastA:             m1Kpis.forecastA          ?? 17800,
      forecastB:             m1Kpis.forecastB          ?? 9000,
      m2ServiceLevel:        m2Kpis.serviceLevel       ?? 96,
      m2CapacityUtilization: m2Kpis.capacityUtilization ?? 80,
    };
    const result = runModule3Simulation(userId, decisions, m3Context, runNumber);
    practiceScore = result.score;
    kpiData = result.kpis;
    decisionsData = decisions;
    extraResult = result;
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
  if (!["M1", "M2", "M3"].includes(moduleKey as string)) {
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
  } else if (key === "M2") {
    const decisions = extractM2Decisions(req.body);
    const [m1Sub] = await db
      .select()
      .from(moduleSubmissionsTable)
      .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M1")))
      .limit(1);
    let m1Kpis: any = {};
    try { if (m1Sub?.submissionJson) m1Kpis = JSON.parse(m1Sub.submissionJson).kpis ?? {}; } catch {}
    const m1Context = {
      avgReliabilityPct: m1Kpis.avgReliabilityPct ?? 95,
      avgLeadTimeDays:   m1Kpis.avgLeadTimeDays   ?? 8,
      forecastA:         m1Kpis.forecastA          ?? 17800,
      forecastB:         m1Kpis.forecastB          ?? 9000,
    };
    const result = runModule2Simulation(userId, decisions, m1Context, runNumber);
    finalScore = result.score;
    kpiData = result.kpis;
    decisionsData = decisions;
    extraResult = result;
  } else {
    const decisions = extractM3Decisions(req.body);
    const [m1Sub] = await db
      .select()
      .from(moduleSubmissionsTable)
      .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M1")))
      .limit(1);
    const [m2Sub] = await db
      .select()
      .from(moduleSubmissionsTable)
      .where(and(eq(moduleSubmissionsTable.userId, userId), eq(moduleSubmissionsTable.moduleKey, "M2")))
      .limit(1);
    let m1Kpis: any = {};
    try { if (m1Sub?.submissionJson) m1Kpis = JSON.parse(m1Sub.submissionJson).kpis ?? {}; } catch {}
    let m2Kpis: any = {};
    try { if (m2Sub?.submissionJson) m2Kpis = JSON.parse(m2Sub.submissionJson).kpis ?? {}; } catch {}
    const m3Context = {
      forecastA:             m1Kpis.forecastA          ?? 17800,
      forecastB:             m1Kpis.forecastB          ?? 9000,
      m2ServiceLevel:        m2Kpis.serviceLevel       ?? 96,
      m2CapacityUtilization: m2Kpis.capacityUtilization ?? 80,
    };
    const result = runModule3Simulation(userId, decisions, m3Context, runNumber);
    finalScore = result.score;
    kpiData = result.kpis;
    decisionsData = decisions;
    extraResult = result;
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
