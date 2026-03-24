/**
 * Module 3 Simulation Engine — Distribution Network & Inventory Policy
 * Veloce Wear SCM Simulation
 * v3: EOQ Math Grading + Profit/Markdown Tracking + Service Level Input
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

// v3 constants
const SELLING_PRICE_A        = 29.00;
const SELLING_PRICE_B        = 69.00;
const ORDERING_COST_S        = 200.00;
const HOLDING_COST_ANNUAL_A  = 3.60;
const HOLDING_COST_ANNUAL_B  = 6.00;
const MARKDOWN_RATE          = 0.40;

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
  serviceLevel?: number; // optional 0.80–0.99, default 0.95
}

export interface M3Context {
  forecastA: number;
  forecastB: number;
  m2ServiceLevel: number;  // 0-100
  m2CapacityUtilization: number;
}

export interface MathBenchmark {
  refEoq: number;
  refRop: number;
  refSs: number;
  avgDailyDemand: number;
  avgLeadTime: number;
  qRatio: number | null;
  ropRatio: number | null;
  studentSs: number;
  qScore: number;
  ropScore: number;
  ssScore: number;
}

export interface M3SimulationResult {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: {
    performance: number;
    inventoryMath: number;
    policyReasoning: number;
    validity: number;
    // legacy keys preserved for backward compat
    inventoryLogic: number;
    networkDesign: number;
    justification: number;
    mathBenchmark: MathBenchmark;
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
    // v3 new KPIs
    markdownCost: number;
    totalRevenue: number;
    totalProfit: number;
    profitMarginPct: number;
    blendedSellingPrice: number;
    costRatio: number;
    costVsTarget: number;
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

  // Service level input (v3)
  const serviceLevelInput = Math.max(0.80, Math.min(0.99, decisions.serviceLevel ?? 0.95));

  // ── M1/M2 context ──
  const forecastA      = Math.max(5000, m3Context.forecastA  ?? 17800);
  const forecastB      = Math.max(2000, m3Context.forecastB  ?? 9000);
  const dailyDemandAvg = (forecastA + forecastB) / 30;

  // [CRITICAL-5]: M2 service level modulates lead time variability
  const m2ServiceLevel  = Math.max(0.70, Math.min(1.0, (m3Context.m2ServiceLevel ?? 96) / 100));
  const leadTimeStretch = 1.0 + (1.0 - m2ServiceLevel) * 2.0;

  // ── Network & service config ──
  const net = NETWORK_CONFIGS[networkKey];

  // ── Initialize inventory ──
  let inventory = rop + q;
  let pipelineOrders: Array<{ qty: number; arrivalDay: number }> = [];

  // ── Tracking ──
  let totalDemand    = 0, totalFilled  = 0, totalStockouts  = 0;
  let totalHolding   = 0, totalTransport = 0, totalDcCost   = 0;
  let totalShipping  = 0, totalCarbonKg  = 0;

  const svc = SERVICE_MODES[serviceKey];

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
      const leadTime = net.leadTimeMin + Math.floor(rand() * (range + 1));
      pipelineOrders.push({ qty: q, arrivalDay: day + leadTime });

      totalTransport += q * net.transportCostPerUnit;
      totalCarbonKg  += q * net.carbonPerUnit * svc.carbonMultiplier;
    }

    // DC cost (weekly)
    if (day % 7 === 0) totalDcCost += net.dcCostPerWeek;
  }

  // ── Post-simulation: markdown and profit (v3) ──
  const totalForecast = forecastA + forecastB;
  const blendedPrice = totalForecast > 0
    ? (forecastA * SELLING_PRICE_A + forecastB * SELLING_PRICE_B) / totalForecast
    : (SELLING_PRICE_A + SELLING_PRICE_B) / 2;

  const markdownCost   = Math.max(0, inventory) * blendedPrice * MARKDOWN_RATE;
  const stockoutCost   = totalStockouts * STOCKOUT_PENALTY;
  const carbonTaxCost  = totalCarbonKg  * CARBON_TAX_PER_KG;
  const totalCost      = totalHolding + totalTransport + totalDcCost + totalShipping + stockoutCost + carbonTaxCost + markdownCost;

  const totalRevenue   = totalFilled * blendedPrice;
  const totalProfit    = totalRevenue - totalCost;
  const profitMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // ── Grading — 55 points (v3 Rubric) ──

  // Category 1: Performance (30 pts): Fill Rate (20) + Cost Efficiency (10)
  const fillRate = totalDemand > 0 ? (totalFilled / totalDemand) * 100 : 0;

  let fillPoints: number;
  if      (fillRate >= 94) fillPoints = 20;
  else if (fillRate >= 90) fillPoints = 17;
  else if (fillRate >= 85) fillPoints = 14;
  else if (fillRate >= 80) fillPoints = 10;
  else                      fillPoints = 5;

  const targetCost  = TARGET_COSTS[networkKey];
  const costRatio   = targetCost > 0 ? totalCost / targetCost : 1;
  let costPoints: number;
  if      (costRatio <= 1.05) costPoints = 10;
  else if (costRatio <= 1.10) costPoints = 8;
  else if (costRatio <= 1.15) costPoints = 7;
  else if (costRatio <= 1.25) costPoints = 5;
  else                         costPoints = 3;

  const performanceScore = fillPoints + costPoints;

  // Category 2: Inventory Math Correctness (15 pts)
  const avgDailyDemandActual = totalDemand / SIMULATION_DAYS;
  const avgLeadTime = (net.leadTimeMin + net.leadTimeMax) / 2.0;

  // Blended annual holding cost
  const blendedH = totalForecast > 0
    ? (forecastA * HOLDING_COST_ANNUAL_A + forecastB * HOLDING_COST_ANNUAL_B) / totalForecast
    : (HOLDING_COST_ANNUAL_A + HOLDING_COST_ANNUAL_B) / 2;

  // Reference EOQ
  const annualDemandSim = avgDailyDemandActual * 365;
  const refEoq = blendedH > 0
    ? Math.sqrt((2 * annualDemandSim * ORDERING_COST_S) / blendedH)
    : q;

  // Reference Safety Stock (Z=1.28 for 90% SL minimum standard)
  const sigmaAssumed = avgDailyDemandActual * 0.15;
  const refSs  = 1.28 * sigmaAssumed * Math.sqrt(avgLeadTime);

  // Reference ROP
  const refRop = avgDailyDemandActual * avgLeadTime + refSs;

  // Score Q vs EOQ
  let qScore: number;
  if (refEoq > 0) {
    const qRatio = q / refEoq;
    if      (qRatio >= 0.85 && qRatio <= 1.15) qScore = 6;
    else if (qRatio >= 0.70 && qRatio <= 1.30) qScore = 4;
    else if (qRatio >= 0.50 && qRatio <= 1.50) qScore = 2;
    else                                         qScore = 0;
  } else {
    qScore = 3;
  }

  // Score ROP vs benchmark
  let ropScore: number;
  if (refRop > 0) {
    const ropRatio = rop / refRop;
    if      (ropRatio >= 0.85 && ropRatio <= 1.15) ropScore = 5;
    else if (ropRatio >= 0.70 && ropRatio <= 1.30) ropScore = 3;
    else if (ropRatio >= 0.50 && ropRatio <= 1.50) ropScore = 2;
    else                                             ropScore = 0;
  } else {
    ropScore = 2;
  }

  // Safety Stock implicit check
  const leadTimeDemand = avgDailyDemandActual * avgLeadTime;
  const studentSs      = Math.max(0, rop - leadTimeDemand);

  let ssScore: number;
  if      (studentSs >= refSs * 0.80) ssScore = 4;
  else if (studentSs >= refSs * 0.40) ssScore = 2;
  else if (studentSs > 0)              ssScore = 1;
  else                                 ssScore = 0;

  const inventoryMathScore = qScore + ropScore + ssScore;

  const mathBenchmark: MathBenchmark = {
    refEoq:           Math.round(refEoq),
    refRop:           Math.round(refRop),
    refSs:            Math.round(refSs),
    avgDailyDemand:   Math.round(avgDailyDemandActual * 10) / 10,
    avgLeadTime:      Math.round(avgLeadTime * 10) / 10,
    qRatio:           refEoq > 0 ? Math.round((q / refEoq) * 1000) / 1000 : null,
    ropRatio:         refRop > 0 ? Math.round((rop / refRop) * 1000) / 1000 : null,
    studentSs:        Math.round(studentSs),
    qScore,
    ropScore,
    ssScore,
  };

  // Category 3: Policy Quality & Reasoning (8 pts)
  let netScore: number;
  if      (fillRate >= 90 && networkKey !== "centralized") netScore = 5;
  else if (fillRate >= 90 && networkKey === "centralized") netScore = 4;
  else if (fillRate <  85 && networkKey === "centralized") netScore = 2;
  else                                                      netScore = 3;

  let justScore: number;
  if      (justification.length >= 400) justScore = 3;
  else if (justification.length >= 250) justScore = 2;
  else if (justification.length >= 100) justScore = 1;
  else                                   justScore = 0;

  const policyReasoningScore = netScore + justScore;

  // Category 4: Validity (2 pts)
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

  const totalScore = Math.round(
    performanceScore + inventoryMathScore + policyReasoningScore + validityScore
  );

  let letterGrade: string;
  if      (totalScore >= 50) letterGrade = "A";
  else if (totalScore >= 44) letterGrade = "B";
  else if (totalScore >= 38) letterGrade = "C";
  else                        letterGrade = "D";

  // ── Feedback (v3) ──
  const feedback: string[] = [];

  if (fillRate < 90) {
    feedback.push(
      `Fill rate (${fillRate.toFixed(1)}%) is below 90%. Check: Is your ROP high enough to cover lead time demand plus variability? The engine's reference ROP for your network/mode combination is approximately ${Math.round(refRop).toLocaleString()} units.`
    );
  }

  if (costRatio > 1.15) {
    feedback.push(
      `Total cost is ${((costRatio - 1) * 100).toFixed(1)}% above your network's target (€${targetCost.toLocaleString()}). Review your largest cost component: DC cost, transport, holding, or stockout penalties. Consider whether a different network or service mode combination reduces cost without sacrificing fill rate.`
    );
  }

  if (qScore < 4) {
    feedback.push(
      `Your order quantity Q=${q.toLocaleString()} is outside the ±30% band around the formula-based benchmark (≈${Math.round(refEoq).toLocaleString()} units). Review your EOQ calculation — ensure you used annual demand (daily × 365), S=€200, and the appropriate H value.`
    );
  }

  if (ssScore === 0) {
    feedback.push(
      "Your ROP appears to include no safety stock buffer (ROP ≈ lead time demand only). This means any day with above-average demand or a late delivery will cause a stockout. Add safety stock: SS = Z × σd × √L, then ROP = μd×L + SS."
    );
  }

  if (totalCarbonKg > 50000) {
    feedback.push(
      `Carbon footprint (${Math.round(totalCarbonKg).toLocaleString()} kg CO₂) is high. If using Express mode, consider whether Mixed or Standard would reduce carbon while still meeting your service targets.`
    );
  }

  if (profitMarginPct < 15) {
    feedback.push(
      `Profit margin (${profitMarginPct.toFixed(1)}%) is low. High fill rate is not sufficient — Veloce Wear needs margin. Review your largest cost driver and consider whether the current network/mode balance is cost-efficient.`
    );
  }

  if (m2ServiceLevel < 0.92) {
    feedback.push(
      `Your M2 service level (${(m2ServiceLevel * 100).toFixed(1)}%) is causing wider lead time variability in distribution. Higher M2 performance in future attempts would improve M3 outcomes.`
    );
  }

  const costVsTarget = Math.round((costRatio - 1) * 1000) / 10;

  return {
    score: totalScore,
    maxScore: 55,
    letterGrade,
    scoreBreakdown: {
      performance:    performanceScore,
      inventoryMath:  inventoryMathScore,
      policyReasoning: policyReasoningScore,
      validity:       validityScore,
      // legacy keys
      inventoryLogic: inventoryMathScore,
      networkDesign:  netScore,
      justification:  justScore,
      mathBenchmark,
    },
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
      // v3 new KPIs
      markdownCost:          Math.round(markdownCost),
      totalRevenue:          Math.round(totalRevenue),
      totalProfit:           Math.round(totalProfit),
      profitMarginPct:       Math.round(profitMarginPct * 10) / 10,
      blendedSellingPrice:   Math.round(blendedPrice * 100) / 100,
      costRatio:             Math.round(costRatio * 1000) / 1000,
      costVsTarget,
    },
    validationFlags,
    feedback,
  };
}
