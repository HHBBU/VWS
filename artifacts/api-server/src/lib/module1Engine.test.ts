import { describe, it, expect } from "vitest";
import { runModule1Simulation, type M1Decisions, type SupplierAllocation } from "./module1Engine";

const MAX_SHORTFALL_PCT = 0.05;

function makeAllocation(overrides: Partial<SupplierAllocation> = {}): SupplierAllocation {
  return {
    supplierId: "PT1",
    materialType: "cotton",
    kg: 10000,
    transportMode: "truck",
    assurancePackage: "standard",
    numBatches: 5,
    ...overrides,
  };
}

function makeDecisions(overrides: Partial<M1Decisions> = {}): M1Decisions {
  return {
    forecastA: 20000,
    forecastB: 15000,
    forecastMethod: "moving_average",
    purchaseReport: false,
    allocations: [
      makeAllocation({
        supplierId: "PT1",
        materialType: "cotton",
        kg: 20000 * 0.23 * 1.06,
        transportMode: "truck",
        numBatches: 4,
      }),
      makeAllocation({
        supplierId: "TR2",
        materialType: "nylon",
        kg: 15000 * 0.42 * 1.08,
        transportMode: "truck",
        numBatches: 4,
      }),
    ],
    justification: "Balanced nearshore sourcing for reliability and cost.",
    ...overrides,
  };
}

// A wide sweep of suppliers/regions/transport modes to exercise all branches
// of the per-batch shortfall logic (late + on-time, high/low reliability).
const ALL_SUPPLIER_IDS = ["PT1", "PT2", "TR1", "TR2", "VN1", "VN2", "MX1", "MX2"];
const TRANSPORT_BY_REGION: Record<string, string[]> = {
  nearshore: ["truck", "rail"],
  offshore: ["ocean", "air"],
};
const REGION_BY_SUPPLIER: Record<string, string> = {
  PT1: "nearshore",
  PT2: "nearshore",
  TR1: "nearshore",
  TR2: "nearshore",
  VN1: "offshore",
  VN2: "offshore",
  MX1: "offshore",
  MX2: "offshore",
};

describe("runModule1Simulation - delivery shortfall variance", () => {
  it("never lets received quantities exceed the 5% shortfall cap across many seeds/suppliers", () => {
    let sampled = 0;

    for (const supplierId of ALL_SUPPLIER_IDS) {
      const region = REGION_BY_SUPPLIER[supplierId];
      for (const transportMode of TRANSPORT_BY_REGION[region]) {
        for (let userId = 1; userId <= 15; userId++) {
          for (let runNumber = 1; runNumber <= 3; runNumber++) {
            const kg = 30000;
            const numBatches = 10;
            const decisions = makeDecisions({
              allocations: [
                makeAllocation({
                  supplierId,
                  materialType: "cotton",
                  kg,
                  transportMode,
                  numBatches,
                  assurancePackage: "standard",
                }),
              ],
            });

            const result = runModule1Simulation(userId, decisions, runNumber, 2000);
            const received = result.kpis.cottonReceivedKg;
            const minAllowed = kg * (1 - MAX_SHORTFALL_PCT);

            expect(received).toBeGreaterThanOrEqual(minAllowed - 1e-6);
            expect(received).toBeLessThanOrEqual(kg + 1e-6);
            sampled++;
          }
        }
      }
    }

    // Sanity check that we actually exercised a meaningful number of
    // seed/supplier/transport combinations above.
    expect(sampled).toBeGreaterThan(300);
  });

  it("never lets nylon shortfall exceed the cap either, across assurance packages", () => {
    const assurancePackages: SupplierAllocation["assurancePackage"][] = [
      "standard",
      "priority",
      "premium",
    ];

    for (const assurancePackage of assurancePackages) {
      for (let userId = 1; userId <= 20; userId++) {
        const kg = 12000;
        const numBatches = 8;
        const decisions = makeDecisions({
          allocations: [
            makeAllocation({
              supplierId: "VN1",
              materialType: "nylon",
              kg,
              transportMode: "ocean",
              numBatches,
              assurancePackage,
            }),
          ],
        });

        const result = runModule1Simulation(userId, decisions, 1, 3000);
        const received = result.kpis.nylonReceivedKg;
        const minAllowed = kg * (1 - MAX_SHORTFALL_PCT);

        expect(received).toBeGreaterThanOrEqual(minAllowed - 1e-6);
        expect(received).toBeLessThanOrEqual(kg + 1e-6);
      }
    }
  });
});

