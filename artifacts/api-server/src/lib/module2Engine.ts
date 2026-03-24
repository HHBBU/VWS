/**
 * Module 2 Simulation Engine — Operations Planning & MRP
 * Veloce Wear SCM Simulation
 * v3 Upgrade: New decisions (bottleneck, training, layout, flow, lean),
 *             new grading rubric (20/10/10/10/5 = 55),
 *             new KPIs (scrap/rework cost, investment costs, cost ratio, true bottleneck)
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
// CONSTANTS
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

// ── v3 Work center data for bottleneck calculation ──
const WORK_CENTERS = {
  cutting:   { capacity_min_day: 1500, sam_a: 0.8, sam_b: 1.1 },
  dyeing:    { capacity_min_day: 1400, sam_a: 0.7, sam_b: 1.0 },
  sewing:    { capacity_min_day: 3100, sam_a: 3.2, sam_b: 4.8 },
  packaging: { capacity_min_day: 1100, sam_a: 0.5, sam_b: 0.7 },
} as const;

// ── v3 Capacity improvement options ──
const CAPACITY_IMPROVEMENTS = {
  none:             { work_center: null,        cost: 0,     multiplier: 1.0  },
  cutting_modify:   { work_center: "cutting",   cost: 18000, multiplier: 1.20 },
  cutting_buy:      { work_center: "cutting",   cost: 42000, multiplier: 1.45 },
  dyeing_modify:    { work_center: "dyeing",    cost: 26000, multiplier: 1.20 },
  dyeing_buy:       { work_center: "dyeing",    cost: 65000, multiplier: 1.45 },
  sewing_modify:    { work_center: "sewing",    cost: 22000, multiplier: 1.20 },
  sewing_buy:       { work_center: "sewing",    cost: 95000, multiplier: 1.50 },
  packaging_modify: { work_center: "packaging", cost: 14000, multiplier: 1.20 },
  packaging_buy:    { work_center: "packaging", cost: 30000, multiplier: 1.45 },
} as const;

// ── v3 Training options ──
const TRAINING_OPTIONS = {
  none:        { cost: 0,     scrap_reduction: 0.0,  rework_reduction: 0.0,  setup_reduction: 0.0  },
  green_belt:  { cost: 7500,  scrap_reduction: 0.20, rework_reduction: 0.15, setup_reduction: 0.05 },
  black_belt:  { cost: 16000, scrap_reduction: 0.35, rework_reduction: 0.25, setup_reduction: 0.08 },
} as const;

// ── v3 Lean options ──
const LEAN_OPTIONS = {
  none:              { cost: 0,     holding_factor: 1.0,  defect_factor: 1.0,  downtime_factor: 1.0  },
  "5s":              { cost: 3000,  holding_factor: 0.97, defect_factor: 1.0,  downtime_factor: 1.0  },
  poka_yoke:         { cost: 6500,  holding_factor: 1.0,  defect_factor: 0.75, downtime_factor: 1.0  },
  andon:             { cost: 4500,  holding_factor: 1.0,  defect_factor: 1.0,  downtime_factor: 0.92 },
  poka_andon_bundle: { cost: 10000, holding_factor: 0.97, defect_factor: 0.75, downtime_factor: 0.92 },
  lean_flow:         { cost: 12000, holding_factor: 0.75, defect_factor: 0.90, downtime_factor: 0.95 },
} as const;

// ── v3 Layout combinations ──
type LayoutKey = "functional" | "product";
type FlowKey   = "cellular"   | "batch";

const LAYOUT_EFFECTS: Record<string, { changeover_factor: number }> = {
  "functional:cellular": { changeover_factor: 0.80 },
  "functional:batch":    { changeover_factor: 1.00 },
  "product:cellular":    { changeover_factor: 0.90 },
  "product:batch":       { changeover_factor: 1.10 },
};

const BASE_SCRAP_RATE_A = 0.045;
const BASE_SCRAP_RATE_B = 0.055;

// ============================================================
// TYPES
// ============================================================

export interface M2Decisions {
  sopPlanA: number[];
  sopPlanB: number[];
  capacityMode: "standard" | "overtime" | "two_shift";
  lotSize: "small" | "medium" | "large";
  priorityRule: "balanced" | "priority_a" | "priority_b";
  safetyStock: "3_dos" | "6_dos" | "9_dos";
  justification: string;
  // v3 new fields
  bottleneckTarget?: string;
  trainingChoice?: string;
  layoutChoice?: string;
  flowChoice?: string;
  leanChoice?: string;
}

export interface M1Context {
  avgReliabilityPct: number;
  avgLeadTimeDays: number;
  forecastA: number;
  forecastB: number;
}

export interface M2SimulationResult {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: {
    performance: number;
    sopQuality: number;
    bottleneckScore: number;
    leanQualityScore: number;
    justification: number;
    bottleneckDetail?: {
      true_bottleneck: string;
      true_bottleneck_util: number;
      wc_utilizations: Record<string, number>;
      student_target: string | null;
    };
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
    // v3 new KPIs
    scrapReworkCost: number;
    trainingCost: number;
    leanCost: number;
    capacityImprovementCost: number;
    totalInvestmentCost: number;
    costRatio: number;
    costVsTargetPct: number;
    trueBottleneck: string;
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
  // ── Deterministic seed ──
  const seed = ((stableHash(String(userId)) + seedOffsetBase + 200 + runNumber) >>> 0);
  const rand = mulberry32(seed);

  // ── Extract core decisions ──
  const sopPlanA = decisions.sopPlanA.map((v) => Math.max(0, Math.floor(v || 0)));
  const sopPlanB = decisions.sopPlanB.map((v) => Math.max(0, Math.floor(v || 0)));

  const capacityMode = CAPACITY_MODES[decisions.capacityMode] ? decisions.capacityMode : "standard";
  const lotSizeKey   = LOT_SIZING[decisions.lotSize]           ? decisions.lotSize       : "medium";
  const priorityRule = ["balanced","priority_a","priority_b"].includes(decisions.priorityRule)
    ? decisions.priorityRule : "balanced";
  const ssKey = SAFETY_STOCK_DOS[decisions.safetyStock] !== undefined
    ? decisions.safetyStock : "6_dos";
  const justification = decisions.justification || "";

  // ── Extract v3 decisions ──
  const rawBottleneckTarget = decisions.bottleneckTarget ?? "none";
  const bottleneckTarget = rawBottleneckTarget in CAPACITY_IMPROVEMENTS ? rawBottleneckTarget : "none";

  const rawTrainingChoice = decisions.trainingChoice ?? "none";
  const trainingChoice = rawTrainingChoice in TRAINING_OPTIONS ? rawTrainingChoice : "none";

  const rawLayoutChoice = decisions.layoutChoice ?? "functional";
  const layoutChoice: LayoutKey = (rawLayoutChoice === "product" || rawLayoutChoice === "functional")
    ? rawLayoutChoice as LayoutKey : "functional";

  const rawFlowChoice = decisions.flowChoice ?? "cellular";
  const flowChoice: FlowKey = (rawFlowChoice === "batch" || rawFlowChoice === "cellular")
    ? rawFlowChoice as FlowKey : "cellular";

  const rawLeanChoice = decisions.leanChoice ?? "none";
  const leanChoice = rawLeanChoice in LEAN_OPTIONS ? rawLeanChoice : "none";

  // ── M1 context ──
  const reliabilityRate = Math.max(0.5, Math.min(1.0, (m1Context.avgReliabilityPct ?? 95) / 100));
  const forecastA       = Math.max(5000, m1Context.forecastA  ?? 17800);
  const forecastB       = Math.max(2000, m1Context.forecastB  ?? 9000);

  // ── Capacity & lot sizing config ──
  const { dailyCapacity, dailyCost }   = CAPACITY_MODES[capacityMode];
  const { changeoversPer, lossRate }   = LOT_SIZING[lotSizeKey];
  const safetyStockDos                 = SAFETY_STOCK_DOS[ssKey];

  // ── v3: Apply improvement effects ──
  const improveCfg  = CAPACITY_IMPROVEMENTS[bottleneckTarget as keyof typeof CAPACITY_IMPROVEMENTS];
  const trainingCfg = TRAINING_OPTIONS[trainingChoice as keyof typeof TRAINING_OPTIONS];
  const leanCfg     = LEAN_OPTIONS[leanChoice as keyof typeof LEAN_OPTIONS];
  const layoutKey   = `${layoutChoice}:${flowChoice}`;
  const layoutEffect = LAYOUT_EFFECTS[layoutKey] ?? { changeover_factor: 1.0 };

  const capacityImprovementCost = improveCfg.cost;
  const trainingCost             = trainingCfg.cost;
  const leanCost                 = leanCfg.cost;

  const effectiveScrapRateA = BASE_SCRAP_RATE_A * (1 - trainingCfg.scrap_reduction);
  const effectiveScrapRateB = BASE_SCRAP_RATE_B * (1 - trainingCfg.scrap_reduction);

  const adjustedLossRate = Math.max(0.005, lossRate * (1 - trainingCfg.scrap_reduction * 0.5));
  const adjustedChangeoverCost = CHANGEOVER_COST * layoutEffect.changeover_factor;
  const leanHoldingFactor      = leanCfg.holding_factor;
  const leanDowntimeFactor     = leanCfg.downtime_factor;

  // On disruption days: 0.5 baseline + lean recovery
  const effectiveDisruptionFactor = 0.5 + (1 - leanDowntimeFactor) * 0.5;

  // ── Convert S&OP weekly plan to daily targets ──
  const dailyTargetsA: number[] = [];
  const dailyTargetsB: number[] = [];
  for (let w = 0; w < 8; w++) {
    for (let d = 0; d < 7; d++) {
      dailyTargetsA.push(sopPlanA[w] / 7);
      dailyTargetsB.push(sopPlanB[w] / 7);
    }
  }

  // ── Generate stochastic demand ──
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

    // Material disruption from M1 supplier reliability (v3: lean improves recovery)
    if (rand() > reliabilityRate) {
      plannedA = Math.floor(plannedA * effectiveDisruptionFactor);
      plannedB = Math.floor(plannedB * effectiveDisruptionFactor);
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

    // v3: Adjusted yield loss (training reduces scrap component)
    actualA = Math.floor(actualA * (1 - adjustedLossRate));
    actualB = Math.floor(actualB * (1 - adjustedLossRate));

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

    // v3: Lean reduces holding cost via lean_holding_factor
    totalHoldingCost  += (inventoryA + inventoryB) * HOLDING_COST_PER_UNIT * leanHoldingFactor;
    totalCapacityCost += dailyCost;
  }

  // ── Post-simulation cost calculations ──
  // v3: Use adjusted changeover cost (layout effect)
  const totalChangeoverCost = changeoversPer * 8 * adjustedChangeoverCost;
  const totalStockoutCost   = (totalStockoutsA + totalStockoutsB) * STOCKOUT_PENALTY;

  const endingInventory = inventoryA + inventoryB;
  const targetEnding    = ssA + ssB;
  const excessInventory = Math.max(0, endingInventory - targetEnding);
  const markdownCost    = excessInventory * MARKDOWN_COST;

  // v3: scrap/rework cost estimate
  const scrapReworkCost = (
    (totalProductionA * effectiveScrapRateA + totalProductionB * effectiveScrapRateB) * 8.50
  );

  // v3: total cost includes investment costs
  const totalCost = (
    totalCapacityCost + totalHoldingCost + totalChangeoverCost +
    totalStockoutCost + markdownCost +
    capacityImprovementCost + trainingCost + leanCost
  );

  const totalDemand    = totalDemandA + totalDemandB;
  const totalStockouts = totalStockoutsA + totalStockoutsB;
  const serviceLevel   = totalDemand > 0 ? ((totalDemand - totalStockouts) / totalDemand) * 100 : 0;

  const totalProduction = totalProductionA + totalProductionB;
  const totalCap        = dailyCapacity * SIMULATION_DAYS;
  const capacityUtil    = totalCap > 0 ? (totalProduction / totalCap) * 100 : 0;

  const targetCost = TARGET_COSTS[capacityMode];
  const costRatio  = targetCost > 0 ? totalCost / targetCost : 1;

  // ── Grading — v3 rubric (20/10/10/10/5 = 55) ──

  // Category 1: Performance (20 pts = Service 10 + Cost 10)
  let servicePoints: number;
  if      (serviceLevel >= 98) servicePoints = 10;
  else if (serviceLevel >= 95) servicePoints = 8;
  else if (serviceLevel >= 92) servicePoints = 7;
  else                          servicePoints = 5;

  let costPoints: number;
  if      (costRatio <= 1.05) costPoints = 10;
  else if (costRatio <= 1.10) costPoints = 8;
  else if (costRatio <= 1.15) costPoints = 7;
  else                         costPoints = 5;

  const performanceScore = servicePoints + costPoints;

  // Category 2: S&OP Quality (10 pts)
  const totalSopPlanned = sopPlanA.reduce((s, x) => s + x, 0) + sopPlanB.reduce((s, x) => s + x, 0);
  const expectedDemand  = (baselineA + baselineB) * SIMULATION_DAYS;
  const sopRatio        = expectedDemand > 0 ? totalSopPlanned / expectedDemand : 0;
  let sopScore: number;
  if      (sopRatio >= 0.95 && sopRatio <= 1.05) sopScore = 10;
  else if (sopRatio >= 0.90 && sopRatio <= 1.10) sopScore = 8;
  else                                            sopScore = 6;

  // Category 3: Bottleneck & Capacity Decision (10 pts)
  // Compute work-center utilization from S&OP plan
  const wcUtil: Record<string, number> = {};
  for (const [wcName, wc] of Object.entries(WORK_CENTERS)) {
    let totalRequiredMin = 0;
    for (let i = 0; i < 8; i++) {
      totalRequiredMin += (sopPlanA[i] * wc.sam_a + sopPlanB[i] * wc.sam_b);
    }
    const totalAvailableMin = wc.capacity_min_day * 7 * 8;
    wcUtil[wcName] = totalAvailableMin > 0 ? totalRequiredMin / totalAvailableMin : 0;
  }

  const trueBottleneck = Object.entries(wcUtil).reduce(
    (best, [k, v]) => (v > wcUtil[best] ? k : best),
    Object.keys(wcUtil)[0]
  );
  const maxUtil = wcUtil[trueBottleneck];

  const studentTargetWc = improveCfg.work_center as string | null;

  let bottleneckScore: number;
  if (studentTargetWc === null) {
    if      (maxUtil <= 0.90) bottleneckScore = 10;
    else if (maxUtil <= 1.00) bottleneckScore = 6;
    else                       bottleneckScore = 2;
  } else {
    const targetUtil = wcUtil[studentTargetWc] ?? 0;
    if (studentTargetWc === trueBottleneck) {
      if (improveCfg.multiplier >= 1.45 && (maxUtil * 0.80) <= 1.0) {
        bottleneckScore = 7;
      } else {
        bottleneckScore = 10;
      }
    } else if (Math.abs(targetUtil - maxUtil) / Math.max(maxUtil, 0.01) <= 0.10) {
      bottleneckScore = 6;
    } else {
      bottleneckScore = 3;
    }
  }

  const bottleneckDetail = {
    true_bottleneck: trueBottleneck,
    true_bottleneck_util: Math.round(maxUtil * 100 * 10) / 10,
    wc_utilizations: Object.fromEntries(
      Object.entries(wcUtil).map(([k, v]) => [k, Math.round(v * 100 * 10) / 10])
    ),
    student_target: studentTargetWc,
  };

  // Category 4: Lean / Quality / Layout (10 pts)
  const layoutPts = layoutChoice === "functional" ? 2 : 0;
  const flowPts   = flowChoice   === "cellular"   ? 2 : 0;

  let trainingPts: number;
  if (trainingChoice !== "none") {
    trainingPts = 3;
  } else {
    trainingPts = serviceLevel >= 95 ? 1 : 0;
  }

  const leanPtsMap: Record<string, number> = {
    none: 0, "5s": 1,
    poka_yoke: 3, andon: 2,
    poka_andon_bundle: 3, lean_flow: 3,
  };
  const leanPts = leanPtsMap[leanChoice] ?? 0;

  const leanQualityScore = Math.min(10, layoutPts + flowPts + trainingPts + leanPts);

  // Category 5: Justification (5 pts)
  let justScore: number;
  if      (justification.length >= 500) justScore = 5;
  else if (justification.length >= 300) justScore = 4;
  else                                   justScore = 2;

  // Validity flags (informational only — not scored in v3)
  const weeklyCapacity = dailyCapacity * 7;
  const validationFlags: string[] = [];
  for (let w = 0; w < 8; w++) {
    const wTotal = sopPlanA[w] + sopPlanB[w];
    if (wTotal > weeklyCapacity * 1.3) {
      validationFlags.push(`Week ${w + 1}: Planned ${wTotal.toLocaleString()} units exceeds capacity by >30%`);
    }
  }

  const scoreBreakdown = {
    performance:      performanceScore,
    sopQuality:       sopScore,
    bottleneckScore,
    leanQualityScore,
    justification:    justScore,
    bottleneckDetail,
  };

  const totalScore = Math.round(
    performanceScore + sopScore + bottleneckScore + leanQualityScore + justScore
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
    feedback.push(`Total cost is ${((costRatio - 1) * 100).toFixed(1)}% above target. Review your capacity mode and investment decisions.`);
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
  if (bottleneckScore <= 3 && feedback.length < 5) {
    feedback.push(`Bottleneck decision: your identified bottleneck (${studentTargetWc ?? "none"}) does not match the true bottleneck (${trueBottleneck} at ${bottleneckDetail.true_bottleneck_util}% utilization).`);
  }

  return {
    score: totalScore,
    maxScore: 55,
    letterGrade,
    scoreBreakdown,
    kpis: {
      serviceLevel:           Math.round(serviceLevel * 10) / 10,
      totalCost:              Math.round(totalCost),
      capacityCost:           Math.round(totalCapacityCost),
      holdingCost:            Math.round(totalHoldingCost),
      changeoverCost:         Math.round(totalChangeoverCost),
      stockoutCost:           Math.round(totalStockoutCost),
      markdownCost:           Math.round(markdownCost),
      capacityUtilization:    Math.round(capacityUtil * 10) / 10,
      totalProductionA,
      totalProductionB,
      totalStockoutsA,
      totalStockoutsB,
      endingInventoryA:       inventoryA,
      endingInventoryB:       inventoryB,
      weeklyCapacity,
      // v3 new KPIs
      scrapReworkCost:         Math.round(scrapReworkCost),
      trainingCost:            Math.round(trainingCost),
      leanCost:                Math.round(leanCost),
      capacityImprovementCost: Math.round(capacityImprovementCost),
      totalInvestmentCost:     Math.round(trainingCost + leanCost + capacityImprovementCost),
      costRatio:               Math.round(costRatio * 1000) / 1000,
      costVsTargetPct:         Math.round((costRatio - 1) * 100 * 10) / 10,
      trueBottleneck,
    },
    validationFlags,
    feedback,
  };
}
