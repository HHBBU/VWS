/**
 * Module 3 Simulation Engine — Distribution Network & Inventory Policy
 * Veloce Wear SCM Simulation
 * Ported from Python/Flask v2 spec (Opus 4.6 Review) to TypeScript/Express
 *
 * FIXES FROM SPEC:
 *   [CRITICAL-5] M2 service level actually used: modulates lead time variability
 */

// ============================================================
// PRNG utilities (same as Module 1 & 2 — deterministic seeding)
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

/** Poisson RV via normal approximation (accurate for lambda > 30) */
function poissonRandom(lambda: number, rand: () => number): number {
  if (lambda <= 0) return 0;
  const u1 = Math.max(1e-10, rand());
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
}

// ============================================================
// CONSTANTS
// ============================================================

const NETWORK_CONFIGS = {
  centralized: {
    numDcs: 1,
    dcCostPerWeek: 0,
    transportCostPerUnit: 0.18,
    leadTimeMin: 5,
    leadTimeMax: 10,
    carbonPerUnit: 1.5,
    label: "Centralized (Porto only)",
  },
  hybrid: {
    numDcs: 2,
    dcCostPerWeek: 22000,
    transportCostPerUnit: 0.22,
    leadTimeMin: 3,
    leadTimeMax: 7,
    carbonPerUnit: 1.0,
    label: "Hybrid (Porto + NA DC)",
  },
  decentralized: {
    numDcs: 3,
    dcCostPerWeek: 40000,
    transportCostPerUnit: 0.24,
    leadTimeMin: 1,
    leadTimeMax: 4,
    carbonPerUnit: 0.8,
    label: "Decentralized (Porto + NA + APAC)",
  },
} as const;

const SERVICE_MODES = {
  standard: { shippingCost: 0.75, transitDays: 5, carbonMultiplier: 1.0, label: "Standard Ground" },
  express:  { shippingCost: 1.10, transitDays: 2, carbonMultiplier: 2.5, label: "Express Air" },
  mixed:    { shippingCost: 0.90, transitDays: 3, carbonMultiplier: 1.5, label: "Mixed Strategy" },
} as const;

const TARGET_COSTS = { centralized: 290000, hybrid: 320000, decentralized: 360000 } as const;

const HOLDING_COST_PER_UNIT = 0.10;
const STOCKOUT_PENALTY      = 8.00;
const CARBON_TAX_PER_KG     = 0.05;
const SIMULATION_DAYS       = 90;

// ============================================================
// TYPES
// ============================================================

export interface M3Decisions {
  networkStrategy: "centralized" | "hybrid" | "decentralized";
  rop: number;
  q: number;
  serviceMode: "standard" | "express" | "mixed";
  forecastMethod: "moving_average" | "exponential_smoothing" | "seasonal" | "naive";
  justification: string;
}

export interface M3Context {
  forecastA: number;
  forecastB: number;
  m2ServiceLevel: number;  // 0-100
  m2CapacityUtilization: number;
}

export interface M3SimulationResult {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: {
    performance: number;
    inventoryLogic: number;
    networkDesign: number;
    justification: number;
    validity: number;
  };
  kpis: {
    fillRate: number;
    totalCost: number;
    holdingCost: number;
    transportCost: number;
    dcCost: number;
    shippingCost: number;
    stockoutCost: number;
    carbonTaxCost: number;
    totalCarbonKg: number;
    totalDemand: number;
    totalFilled: number;
    totalStockouts: number;
    endingInventory: number;
    avgDailyDemand: number;
    m2ServiceLevelPct: number;
  };
  validationFlags: string[];
  feedback: string[];
}

// ============================================================
// SIMULATION ENGINE
// ============================================================