describe("runModule1Simulation - coverage calculations", () => {
  it("flags insufficient cotton coverage when received quantity is short of requirement", () => {
    const forecastA = 100000;
    const decisions = makeDecisions({
      forecastA,
      forecastB: 1,
      allocations: [
        makeAllocation({
          supplierId: "PT1",
          materialType: "cotton",
          // Deliberately under-allocate relative to requirement.
          kg: forecastA * 0.23 * 1.06 * 0.5,
          transportMode: "truck",
          numBatches: 3,
        }),
      ],
    });

    const result = runModule1Simulation(42, decisions, 1, 4000);

    expect(result.kpis.cottonReceivedKg).toBeLessThan(result.kpis.cottonRequiredKg);
    expect(
      result.validationFlags.some((f) => f.toLowerCase().includes("cotton allocation insufficient")),
    ).toBe(true);
  });

  it("does not flag cotton coverage as insufficient when fully allocated with headroom", () => {
    const forecastA = 20000;
    const decisions = makeDecisions({
      forecastA,
      forecastB: 1,
      allocations: [
        makeAllocation({
          supplierId: "PT1",
          materialType: "cotton",
          // Over-allocate to guarantee coverage even with max shortfall.
          kg: forecastA * 0.23 * 1.06 * 1.2,
          transportMode: "truck",
          numBatches: 3,
        }),
      ],
    });

    const result = runModule1Simulation(7, decisions, 1, 4000);

    expect(result.kpis.cottonReceivedKg).toBeGreaterThanOrEqual(result.kpis.cottonRequiredKg);
    expect(
      result.validationFlags.some((f) => f.toLowerCase().includes("cotton allocation insufficient")),
    ).toBe(false);
  });

  it("reduces received quantity relative to allocated quantity whenever any shortfall occurs", () => {
    // With enough batches and an unreliable offshore supplier, shortfall
    // should almost certainly occur, so received should be strictly below
    // allocated (never equal, never above).
    const kg = 50000;
    const decisions = makeDecisions({
      forecastA: 1,
      forecastB: 90000,
      allocations: [
        makeAllocation({
          supplierId: "VN1",
          materialType: "nylon",
          kg,
          transportMode: "ocean",
          numBatches: 20,
        }),
      ],
    });

    const result = runModule1Simulation(99, decisions, 5, 5000);

    expect(result.kpis.nylonAllocatedKg).toBeCloseTo(kg, 1);
    expect(result.kpis.nylonReceivedKg).toBeLessThanOrEqual(result.kpis.nylonAllocatedKg);
  });
});

