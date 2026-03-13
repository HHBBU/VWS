/**
 * Module 2 Simulation Engine — Operations Planning & MRP
 * Veloce Wear SCM Simulation
 * Ported from Python/Flask v2 spec (Opus 4.6 Review) to TypeScript/Express
 *
 * FIXES FROM SPEC:
 *   [CRITICAL-1] Daily capacity rescaled: Standard=800, Overtime=1050, Two-Shift=1500 units/day
 *   [CRITICAL-3] S&OP quality scored vs expected baseline, NOT stochastic demand
 */

// ============================================================
// PRNG utilities (same as Module 1 — deterministic seeding)
// ============================================================

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stableHash(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

function boxMullerNormal(rand: () => number, mean: number, sigma: number): number {
  const u1 = Math.max(1e-10, rand());
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sigma * z;
}

// ============================================================
// CONSTANTS — v2 FIXED CAPACITY VALUES
// ============================================================

const CAPACITY_MODES = {
  standard:  { dailyCapacity: 800,  dailyCost: 480 },
  overtime:  { dailyCapacity: 1050, dailyCost: 680 },
  two_shift: { dailyCapacity: 1500, dailyCost: 990 },
} as const;

const LOT_SIZING = {
  small:  { changeoversPer: 14, lossRate: 0.08 },
  medium: { changeoversPer: 7,  lossRate: 0.04 },
  large:  { changeoversPer: 3,  lossRate: 0.02 },
} as const;

const SAFETY_STOCK_DOS = { "3_dos": 3, "6_dos": 6, "9_dos": 9 } as const;

const CHANGEOVER_COST       = 800;
const HOLDING_COST_PER_UNIT = 0.15;
const STOCKOUT_PENALTY      = 5.00;
const MARKDOWN_COST         = 12.00;
const SIMULATION_DAYS       = 56;

const TARGET_COSTS = {
  standard:  65000,
  overtime:  80000,
  two_shift: 100000,
} as const;

// ============================================================
// TYPES
// ============================================================

export interface M2Decisions {
  sopPlanA: number[];   // 8 weekly production targets for SKU A
  sopPlanB: number[];   // 8 weekly production targets for SKU B
  capacityMode: "standard" | "overtime" | "two_shift";
  lotSize: "small" | "medium" | "large";
  priorityRule: "balanced" | "priority_a" | "priority_b";
  safetyStock: "3_dos" | "6_dos" | "9_dos";
  justification: string;
}

export interface M1Context {
  avgReliabilityPct: number;   // e.g. 96.5
  avgLeadTimeDays: number;     // e.g. 5.6
  forecastA: number;           // e.g. 18500
  forecastB: number;           // e.g. 9200
}

export interface M2SimulationResult {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: {
    performance: number;
    sopQuality: number;
    mrpLogic: number;
    justification: number;
    validity: number;
  };
  kpis: {
    serviceLevel: number;
    totalCost: number;
    capacityCost: number;
    holdingCost: number;
    changeoverCost: number;
    stockoutCost: number;
    markdownCost: number;
    capacityUtilization: number;
    totalProductionA: number;
    totalProductionB: number;
    totalStockoutsA: number;
    totalStockoutsB: number;
    endingInventoryA: number;
    endingInventoryB: number;
    weeklyCapacity: number;
  };
  validationFlags: string[];
  feedback: string[];
}

// ============================================================
// SIMULATION ENGINE
// ============================================================

export function runModule2Simulation(
  userId: number,
  decisions: M2Decisions,
  m1Context: M1Context,
  runNumber: number,
  seedOffsetBase: number = 1000,
): M2SimulationResult {
  // ── Deterministic seed (same pattern as M1 engine) ──
  const seed = ((stableHash(String(userId)) + seedOffsetBase + 200 + runNumber) >>> 0);
  const rand = mulberry32(seed);

  // ── Extract decisions (with safe fallbacks) ──
  const sopPlanA = decisions.sopPlanA.map((v) => Math.max(0, Math.floor(v || 0)));
  const sopPlanB = decisions.sopPlanB.map((v) => Math.max(0, Math.floor(v || 0)));

  const capacityMode = CAPACITY_MODES[decisions.capacityMode] ? decisions.capacityMode : "standard";
  const lotSizeKey   = LOT_SIZING[decisions.lotSize]           ? decisions.lotSize       : "medium";
  const priorityRule = ["balanced","priority_a","priority_b"].includes(decisions.priorityRule)
    ? decisions.priorityRule : "balanced";
  const ssKey        = SAFETY_STOCK_DOS[decisions.safetyStock] !== undefined
    ? decisions.safetyStock : "6_dos";

  const justification = decisions.justification || "";

  // ── M1 context (with safe defaults) ──
  const reliabilityRate = Math.max(0.5, Math.min(1.0, (m1Context.avgReliabilityPct ?? 95) / 100));
  const forecastA       = Math.max(5000, m1Context.forecastA  ?? 17800);
  const forecastB       = Math.max(2000, m1Context.forecastB  ?? 9000);

  // ── Capacity & lot sizing config ──
  const { dailyCapacity, dailyCost }   = CAPACITY_MODES[capacityMode];
  const { changeoversPer, lossRate }   = LOT_SIZING[lotSizeKey];
  const safetyStockDos                 = SAFETY_STOCK_DOS[ssKey];

  // ── Convert S&OP weekly plan to daily targets ──
  const dailyTargetsA: number[] = [];
  const dailyTargetsB: number[] = [];
  for (let w = 0; w < 8; w++) {
    for (let d = 0; d < 7; d++) {
      dailyTargetsA.push(sopPlanA[w] / 7);
      dailyTargetsB.push(sopPlanB[w] / 7);
    }
  }

  // ── Generate stochastic demand (deterministic PRNG) ──
  const baselineA = forecastA / 30;
  const baselineB = forecastB / 30;

  const dailyDemandA: number[] = [];
  const dailyDemandB: number[] = [];
  for (let i = 0; i < SIMULATION_DAYS; i++) {
    const noiseA = boxMullerNormal(rand, 0, 0.15 * baselineA);
    const noiseB = boxMullerNormal(rand, 0, 0.10 * baselineB);
    dailyDemandA.push(Math.max(0, Math.floor(baselineA + noiseA)));
    dailyDemandB.push(Math.max(0, Math.floor(baselineB + noiseB)));
  }

  // ── Safety stock & initial inventory ──
  const avgDailyA = dailyDemandA.reduce((s, x) => s + x, 0) / SIMULATION_DAYS;
  const avgDailyB = dailyDemandB.reduce((s, x) => s + x, 0) / SIMULATION_DAYS;
  const ssA = Math.floor(avgDailyA * safetyStockDos);
  const ssB = Math.floor(avgDailyB * safetyStockDos);

  let inventoryA = ssA;
  let inventoryB = ssB;

  // ── Run 56-day simulation ──
  let totalProductionA = 0, totalProductionB = 0;
  let totalDemandA = 0,     totalDemandB = 0;
  let totalStockoutsA = 0,  totalStockoutsB = 0;
  let totalHoldingCost = 0, totalCapacityCost = 0;

  for (let day = 0; day < SIMULATION_DAYS; day++) {
    let plannedA = Math.floor(dailyTargetsA[day]);
    let plannedB = Math.floor(dailyTargetsB[day]);

    // Material disruption from M1 supplier reliability
    if (rand() > reliabilityRate) {
      plannedA = Math.floor(plannedA * 0.5);
      plannedB = Math.floor(plannedB * 0.5);
    }

    // Capacity constraint
    const totalPlanned = plannedA + plannedB;
    let actualA: number, actualB: number;

    if (totalPlanned > dailyCapacity) {
      if (priorityRule === "priority_a") {
        actualA = Math.min(plannedA, dailyCapacity);
        actualB = Math.min(plannedB, Math.max(0, dailyCapacity - actualA));
      } else if (priorityRule === "priority_b") {
        actualB = Math.min(plannedB, dailyCapacity);
        actualA = Math.min(plannedA, Math.max(0, dailyCapacity - actualB));
      } else {
        const scale = dailyCapacity / totalPlanned;
        actualA = Math.floor(plannedA * scale);
        actualB = Math.floor(plannedB * scale);
      }
    } else {
      actualA = plannedA;
      actualB = plannedB;
    }

    // Lot sizing loss
    actualA = Math.floor(actualA * (1 - lossRate));
    actualB = Math.floor(actualB * (1 - lossRate));

    totalProductionA += actualA;
    totalProductionB += actualB;

    inventoryA += actualA;
    inventoryB += actualB;

    // Meet demand
    const demandA = dailyDemandA[day];
    const demandB = dailyDemandB[day];
    totalDemandA += demandA;
    totalDemandB += demandB;

    if (inventoryA >= demandA) {
      inventoryA -= demandA;
    } else {
      totalStockoutsA += demandA - inventoryA;
      inventoryA = 0;
    }
    if (inventoryB >= demandB) {
      inventoryB -= demandB;
    } else {
      totalStockoutsB += demandB - inventoryB;
      inventoryB = 0;
    }

    totalHoldingCost  += (inventoryA + inventoryB) * HOLDING_COST_PER_UNIT;
    totalCapacityCost += dailyCost;
  }

  // ── Post-simulation cost calculations ──
  const totalChangeoverCost = changeoversPer * 8 * CHANGEOVER_COST;
  const totalStockoutCost   = (totalStockoutsA + totalStockoutsB) * STOCKOUT_PENALTY;

  const endingInventory = inventoryA + inventoryB;
  const targetEnding    = ssA + ssB;
  const excessInventory = Math.max(0, endingInventory - targetEnding);
  const markdownCost    = excessInventory * MARKDOWN_COST;

  const totalCost = totalCapacityCost + totalHoldingCost + totalChangeoverCost + totalStockoutCost + markdownCost;

  const totalDemand     = totalDemandA + totalDemandB;
  const totalStockouts  = totalStockoutsA + totalStockoutsB;
  const serviceLevel    = totalDemand > 0 ? ((totalDemand - totalStockouts) / totalDemand) * 100 : 0;

  const totalProduction = totalProductionA + totalProductionB;
  const totalCap        = dailyCapacity * SIMULATION_DAYS;
  const capacityUtil    = totalCap > 0 ? (totalProduction / totalCap) * 100 : 0;

  // ── Grading — 55 points ──

  // Performance: Service (15) + Cost (15) = 30
  let servicePoints: number;
  if      (serviceLevel >= 98) servicePoints = 15;
  else if (serviceLevel >= 95) servicePoints = 13;
  else if (serviceLevel >= 92) servicePoints = 11;
  else                          servicePoints = 8;

  const targetCost  = TARGET_COSTS[capacityMode];
  const costRatio   = targetCost > 0 ? totalCost / targetCost : 1;
  let costPoints: number;
  if      (costRatio <= 1.05) costPoints = 15;
  else if (costRatio <= 1.10) costPoints = 13;
  else if (costRatio <= 1.15) costPoints = 11;
  else                         costPoints = 8;

  const performanceScore = servicePoints + costPoints;

  // S&OP Quality (10): compare total plan vs expected baseline demand [CRITICAL-3 fix]
  const totalSopPlanned  = sopPlanA.reduce((s, x) => s + x, 0) + sopPlanB.reduce((s, x) => s + x, 0);
  const expectedDemand   = (baselineA + baselineB) * SIMULATION_DAYS;
  const sopRatio         = expectedDemand > 0 ? totalSopPlanned / expectedDemand : 0;
  let sopScore: number;
  if      (sopRatio >= 0.95 && sopRatio <= 1.05) sopScore = 10;
  else if (sopRatio >= 0.90 && sopRatio <= 1.10) sopScore = 8;
  else                                            sopScore = 6;

  // MRP Logic (8): capacity utilization sweet spot
  let mrpScore: number;
  if      (capacityUtil >= 80 && capacityUtil <= 95)  mrpScore = 8;
  else if ((capacityUtil >= 70 && capacityUtil < 80) || (capacityUtil > 95 && capacityUtil <= 100)) mrpScore = 6;
  else                                                  mrpScore = 4;

  // Justification (5)
  let justScore: number;
  if      (justification.length >= 500) justScore = 5;
  else if (justification.length >= 300) justScore = 4;
  else                                   justScore = 2;

  // Validity (2)
  const weeklyCapacity = dailyCapacity * 7;
  const validationFlags: string[] = [];
  let validityScore = 2;
  for (let w = 0; w < 8; w++) {
    const wTotal = sopPlanA[w] + sopPlanB[w];
    if (wTotal > weeklyCapacity * 1.3) {
      validationFlags.push(`Week ${w + 1}: Planned ${wTotal.toLocaleString()} units exceeds capacity by >30%`);
      validityScore -= 0.5;
    }
  }
  validityScore = Math.max(0, validityScore);

  const scoreBreakdown = {
    performance:  performanceScore,
    sopQuality:   sopScore,
    mrpLogic:     mrpScore,
    justification: justScore,
    validity:     validityScore,
  };

  const totalScore = Math.round(
    performanceScore + sopScore + mrpScore + justScore + validityScore
  );

  let letterGrade: string;
  if      (totalScore >= 50) letterGrade = "A";
  else if (totalScore >= 44) letterGrade = "B";
  else if (totalScore >= 38) letterGrade = "C";
  else                        letterGrade = "D";

  // ── Feedback ──
  const feedback: string[] = [];
  if (serviceLevel < 95) {
    feedback.push(`Service level ${serviceLevel.toFixed(1)}% is below 95%. Increase safety stock or switch to a higher capacity mode.`);
  }
  if (costRatio > 1.15) {
    feedback.push(`Total cost is ${((costRatio - 1) * 100).toFixed(1)}% above target. Review your capacity mode — Standard mode reduces base cost.`);
  }
  if (capacityUtil > 98) {
    feedback.push(`Capacity utilization ${capacityUtil.toFixed(1)}% is near maximum — high stockout risk. Reduce weekly production targets or switch to Overtime/Two-Shift mode.`);
  }
  if (capacityUtil < 60) {
    feedback.push(`Capacity utilization ${capacityUtil.toFixed(1)}% is low, indicating over-provisioned capacity. Consider Standard mode to reduce daily capacity cost.`);
  }
  if (sopRatio < 0.90 || sopRatio > 1.10) {
    feedback.push(`Your 8-week S&OP plan (${totalSopPlanned.toLocaleString()} units) is >10% away from expected demand (${Math.round(expectedDemand).toLocaleString()} units). Align production targets more closely with demand.`);
  }
  if (totalStockoutsA + totalStockoutsB > 0 && feedback.length < 4) {
    feedback.push(`Stockouts: ${(totalStockoutsA + totalStockoutsB).toLocaleString()} units lost. Increase safety stock buffer or capacity to eliminate them.`);
  }

  return {
    score: totalScore,
    maxScore: 55,
    letterGrade,
    scoreBreakdown,
    kpis: {
      serviceLevel:       Math.round(serviceLevel * 10) / 10,
      totalCost:          Math.round(totalCost),
      capacityCost:       Math.round(totalCapacityCost),
      holdingCost:        Math.round(totalHoldingCost),
      changeoverCost:     Math.round(totalChangeoverCost),
      stockoutCost:       Math.round(totalStockoutCost),
      markdownCost:       Math.round(markdownCost),
      capacityUtilization: Math.round(capacityUtil * 10) / 10,
      totalProductionA,
      totalProductionB,
      totalStockoutsA,
      totalStockoutsB,
      endingInventoryA:   inventoryA,
      endingInventoryB:   inventoryB,
      weeklyCapacity,
    },
    validationFlags,
    feedback,
  };
}