export function runModule3Simulation(
  userId: number,
  decisions: M3Decisions,
  m3Context: M3Context,
  runNumber: number,
  seedOffsetBase: number = 1000,
): M3SimulationResult {
  // ── Deterministic seed ──
  const seed = ((stableHash(String(userId)) + seedOffsetBase + 300 + runNumber) >>> 0);
  const rand = mulberry32(seed);

  // ── Extract decisions with safe fallbacks ──
  const networkKey = NETWORK_CONFIGS[decisions.networkStrategy] ? decisions.networkStrategy : "hybrid";
  const serviceKey = SERVICE_MODES[decisions.serviceMode]       ? decisions.serviceMode     : "standard";
  const rop        = Math.max(0, Math.floor(decisions.rop ?? 0));
  const q          = Math.max(0, Math.floor(decisions.q  ?? 0));
  const justification = (decisions.justification ?? "").trim();

  // ── M1/M2 context ──
  const forecastA      = Math.max(5000, m3Context.forecastA  ?? 17800);
  const forecastB      = Math.max(2000, m3Context.forecastB  ?? 9000);
  const dailyDemandAvg = (forecastA + forecastB) / 30;

  // [CRITICAL-5]: M2 service level modulates lead time variability
  const m2ServiceLevel  = Math.max(0.70, Math.min(1.0, (m3Context.m2ServiceLevel ?? 96) / 100));
  const leadTimeStretch = 1.0 + (1.0 - m2ServiceLevel) * 2.0;

  // ── Network & service config ──
  const net = NETWORK_CONFIGS[networkKey];
  const svc = SERVICE_MODES[serviceKey];

  // ── Initialize inventory ──
  let inventory = rop + q;
  let pipelineOrders: Array<{ qty: number; arrivalDay: number }> = [];

  // ── Tracking ──
  let totalDemand    = 0, totalFilled  = 0, totalStockouts  = 0;
  let totalHolding   = 0, totalTransport = 0, totalDcCost   = 0;
  let totalShipping  = 0, totalCarbonKg  = 0;

  // ── 90-day daily simulation ──
  for (let day = 0; day < SIMULATION_DAYS; day++) {
    // Receive arriving orders
    const stillInPipeline: typeof pipelineOrders = [];
    for (const order of pipelineOrders) {
      if (order.arrivalDay <= day) inventory += order.qty;
      else stillInPipeline.push(order);
    }
    pipelineOrders = stillInPipeline;

    // Stochastic daily demand (Poisson via normal approximation)
    const dailyDemand = poissonRandom(dailyDemandAvg, rand);
    totalDemand += dailyDemand;

    // Meet demand
    if (inventory >= dailyDemand) {
      inventory  -= dailyDemand;
      totalFilled += dailyDemand;
      totalShipping += dailyDemand * svc.shippingCost;
    } else {
      totalFilled   += inventory;
      totalStockouts += dailyDemand - inventory;
      totalShipping  += inventory * svc.shippingCost;
      inventory = 0;
    }

    // Holding cost
    totalHolding += inventory * HOLDING_COST_PER_UNIT;

    // Reorder check (inventory position = on-hand + pipeline)
    const pipelineQty = pipelineOrders.reduce((s, o) => s + o.qty, 0);
    const invPosition = inventory + pipelineQty;

    if (invPosition <= rop && q > 0) {
      const stretchedMax = Math.max(net.leadTimeMin, Math.floor(net.leadTimeMax * leadTimeStretch));
      const range = stretchedMax - net.leadTimeMin;
      // Use rand() for integer lead time in [leadTimeMin, stretchedMax]
      const leadTime = net.leadTimeMin + Math.floor(rand() * (range + 1));
      pipelineOrders.push({ qty: q, arrivalDay: day + leadTime });

      totalTransport += q * net.transportCostPerUnit;
      totalCarbonKg  += q * net.carbonPerUnit * svc.carbonMultiplier;
    }

    // DC cost (weekly)
    if (day % 7 === 0) totalDcCost += net.dcCostPerWeek;
  }

  // ── KPIs ──
  const fillRate       = totalDemand > 0 ? (totalFilled / totalDemand) * 100 : 0;
  const stockoutCost   = totalStockouts * STOCKOUT_PENALTY;
  const carbonTaxCost  = totalCarbonKg  * CARBON_TAX_PER_KG;
  const totalCost      = totalHolding + totalTransport + totalDcCost + totalShipping + stockoutCost + carbonTaxCost;

  // ── Grading — 55 points ──

  // Performance (35 pts): Fill Rate (20) + Cost (15)
  let fillPoints: number;
  if      (fillRate >= 94) fillPoints = 20;
  else if (fillRate >= 90) fillPoints = 17;
  else if (fillRate >= 85) fillPoints = 14;
  else if (fillRate >= 80) fillPoints = 10;
  else                      fillPoints = 5;

  const targetCost  = TARGET_COSTS[networkKey];
  const costRatio   = targetCost > 0 ? totalCost / targetCost : 1;
  let costPoints: number;
  if      (costRatio <= 1.05) costPoints = 15;
  else if (costRatio <= 1.10) costPoints = 13;
  else if (costRatio <= 1.15) costPoints = 11;
  else if (costRatio <= 1.25) costPoints = 8;
  else                         costPoints = 5;

  const performanceScore = fillPoints + costPoints;

  // Inventory Logic (10 pts)
  const avgDailyDemandActual = totalDemand / SIMULATION_DAYS;
  const avgLeadTime = (net.leadTimeMin + net.leadTimeMax) / 2;
  const idealRopMin = avgDailyDemandActual * avgLeadTime;
  const idealRopMax = avgDailyDemandActual * avgLeadTime * 2;
  const idealQMin   = avgDailyDemandActual * 5;
  const idealQMax   = avgDailyDemandActual * 15;

  let invScore = 10;
  if (rop < idealRopMin * 0.5) invScore -= 4;
  if (q   < idealQMin   * 0.5) invScore -= 3;
  if (q   > idealQMax   * 2)   invScore -= 2;
  invScore = Math.max(0, invScore);

  // Network Design (5 pts)
  let netScore: number;
  if      (fillRate >= 90 && networkKey !== "centralized") netScore = 5;
  else if (fillRate >= 90 && networkKey === "centralized") netScore = 4;
  else if (fillRate <  85 && networkKey === "centralized") netScore = 2;
  else                                                      netScore = 3;

  // Justification (3 pts)
  let justScore: number;
  if      (justification.length >= 400) justScore = 3;
  else if (justification.length >= 250) justScore = 2;
  else                                   justScore = 1;

  // Validity (2 pts)
  const validationFlags: string[] = [];
  let validityScore = 2;
  if (rop <= 0 || q <= 0) {
    validationFlags.push("ROP and Q must both be greater than zero.");
    validityScore -= 1;
  }
  if (q > 50000) {
    validationFlags.push(`Order quantity (Q = ${q.toLocaleString()}) is unreasonably high (max 50,000).`);
    validityScore -= 0.5;
  }
  validityScore = Math.max(0, validityScore);

  const scoreBreakdown = {
    performance:    performanceScore,
    inventoryLogic: invScore,
    networkDesign:  netScore,
    justification:  justScore,
    validity:       validityScore,
  };

  const totalScore = Math.round(
    performanceScore + invScore + netScore + justScore + validityScore
  );

  let letterGrade: string;
  if      (totalScore >= 50) letterGrade = "A";
  else if (totalScore >= 44) letterGrade = "B";
  else if (totalScore >= 38) letterGrade = "C";
  else                        letterGrade = "D";

  // ── Feedback ──
  const feedback: string[] = [];
  if (fillRate < 90) {
    feedback.push(`Fill rate ${fillRate.toFixed(1)}% is below 90%. Increase ROP or Q to reduce stockouts.`);
  }
  if (costRatio > 1.15) {
    feedback.push(`Total cost is ${((costRatio - 1) * 100).toFixed(1)}% above target. Consider a lower-cost network strategy or Standard shipping.`);
  }
  if (totalCarbonKg > 50000) {
    const carbonAdvice =
      serviceKey === "express"
        ? "Consider switching to Standard or Mixed shipping to reduce environmental impact."
        : serviceKey === "mixed"
        ? "Consider Standard shipping to reduce carbon output further."
        : "Your demand volume generates significant carbon at scale — consider a decentralized network with shorter transport distances.";
    feedback.push(`High carbon footprint (${Math.round(totalCarbonKg).toLocaleString()} kg CO₂). ${carbonAdvice}`);
  }
  if (rop < idealRopMin) {
    feedback.push(`ROP (${rop.toLocaleString()}) may be too low for average lead time of ${avgLeadTime.toFixed(1)} days. Suggested minimum: ${Math.round(idealRopMin).toLocaleString()} units.`);
  }
  if (m2ServiceLevel < 0.92) {
    feedback.push(`Your M2 service level (${(m2ServiceLevel * 100).toFixed(1)}%) is causing wider lead time variability in distribution. Higher M2 performance in future attempts would improve M3 outcomes.`);
  }
  if (invScore < 7 && feedback.length < 4) {
    feedback.push(`Inventory policy (ROP/Q) may be misaligned with demand and lead times. Ideal ROP: ${Math.round(idealRopMin).toLocaleString()}–${Math.round(idealRopMax).toLocaleString()}, Ideal Q: ${Math.round(idealQMin).toLocaleString()}–${Math.round(idealQMax).toLocaleString()} units.`);
  }

  return {
    score: totalScore,
    maxScore: 55,
    letterGrade,
    scoreBreakdown,
    kpis: {
      fillRate:              Math.round(fillRate * 10) / 10,
      totalCost:             Math.round(totalCost),
      holdingCost:           Math.round(totalHolding),
      transportCost:         Math.round(totalTransport),
      dcCost:                Math.round(totalDcCost),
      shippingCost:          Math.round(totalShipping),
      stockoutCost:          Math.round(stockoutCost),
      carbonTaxCost:         Math.round(carbonTaxCost),
      totalCarbonKg:         Math.round(totalCarbonKg),
      totalDemand,
      totalFilled,
      totalStockouts,
      endingInventory:       Math.round(inventory),
      avgDailyDemand:        Math.round(dailyDemandAvg),
      m2ServiceLevelPct:     Math.round(m2ServiceLevel * 1000) / 10,
    },
    validationFlags,
    feedback,
  };
}