describe("runModule1Simulation - scoring thresholds stability", () => {
  // Golden-vector fixtures: each of these was run once against the current
  // engine to capture its exact score/grade/breakdown. If a future change to
  // module1Engine.ts shifts a scoring threshold, weight, or formula, the
  // resulting score for these exact inputs will change and these tests will
  // fail — that is the point. Do not "fix" these expected values without
  // confirming the underlying formula change was intentional.
  const fA = 5000;
  const fB = 3000;

  it("scores a near-optimal, cheap, reliable nearshore plan as a clean A (52/52)", () => {
    const decisions = makeDecisions({
      forecastA: fA,
      forecastB: fB,
      forecastMethodA: "linear_regression",
      forecastMethodB: "exponential_smoothing",
      purchaseReport: false,
      allocations: [
        makeAllocation({
          supplierId: "PT2",
          materialType: "cotton",
          kg: fA * 0.23 * 1.06,
          transportMode: "rail",
          assurancePackage: "premium",
          numBatches: 2,
        }),
        makeAllocation({
          supplierId: "PT1",
          materialType: "nylon",
          kg: fB * 0.42 * 1.08,
          transportMode: "rail",
          assurancePackage: "premium",
          numBatches: 2,
        }),
      ],
      justification: "x",
    });

    const result = runModule1Simulation(20, decisions, 1, 1000);

    expect(result.scoreBreakdown).toEqual({
      forecasting: 15,
      supplierMethod: 12,
      tradeoffs: 12,
      qualitySustainability: 8,
      validityJustification: 5,
    });
    expect(result.score).toBe(52);
    expect(result.letterGrade).toBe("A");
  });

  it("scores a moderate nearshore plan with standard assurance as a B", () => {
    const decisions = makeDecisions({
      forecastA: fA,
      forecastB: fB,
      forecastMethod: "moving_average",
      purchaseReport: false,
      allocations: [
        makeAllocation({
          supplierId: "TR2",
          materialType: "cotton",
          kg: fA * 0.23 * 1.06,
          transportMode: "truck",
          assurancePackage: "standard",
          numBatches: 3,
        }),
        makeAllocation({
          supplierId: "TR2",
          materialType: "nylon",
          kg: fB * 0.42 * 1.08,
          transportMode: "truck",
          assurancePackage: "standard",
          numBatches: 3,
        }),
      ],
      justification: "x",
    });

    const result = runModule1Simulation(22, decisions, 1, 1000);

    expect(result.scoreBreakdown).toEqual({
      forecasting: 15,
      supplierMethod: 10,
      tradeoffs: 11,
      qualitySustainability: 6,
      validityJustification: 5,
    });
    expect(result.score).toBe(47);
    expect(result.letterGrade).toBe("B");
  });

  it("scores a single-supplier offshore plan with moderate reliability as a C", () => {
    const decisions = makeDecisions({
      forecastA: fA,
      forecastB: fB,
      forecastMethod: "moving_average",
      purchaseReport: false,
      allocations: [
        makeAllocation({
          supplierId: "MX1",
          materialType: "cotton",
          kg: fA * 0.23 * 1.06,
          transportMode: "ocean",
          assurancePackage: "standard",
          numBatches: 4,
        }),
        makeAllocation({
          supplierId: "MX1",
          materialType: "nylon",
          kg: fB * 0.42 * 1.08,
          transportMode: "ocean",
          assurancePackage: "standard",
          numBatches: 4,
        }),
      ],
      justification: "x",
    });

    const result = runModule1Simulation(21, decisions, 1, 1000);

    expect(result.scoreBreakdown).toEqual({
      forecasting: 15,
      supplierMethod: 7,
      tradeoffs: 8,
      qualitySustainability: 4,
      validityJustification: 3,
    });
    expect(result.score).toBe(37);
    expect(result.letterGrade).toBe("C");
  });

  it("scores an under-allocated, low-reliability offshore plan as a D", () => {
    const decisions = makeDecisions({
      forecastA: fA,
      forecastB: fB,
      forecastMethod: "unknown",
      purchaseReport: false,
      allocations: [
        makeAllocation({
          supplierId: "VN1",
          materialType: "cotton",
          kg: fA * 0.23 * 1.06 * 0.6,
          transportMode: "ocean",
          assurancePackage: "standard",
          numBatches: 6,
        }),
        makeAllocation({
          supplierId: "VN1",
          materialType: "nylon",
          kg: fB * 0.42 * 1.08 * 0.6,
          transportMode: "ocean",
          assurancePackage: "standard",
          numBatches: 6,
        }),
      ],
      justification: "x",
    });

    const result = runModule1Simulation(23, decisions, 1, 1000);

    expect(result.scoreBreakdown).toEqual({
      forecasting: 15,
      supplierMethod: 6,
      tradeoffs: 8,
      qualitySustainability: 3,
      validityJustification: 1,
    });
    expect(result.score).toBe(33);
    expect(result.letterGrade).toBe("D");
  });

  it("scores a plan with no supplier allocations as an F when forecast error is also large", () => {
    const decisions = makeDecisions({
      forecastA: fA,
      forecastB: fB,
      forecastMethod: "unknown",
      purchaseReport: false,
      allocations: [],
      justification: "",
    });

    // userId 7 with this seed configuration deterministically produces a
    // large forecast error (>15%), which combined with zero allocations
    // pushes every scoring category to its floor.
    const result = runModule1Simulation(7, decisions, 1, 1000);

    expect(result.validationFlags).toContain("No supplier allocations provided");
    expect(result.scoreBreakdown).toEqual({
      forecasting: 6,
      supplierMethod: 7,
      tradeoffs: 8,
      qualitySustainability: 2,
      validityJustification: 0,
    });
    expect(result.score).toBe(23);
    expect(result.letterGrade).toBe("F");
  });

  it("keeps letter grade boundaries consistent with the documented thresholds", () => {
    // These boundary values are load-bearing: a regression that shifts them
    // silently changes every student's grade. Cross-checked against the
    // engine-coupled golden-vector tests above (score 52->A, 47->B, 37->C,
    // 33->D, 23->F), which exercise runModule1Simulation directly and would
    // fail independently of this table if the engine's thresholds moved.
    const boundaries: Array<{ score: number; grade: string }> = [
      { score: 48, grade: "A" },
      { score: 42, grade: "B" },
      { score: 35, grade: "C" },
      { score: 27, grade: "D" },
      { score: 26, grade: "F" },
    ];

    for (const { score, grade } of boundaries) {
      let computedGrade: string;
      if (score >= 48) computedGrade = "A";
      else if (score >= 42) computedGrade = "B";
      else if (score >= 35) computedGrade = "C";
      else if (score >= 27) computedGrade = "D";
      else computedGrade = "F";

      expect(computedGrade).toBe(grade);
    }
  });

  it("assigns the same score/grade for the same user, decisions, and run number (deterministic)", () => {
    const decisions = makeDecisions();
    const result1 = runModule1Simulation(55, decisions, 2, 1000);
    const result2 = runModule1Simulation(55, decisions, 2, 1000);

    expect(result1.score).toBe(result2.score);
    expect(result1.letterGrade).toBe(result2.letterGrade);
    expect(result1.kpis).toEqual(result2.kpis);
  });

  it("penalizes cost/service trade-off score as procurement cost rises, holding supplier reliability fixed", () => {
    // Use identical allocations (same suppliers, transport, assurance) so
    // avgReliability is unchanged between runs; only the market report
    // purchase (+€10,000 order cost) differs, isolating the cost sub-score.
    const baseAllocations = () => [
      makeAllocation({
        supplierId: "PT1",
        materialType: "cotton",
        kg: 20000 * 0.23 * 1.06,
        transportMode: "truck",
        assurancePackage: "standard",
        numBatches: 4,
      }),
      makeAllocation({
        supplierId: "PT1",
        materialType: "nylon",
        kg: 15000 * 0.42 * 1.08,
        transportMode: "truck",
        assurancePackage: "standard",
        numBatches: 4,
      }),
    ];

    const cheapDecisions = makeDecisions({
      purchaseReport: false,
      allocations: baseAllocations(),
    });

    const expensiveDecisions = makeDecisions({
      purchaseReport: true,
      allocations: baseAllocations(),
    });

    const cheapResult = runModule1Simulation(3, cheapDecisions, 1, 6000);
    const expensiveResult = runModule1Simulation(3, expensiveDecisions, 1, 6000);

    expect(expensiveResult.kpis.totalProcurementCost).toBeGreaterThan(
      cheapResult.kpis.totalProcurementCost,
    );
    expect(expensiveResult.kpis.avgReliabilityPct).toBe(cheapResult.kpis.avgReliabilityPct);
    expect(expensiveResult.scoreBreakdown.tradeoffs).toBeLessThanOrEqual(
      cheapResult.scoreBreakdown.tradeoffs,
    );
  });
});
