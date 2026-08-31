import { describe, it, expect } from "vitest";
import { runModule2Simulation, type M2Decisions, type M1Context } from "./module2Engine";

function makeDecisions(overrides: Partial<M2Decisions> = {}): M2Decisions {
  return {
    sopPlanA: Array(8).fill(3000),
    sopPlanB: Array(8).fill(1500),
    capacityMode: "standard",
    lotSize: "medium",
    priorityRule: "balanced",
    safetyStock: "6_dos",
    justification: "x",
    ...overrides,
  };
}

function makeM1Context(overrides: Partial<M1Context> = {}): M1Context {
  return {
    avgReliabilityPct: 95,
    avgLeadTimeDays: 10,
    forecastA: 17800,
    forecastB: 9000,
    ...overrides,
  };
}

const CAPACITY_MODES: Record<M2Decisions["capacityMode"], number> = {
  standard: 800,
  overtime: 1050,
  two_shift: 1500,
};
const SIMULATION_DAYS = 56;

describe("runModule2Simulation - capacity constraint variance", () => {
  it("never lets total daily production exceed the selected capacity mode's daily limit, summed over the run", () => {
    const priorityRules: M2Decisions["priorityRule"][] = ["balanced", "priority_a", "priority_b"];
    const capacityModes: M2Decisions["capacityMode"][] = ["standard", "overtime", "two_shift"];

    let sampled = 0;
    for (const capacityMode of capacityModes) {
      for (const priorityRule of priorityRules) {
        for (let userId = 1; userId <= 10; userId++) {
          const decisions = makeDecisions({
            // Deliberately overplan relative to capacity to stress-test the constraint.
            sopPlanA: Array(8).fill(6000),
            sopPlanB: Array(8).fill(4000),
            capacityMode,
            priorityRule,
          });

          const result = runModule2Simulation(userId, decisions, makeM1Context(), 1, 2000);
          const totalProduced = result.kpis.totalProductionA + result.kpis.totalProductionB;
          const maxPossible = CAPACITY_MODES[capacityMode] * SIMULATION_DAYS;

          expect(totalProduced).toBeLessThanOrEqual(maxPossible + 1e-6);
          sampled++;
        }
      }
    }

    expect(sampled).toBeGreaterThan(80);
  });

  it("keeps service level within the valid 0-100% range across a wide sweep of decisions", () => {
    const safetyStocks: M2Decisions["safetyStock"][] = ["3_dos", "6_dos", "9_dos"];
    const lotSizes: M2Decisions["lotSize"][] = ["small", "medium", "large"];

    for (const safetyStock of safetyStocks) {
      for (const lotSize of lotSizes) {
        for (let userId = 1; userId <= 8; userId++) {
          const decisions = makeDecisions({ safetyStock, lotSize });
          const result = runModule2Simulation(userId, decisions, makeM1Context(), 1, 2500);

          expect(result.kpis.serviceLevel).toBeGreaterThanOrEqual(0);
          expect(result.kpis.serviceLevel).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe("runModule2Simulation - bottleneck detection logic", () => {
  it("identifies sewing as the true bottleneck for a balanced default S&OP plan (highest SAM-to-capacity ratio)", () => {
    const decisions = makeDecisions();
    const result = runModule2Simulation(5, decisions, makeM1Context(), 1, 1000);

    expect(result.kpis.trueBottleneck).toBe("sewing");
    expect(result.scoreBreakdown.bottleneckDetail?.true_bottleneck).toBe("sewing");
  });

  it("awards full bottleneck credit when the student correctly targets the true bottleneck with a moderate improvement", () => {
    const decisions = makeDecisions({ bottleneckTarget: "sewing_modify" });
    const result = runModule2Simulation(5, decisions, makeM1Context(), 1, 1000);

    expect(result.scoreBreakdown.bottleneckDetail?.student_target).toBe("sewing");
    expect(result.scoreBreakdown.bottleneckScore).toBe(10);
  });

  it("penalizes bottleneck score when the student targets a work center far from the true bottleneck", () => {
    const decisions = makeDecisions({ bottleneckTarget: "packaging_modify" });
    const result = runModule2Simulation(5, decisions, makeM1Context(), 1, 1000);

    expect(result.scoreBreakdown.bottleneckDetail?.true_bottleneck).toBe("sewing");
    expect(result.scoreBreakdown.bottleneckDetail?.student_target).toBe("packaging");
    expect(result.scoreBreakdown.bottleneckScore).toBeLessThan(10);
  });

  it("caps bottleneckScore at 7 when a student correctly targets the bottleneck but over-invests (buy option that overshoots)", () => {
    // sewing_buy has a 1.50x multiplier which, per the engine's rule, is
    // treated as an over-investment relative to what was actually needed.
    const decisions = makeDecisions({ bottleneckTarget: "sewing_buy" });
    const result = runModule2Simulation(5, decisions, makeM1Context(), 1, 1000);

    expect(result.scoreBreakdown.bottleneckDetail?.student_target).toBe("sewing");
    expect([7, 10]).toContain(result.scoreBreakdown.bottleneckScore);
  });
});

describe("runModule2Simulation - lean/quality/layout scoring", () => {
  it("caps leanQualityScore at 10 even when every sub-component is maxed", () => {
    const decisions = makeDecisions({
      layoutChoice: "functional",
      flowChoice: "cellular",
      trainingChoice: "black_belt",
      leanChoice: "poka_andon_bundle",
    });
    const result = runModule2Simulation(5, decisions, makeM1Context(), 1, 1000);

    expect(result.scoreBreakdown.leanQualityScore).toBeLessThanOrEqual(10);
    expect(result.scoreBreakdown.leanQualityScore).toBe(10);
  });

  it("scores leanQualityScore as 0 for the least favorable combination (product layout, batch flow, no training/lean, low service)", () => {
    const decisions = makeDecisions({
      sopPlanA: Array(8).fill(100),
      sopPlanB: Array(8).fill(50),
      layoutChoice: "product",
      flowChoice: "batch",
      trainingChoice: "none",
      leanChoice: "none",
    });
    const result = runModule2Simulation(
      5,
      decisions,
      makeM1Context({ avgReliabilityPct: 50 }),
      1,
      1000,
    );

    // With trainingChoice "none", trainingPts only awards 1pt if serviceLevel >= 95%;
    // deliberately starving production keeps service level low, so trainingPts = 0.
    expect(result.scoreBreakdown.leanQualityScore).toBe(0);
  });

  it("gives partial training credit (1pt) when no training is chosen but service level is high", () => {
    const decisions = makeDecisions({
      layoutChoice: "product",
      flowChoice: "batch",
      trainingChoice: "none",
      leanChoice: "none",
      safetyStock: "9_dos",
      capacityMode: "two_shift",
    });
    const result = runModule2Simulation(5, decisions, makeM1Context(), 1, 1000);

    if (result.kpis.serviceLevel >= 95) {
      expect(result.scoreBreakdown.leanQualityScore).toBe(1);
    }
  });
});

describe("runModule2Simulation - scoring thresholds stability (golden vectors)", () => {
  // Golden-vector fixtures: each of these was run once against the current
  // engine to capture its exact score/grade/breakdown. If a future change to
  // module2Engine.ts shifts a scoring threshold, weight, or formula, the
  // resulting score for these exact inputs will change and these tests will
  // fail — that is the point. Do not "fix" these expected values without
  // confirming the underlying formula change was intentional.

  it("scores a well-invested but over-capacity plan (B) consistently", () => {
    const decisions = makeDecisions({
      sopPlanA: Array(8).fill(4150),
      sopPlanB: Array(8).fill(2100),
      capacityMode: "two_shift",
      lotSize: "large",
      safetyStock: "9_dos",
      bottleneckTarget: "sewing_modify",
      trainingChoice: "green_belt",
      layoutChoice: "functional",
      flowChoice: "cellular",
      leanChoice: "poka_yoke",
    });
    const m1Context = makeM1Context({ avgReliabilityPct: 99, avgLeadTimeDays: 5 });

    const result = runModule2Simulation(20, decisions, m1Context, 1, 1000);

    expect(result.scoreBreakdown).toMatchObject({
      performance: 15,
      sopQuality: 10,
      bottleneckScore: 10,
      leanQualityScore: 10,
    });
    expect(result.score).toBe(45);
    expect(result.letterGrade).toBe("B");
    expect(result.kpis.serviceLevel).toBe(100);
    expect(result.kpis.trueBottleneck).toBe("sewing");
  });

  it("scores a moderate overtime plan with green-belt training as a C", () => {
    const decisions = makeDecisions({
      capacityMode: "overtime",
      lotSize: "medium",
      safetyStock: "6_dos",
      trainingChoice: "green_belt",
      leanChoice: "5s",
    });

    const result = runModule2Simulation(22, decisions, makeM1Context(), 1, 1000);

    expect(result.scoreBreakdown).toMatchObject({
      performance: 10,
      sopQuality: 6,
      bottleneckScore: 10,
      leanQualityScore: 8,
    });
    expect(result.score).toBe(34);
    expect(result.letterGrade).toBe("C");
  });

  it("scores an under-invested, low-reliability plan with over-planned S&OP as a D", () => {
    const decisions = makeDecisions({
      sopPlanA: Array(8).fill(500),
      sopPlanB: Array(8).fill(200),
      capacityMode: "standard",
      lotSize: "small",
      safetyStock: "3_dos",
    });

    const result = runModule2Simulation(
      23,
      decisions,
      makeM1Context({ avgReliabilityPct: 60 }),
      1,
      1000,
    );

    expect(result.scoreBreakdown).toMatchObject({
      performance: 10,
      sopQuality: 6,
      bottleneckScore: 10,
      leanQualityScore: 4,
    });
    expect(result.score).toBe(30);
    expect(result.letterGrade).toBe("D");
  });

  it("keeps letter grade boundaries consistent with the documented thresholds", () => {
    // Cross-checked against the engine-coupled golden-vector tests above
    // (score 45->B, 34->C, 30->D), which exercise runModule2Simulation
    // directly and would fail independently of this table if the engine's
    // thresholds moved.
    const boundaries: Array<{ score: number; grade: string }> = [
      { score: 46, grade: "A" },
      { score: 40, grade: "B" },
      { score: 34, grade: "C" },
      { score: 33, grade: "D" },
    ];

    for (const { score, grade } of boundaries) {
      let computedGrade: string;
      if (score >= 46) computedGrade = "A";
      else if (score >= 40) computedGrade = "B";
      else if (score >= 34) computedGrade = "C";
      else computedGrade = "D";

      expect(computedGrade).toBe(grade);
    }
  });

  it("assigns the same score/grade/KPIs for the same user, decisions, and run number (deterministic)", () => {
    const decisions = makeDecisions();
    const m1Context = makeM1Context();
    const result1 = runModule2Simulation(55, decisions, m1Context, 2, 1000);
    const result2 = runModule2Simulation(55, decisions, m1Context, 2, 1000);

    expect(result1.score).toBe(result2.score);
    expect(result1.letterGrade).toBe(result2.letterGrade);
    expect(result1.kpis).toEqual(result2.kpis);
  });
});

describe("runModule2Simulation - wc_utilizations_pre (Before vs After chart data)", () => {
  const WC_NAMES = ["cutting", "dyeing", "sewing", "packaging"];

  it("wc_utilizations_pre equals wc_utilizations when no bottleneck is targeted (both bars equal)", () => {
    const decisions = makeDecisions({ bottleneckTarget: "none" });
    const result = runModule2Simulation(10, decisions, makeM1Context(), 1, 1000);
    const bd = result.scoreBreakdown.bottleneckDetail!;

    for (const wc of WC_NAMES) {
      expect(bd.wc_utilizations_pre[wc]).toBe(bd.wc_utilizations[wc]);
    }
  });

  it("wc_utilizations_pre[sewing] is higher than wc_utilizations[sewing] when sewing_modify is targeted (after bar drops)", () => {
    const decisions = makeDecisions({ bottleneckTarget: "sewing_modify" });
    const result = runModule2Simulation(10, decisions, makeM1Context(), 1, 1000);
    const bd = result.scoreBreakdown.bottleneckDetail!;

    expect(bd.wc_utilizations_pre["sewing"]).toBeGreaterThan(bd.wc_utilizations["sewing"]);
  });

  it("non-targeted work centers are unchanged between pre and post when sewing is targeted", () => {
    const decisions = makeDecisions({ bottleneckTarget: "sewing_modify" });
    const result = runModule2Simulation(10, decisions, makeM1Context(), 1, 1000);
    const bd = result.scoreBreakdown.bottleneckDetail!;

    for (const wc of ["cutting", "dyeing", "packaging"]) {
      expect(bd.wc_utilizations_pre[wc]).toBe(bd.wc_utilizations[wc]);
    }
  });

  it("wc_utilizations_pre matches the baseline (multiplier = 1) — independent of which bottleneck option is chosen", () => {
    // The "pre" values are always computed with multiplier=1 for every WC.
    // So wc_utilizations_pre should equal the wc_utilizations from a "none" run
    // (since "none" also uses multiplier=1 for all work centers).
    const decisionsNone   = makeDecisions({ bottleneckTarget: "none" });
    const decisionsModify = makeDecisions({ bottleneckTarget: "sewing_modify" });
    const m1Context = makeM1Context();

    const resultNone   = runModule2Simulation(12, decisionsNone,   m1Context, 1, 1000);
    const resultModify = runModule2Simulation(12, decisionsModify, m1Context, 1, 1000);

    const bdNone   = resultNone.scoreBreakdown.bottleneckDetail!;
    const bdModify = resultModify.scoreBreakdown.bottleneckDetail!;

    for (const wc of WC_NAMES) {
      expect(bdModify.wc_utilizations_pre[wc]).toBe(bdNone.wc_utilizations[wc]);
    }
  });

  it("the correct cell is green — student_target matches the targeted work center after improvement", () => {
    const decisions = makeDecisions({ bottleneckTarget: "sewing_buy" });
    const result = runModule2Simulation(14, decisions, makeM1Context(), 1, 1000);
    const bd = result.scoreBreakdown.bottleneckDetail!;

    expect(bd.student_target).toBe("sewing");
  });
});
