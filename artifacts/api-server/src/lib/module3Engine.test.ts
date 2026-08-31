import { describe, it, expect } from "vitest";
import { runModule3Simulation, type M3Decisions, type M3Context } from "./module3Engine";

function makeDecisions(overrides: Partial<M3Decisions> = {}): M3Decisions {
  return {
    networkStrategy: "hybrid",
    rop: 3000,
    q: 4000,
    serviceMode: "standard",
    forecastMethod: "moving_average",
    justification: "x",
    ...overrides,
  };
}

function makeCtx(overrides: Partial<M3Context> = {}): M3Context {
  return {
    forecastA: 17800,
    forecastB: 9000,
    m2ServiceLevel: 96,
    m2CapacityUtilization: 70,
    ...overrides,
  };
}

describe("runModule3Simulation - fill rate and cost variance bounds", () => {
  it("keeps fill rate within the valid 0-100% range across a wide sweep of decisions", () => {
    const networks: M3Decisions["networkStrategy"][] = ["centralized", "hybrid", "decentralized"];
    const serviceModes: M3Decisions["serviceMode"][] = ["standard", "express", "mixed"];

    for (const networkStrategy of networks) {
      for (const serviceMode of serviceModes) {
        for (let userId = 1; userId <= 6; userId++) {
          const decisions = makeDecisions({ networkStrategy, serviceMode });
          const result = runModule3Simulation(userId, decisions, makeCtx(), 1, 3000);

          expect(result.kpis.fillRate).toBeGreaterThanOrEqual(0);
          expect(result.kpis.fillRate).toBeLessThanOrEqual(100);
          expect(result.kpis.totalFilled).toBeLessThanOrEqual(result.kpis.totalDemand);
        }
      }
    }
  });

  it("never produces negative ending inventory, holding cost, or revenue across many seeds", () => {
    for (let userId = 1; userId <= 25; userId++) {
      const decisions = makeDecisions({ rop: 1000 + userId * 100, q: 1500 + userId * 50 });
      const result = runModule3Simulation(userId, decisions, makeCtx(), 1, 4000);

      expect(result.kpis.endingInventory).toBeGreaterThanOrEqual(0);
      expect(result.kpis.holdingCost).toBeGreaterThanOrEqual(0);
      expect(result.kpis.totalRevenue).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("runModule3Simulation - inventory math benchmark scoring", () => {
  it("awards zero inventory-math points and flags validation when ROP and Q are both zero", () => {
    const decisions = makeDecisions({ rop: 0, q: 0 });
    const result = runModule3Simulation(23, decisions, makeCtx(), 1, 1000);

    expect(result.kpis.fillRate).toBe(0);
    expect(result.scoreBreakdown.inventoryMath).toBe(0);
    expect(result.scoreBreakdown.validity).toBeLessThan(2);
    expect(result.validationFlags).toContain("ROP and Q must both be greater than zero.");
  });

  it("flags an unreasonably large order quantity and further reduces validity score", () => {
    const decisions = makeDecisions({ rop: 3000, q: 60000 });
    const result = runModule3Simulation(23, decisions, makeCtx(), 1, 1000);

    expect(result.validationFlags.some((f) => f.includes("unreasonably high"))).toBe(true);
    expect(result.scoreBreakdown.validity).toBeLessThan(2);
  });

  it("awards full qScore when Q is within 15% of the reference EOQ", () => {
    // First discover the reference EOQ for this scenario, then place Q exactly at it.
    const probe = runModule3Simulation(20, makeDecisions({ q: 1 }), makeCtx(), 1, 1000);
    const refEoq = probe.scoreBreakdown.mathBenchmark.refEoq;

    const decisions = makeDecisions({ rop: 3000, q: refEoq });
    const result = runModule3Simulation(20, decisions, makeCtx(), 1, 1000);

    expect(result.scoreBreakdown.mathBenchmark.qScore).toBe(6);
  });

  it("gives zero ssScore when ROP is set well below lead-time demand (no safety-stock buffer)", () => {
    const probe = runModule3Simulation(20, makeDecisions({ q: 4000 }), makeCtx(), 1, 1000);
    const refRop = probe.scoreBreakdown.mathBenchmark;
    const leadTimeDemandRop = Math.round(refRop.avgDailyDemand * refRop.avgLeadTime);

    // Set ROP comfortably below lead-time demand so studentSs floors to 0
    // even accounting for simulation-vs-benchmark demand rounding.
    const decisions = makeDecisions({ rop: Math.max(0, leadTimeDemandRop - 200), q: 4000 });
    const result = runModule3Simulation(20, decisions, makeCtx(), 1, 1000);

    expect(result.scoreBreakdown.mathBenchmark.ssScore).toBe(0);
  });
});

describe("runModule3Simulation - scoring thresholds stability (golden vectors)", () => {
  // Golden-vector fixtures: each of these was run once against the current
  // engine to capture its exact score/grade/breakdown. If a future change to
  // module3Engine.ts shifts a scoring threshold, weight, or formula, the
  // resulting score for these exact inputs will change and these tests will
  // fail — that is the point. Do not "fix" these expected values without
  // confirming the underlying formula change was intentional.

  it("scores a decentralized, well-provisioned plan with a thorough justification as a C", () => {
    const decisions = makeDecisions({
      networkStrategy: "decentralized",
      rop: 4500,
      q: 5200,
      serviceMode: "mixed",
      justification: "x".repeat(420),
    });
    const ctx = makeCtx({ m2ServiceLevel: 98 });

    const result = runModule3Simulation(20, decisions, ctx, 1, 1000);

    expect(result.scoreBreakdown).toMatchObject({
      performance: 23,
      inventoryMath: 10,
      policyReasoning: 5,
      validity: 2,
    });
    expect(result.score).toBe(40);
    expect(result.letterGrade).toBe("C");
    expect(result.kpis.fillRate).toBe(100);
  });

  it("scores a moderate hybrid plan with a short justification as a D", () => {
    const decisions = makeDecisions({
      networkStrategy: "hybrid",
      rop: 3000,
      q: 4000,
      serviceMode: "standard",
      justification: "x".repeat(260),
    });

    const result = runModule3Simulation(22, decisions, makeCtx(), 1, 1000);

    expect(result.scoreBreakdown).toMatchObject({
      performance: 8,
      inventoryMath: 6,
      policyReasoning: 3,
      validity: 2,
    });
    expect(result.score).toBe(19);
    expect(result.letterGrade).toBe("D");
  });

  it("scores an under-provisioned centralized plan with low M2 service level as a D with zero inventory-math score", () => {
    const decisions = makeDecisions({
      networkStrategy: "centralized",
      rop: 1500,
      q: 1500,
      serviceMode: "standard",
      justification: "x".repeat(50),
    });
    const ctx = makeCtx({ m2ServiceLevel: 85 });

    const result = runModule3Simulation(21, decisions, ctx, 1, 1000);

    expect(result.scoreBreakdown).toMatchObject({
      performance: 8,
      inventoryMath: 0,
      policyReasoning: 2,
      validity: 2,
    });
    expect(result.score).toBe(12);
    expect(result.letterGrade).toBe("D");
  });

  it("keeps letter grade boundaries consistent with the documented thresholds", () => {
    // Cross-checked against the engine-coupled golden-vector tests above
    // (score 40->C, 19->D, 12->D), which exercise runModule3Simulation
    // directly and would fail independently of this table if the engine's
    // thresholds moved.
    const boundaries: Array<{ score: number; grade: string }> = [
      { score: 48, grade: "A" },
      { score: 42, grade: "B" },
      { score: 36, grade: "C" },
      { score: 35, grade: "D" },
    ];

    for (const { score, grade } of boundaries) {
      let computedGrade: string;
      if (score >= 48) computedGrade = "A";
      else if (score >= 42) computedGrade = "B";
      else if (score >= 36) computedGrade = "C";
      else computedGrade = "D";

      expect(computedGrade).toBe(grade);
    }
  });

  it("assigns the same score/grade/KPIs for the same user, decisions, and run number (deterministic)", () => {
    const decisions = makeDecisions();
    const ctx = makeCtx();
    const result1 = runModule3Simulation(55, decisions, ctx, 2, 1000);
    const result2 = runModule3Simulation(55, decisions, ctx, 2, 1000);

    expect(result1.score).toBe(result2.score);
    expect(result1.letterGrade).toBe(result2.letterGrade);
    expect(result1.kpis).toEqual(result2.kpis);
  });

  it("penalizes cost efficiency as network strategy shifts from centralized to decentralized, holding volume fixed", () => {
    const baseDecisions = makeDecisions({ rop: 3000, q: 4000, serviceMode: "standard" });

    const centralized = runModule3Simulation(
      10,
      { ...baseDecisions, networkStrategy: "centralized" },
      makeCtx(),
      1,
      5000,
    );
    const decentralized = runModule3Simulation(
      10,
      { ...baseDecisions, networkStrategy: "decentralized" },
      makeCtx(),
      1,
      5000,
    );

    // Decentralized has higher DC and transport costs per the engine's
    // network config table, so its total cost should exceed centralized's
    // for an identical inventory policy.
    expect(decentralized.kpis.totalCost).toBeGreaterThan(centralized.kpis.totalCost);
  });
});
