/**
 * Module 1 Simulation Engine — Global Sourcing & Procurement
 * Veloce Wear SCM Simulation
 * Ported from Python/Flask spec to TypeScript/Express
 */

// ============================================================
// PRNG utilities (deterministic seeding)
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

function normalRandom(mean: number, sigma: number, rand: () => number): number {
  const u1 = Math.max(1e-10, rand());
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sigma * z;
}

function stableHash(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

// ============================================================
// SUPPLIER DATABASE (8 Suppliers)
// ============================================================

interface Supplier {
  name: string;
  country: string;
  cottonPrice: number;
  nylonPrice: number;
  leadTimeMean: number;
  leadTimeSd: number;
  reliabilityBase: number;
  sustainability: number;
  quality: number;
  certifications: string[];
  region: "nearshore" | "offshore";
}

const SUPPLIERS: Record<string, Supplier> = {
  PT1: {
    name: "Lusitex Premium",
    country: "Portugal",
    cottonPrice: 3.55,
    nylonPrice: 5.10,
    leadTimeMean: 5,
    leadTimeSd: 1,
    reliabilityBase: 0.97,
    sustainability: 4.4,
    quality: 4.6,
    certifications: ["ISO9001", "ISO14001", "OEKO-TEX"],
    region: "nearshore",
  },
  PT2: {
    name: "PortoWeave Organic",
    country: "Portugal",
    cottonPrice: 3.85,
    nylonPrice: 5.25,
    leadTimeMean: 6,
    leadTimeSd: 1,
    reliabilityBase: 0.96,
    sustainability: 4.8,
    quality: 4.7,
    certifications: ["ISO9001", "ISO14001", "GOTS", "OEKO-TEX"],
    region: "nearshore",
  },
  TR1: {
    name: "Anatolia Mills",
    country: "Turkey",
    cottonPrice: 3.20,
    nylonPrice: 4.95,
    leadTimeMean: 8,
    leadTimeSd: 2,
    reliabilityBase: 0.94,
    sustainability: 3.8,
    quality: 4.0,
    certifications: ["ISO9001", "ISO14001"],
    region: "nearshore",
  },
  TR2: {
    name: "Bosporus Textiles",
    country: "Turkey",
    cottonPrice: 3.35,
    nylonPrice: 5.05,
    leadTimeMean: 9,
    leadTimeSd: 2,
    reliabilityBase: 0.95,
    sustainability: 4.1,
    quality: 4.2,
    certifications: ["ISO9001", "ISO14001", "OEKO-TEX"],
    region: "nearshore",
  },
  VN1: {
    name: "Saigon Spinners",
    country: "Vietnam",
    cottonPrice: 2.85,
    nylonPrice: 4.70,
    leadTimeMean: 28,
    leadTimeSd: 4,
    reliabilityBase: 0.88,
    sustainability: 3.2,
    quality: 3.6,
    certifications: ["ISO9001"],
    region: "offshore",
  },
  VN2: {
    name: "Hanoi EcoWeave",
    country: "Vietnam",
    cottonPrice: 3.05,
    nylonPrice: 4.85,
    leadTimeMean: 30,
    leadTimeSd: 5,
    reliabilityBase: 0.90,
    sustainability: 4.0,
    quality: 3.8,
    certifications: ["ISO9001", "ISO14001", "OEKO-TEX"],
    region: "offshore",
  },
  MX1: {
    name: "Monterrey KnitWorks",
    country: "Mexico",
    cottonPrice: 3.10,
    nylonPrice: 4.60,
    leadTimeMean: 24,
    leadTimeSd: 3,
    reliabilityBase: 0.91,
    sustainability: 3.5,
    quality: 3.7,
    certifications: ["ISO9001"],
    region: "offshore",
  },
  MX2: {
    name: "Yucatan SustainTex",
    country: "Mexico",
    cottonPrice: 3.25,
    nylonPrice: 4.75,
    leadTimeMean: 26,
    leadTimeSd: 3,
    reliabilityBase: 0.92,
    sustainability: 4.2,
    quality: 3.9,
    certifications: ["ISO9001", "ISO14001"],
    region: "offshore",
  },
};

// ============================================================
// TRANSPORT MODES
// ============================================================

interface TransportMode {
  costPerKg: number;
  timeMin: number;
  timeMax: number;
  co2: number;
  reliabilityBonus: number;
}

const TRANSPORT_MODES: Record<string, Record<string, TransportMode>> = {
  nearshore: {
    truck: { costPerKg: 0.18, timeMin: 2, timeMax: 5, co2: 2, reliabilityBonus: 0 },
    rail: { costPerKg: 0.12, timeMin: 4, timeMax: 8, co2: 1, reliabilityBonus: 0.01 },
    air: { costPerKg: 0.95, timeMin: 4, timeMax: 9, co2: 9, reliabilityBonus: 0.02 },
  },
  offshore: {
    ocean: { costPerKg: 0.08, timeMin: 18, timeMax: 35, co2: 3, reliabilityBonus: 0 },
    air: { costPerKg: 0.95, timeMin: 4, timeMax: 9, co2: 9, reliabilityBonus: 0.02 },
  },
};

// ============================================================
// ASSURANCE PACKAGES
// ============================================================

const ASSURANCE_PACKAGES: Record<string, { pricePremium: number; reliabilityBoost: number }> = {
  standard: { pricePremium: 0.00, reliabilityBoost: 0.00 },
  priority: { pricePremium: 0.03, reliabilityBoost: 0.04 },
  premium: { pricePremium: 0.06, reliabilityBoost: 0.08 },
};

// ============================================================
// CONSTANTS
// ============================================================

const ORDER_COST_PER_BATCH = 200;
const MARKET_REPORT_COST = 10000;
const DEMAND_SIGMA_A = 0.10;
const DEMAND_SIGMA_B = 0.06;
const DEMAND_SIGMA_A_WITH_REPORT = 0.07;
const DEMAND_SIGMA_B_WITH_REPORT = 0.04;
const SKU_A_COTTON_KG = 0.23;
const SKU_B_NYLON_KG = 0.42;
const SKU_A_SCRAP_FACTOR = 1.06;
const SKU_B_SCRAP_FACTOR = 1.08;

// ============================================================
// TYPES
// ============================================================

export interface SupplierAllocation {
  supplierId: string;
  materialType: "cotton" | "nylon";
  kg: number;
  transportMode: string;
  assurancePackage: "standard" | "priority" | "premium";
  numBatches: number;
}

export interface M1Decisions {
  forecastA: number;
  forecastB: number;
  forecastMethod: string;
  forecastMethodA?: string;
  forecastMethodB?: string;
  purchaseReport: boolean;
  allocations: SupplierAllocation[];
  justification: string;
}

export interface M1ScoreBreakdown {
  forecasting: number;
  supplierMethod: number;
  tradeoffs: number;
  qualitySustainability: number;
  validityJustification: number;
}

export interface M1KPIs {
  totalProcurementCost: number;
  materialCost: number;
  transportCost: number;
  orderCost: number;
  lateDeliveryPenalty: number;
  forecastA: number;
  forecastB: number;
  actualA: number;
  actualB: number;
  forecastErrorPct: number;
  avgLeadTimeDays: number;
  avgReliabilityPct: number;
  avgSustainability: number;
  avgQuality: number;
  totalCo2: number;
  cottonAllocatedKg: number;
  nylonAllocatedKg: number;
  cottonRequiredKg: number;
  nylonRequiredKg: number;
  lateDeliveries: number;
  totalDeliveries: number;
}

export interface M1SimulationResult {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: M1ScoreBreakdown;
  kpis: M1KPIs;
  validationFlags: string[];
  feedback: string[];
  hasReport: boolean;
  forecastMethod: string;
  forecastMethodA: string;
  forecastMethodB: string;
}

// ============================================================
// MAIN SIMULATION FUNCTION
// ============================================================

export function runModule1Simulation(
  userId: number,
  decisions: M1Decisions,
  runNumber: number,
  seedOffset: number = 1000,
): M1SimulationResult {
  // 1. DETERMINISTIC SEED
  const moduleOffset = 100;
  const seedVal = (stableHash(String(userId)) + seedOffset + moduleOffset + runNumber) >>> 0;
  const rand = mulberry32(seedVal);

  // 2. EXTRACT & VALIDATE DECISIONS
  let forecastA = Math.max(1, decisions.forecastA || 1);
  let forecastB = Math.max(1, decisions.forecastB || 1);
  const legacyMethod = decisions.forecastMethod || "unknown";
  const forecastMethodA = decisions.forecastMethodA ?? legacyMethod;
  const forecastMethodB = decisions.forecastMethodB ?? legacyMethod;
  const forecastMethod = forecastMethodA;
  const hasReport = decisions.purchaseReport || false;
  const allocations = decisions.allocations || [];
  const justification = decisions.justification || "";

  const validationFlags: string[] = [];
  if (decisions.forecastA <= 0) validationFlags.push("SKU A forecast must be positive");
  if (decisions.forecastB <= 0) validationFlags.push("SKU B forecast must be positive");

  // 3. SIMULATE ACTUAL DEMAND
  const sigmaA = hasReport ? DEMAND_SIGMA_A_WITH_REPORT : DEMAND_SIGMA_A;
  const sigmaB = hasReport ? DEMAND_SIGMA_B_WITH_REPORT : DEMAND_SIGMA_B;

  const actualA = Math.max(1, Math.round(normalRandom(forecastA, sigmaA * forecastA, rand)));
  const actualB = Math.max(1, Math.round(normalRandom(forecastB, sigmaB * forecastB, rand)));

  const forecastErrorA = Math.abs(actualA - forecastA) / forecastA;
  const forecastErrorB = Math.abs(actualB - forecastB) / forecastB;
  const avgForecastError = (forecastErrorA + forecastErrorB) / 2;

  // 4. MATERIAL REQUIREMENTS
  const reqCottonKg = forecastA * SKU_A_COTTON_KG * SKU_A_SCRAP_FACTOR;
  const reqNylonKg = forecastB * SKU_B_NYLON_KG * SKU_B_SCRAP_FACTOR;

  // 5. PROCESS ALLOCATIONS
  let totalMaterialCost = 0;
  let totalTransportCost = 0;
  let totalOrderCost = 0;
  let totalCottonAllocated = 0;
  let totalNylonAllocated = 0;
  let weightedLeadTime = 0;
  let weightedReliability = 0;
  let weightedSustainability = 0;
  let weightedQuality = 0;
  let totalKg = 0;
  let totalCo2 = 0;
  let lateDeliveries = 0;
  let totalDeliveries = 0;

  for (const alloc of allocations) {
    const kgAllocated = alloc.kg || 0;
    if (kgAllocated <= 0) continue;

    const supplier = SUPPLIERS[alloc.supplierId];
    if (!supplier) {
      validationFlags.push(`Invalid supplier: ${alloc.supplierId}`);
      continue;
    }

    const region = supplier.region;
    const regionModes = TRANSPORT_MODES[region];
    if (!regionModes || !regionModes[alloc.transportMode]) {
      validationFlags.push(
        `Invalid transport mode "${alloc.transportMode}" for ${supplier.name} (${region})`,
      );
      continue;
    }

    const transport = regionModes[alloc.transportMode];

    let basePrice: number;
    if (alloc.materialType === "cotton") {
      basePrice = supplier.cottonPrice;
      totalCottonAllocated += kgAllocated;
    } else if (alloc.materialType === "nylon") {
      basePrice = supplier.nylonPrice;
      totalNylonAllocated += kgAllocated;
    } else {
      validationFlags.push(`Invalid material type: ${alloc.materialType}`);
      continue;
    }

    // Quantity discounts
    let discount = 0;
    if (alloc.materialType === "cotton") {
      if (kgAllocated >= 50000) discount = 0.04;
      else if (kgAllocated >= 20000) discount = 0.02;
    } else {
      if (kgAllocated >= 25000) discount = 0.04;
      else if (kgAllocated >= 10000) discount = 0.02;
    }

    const effectivePrice = basePrice * (1 - discount);
    const assurance = ASSURANCE_PACKAGES[alloc.assurancePackage] ?? ASSURANCE_PACKAGES.standard;
    const finalPrice = effectivePrice * (1 + assurance.pricePremium);

    const numBatches = Math.max(1, Math.round(alloc.numBatches || 1));

    const materialCost = kgAllocated * finalPrice;
    const transportCost = kgAllocated * transport.costPerKg;
    const orderCost = numBatches * ORDER_COST_PER_BATCH;

    totalMaterialCost += materialCost;
    totalTransportCost += transportCost;
    totalOrderCost += orderCost;

    const effectiveReliability = Math.min(
      0.99,
      supplier.reliabilityBase + transport.reliabilityBonus + assurance.reliabilityBoost,
    );

    totalKg += kgAllocated;
    weightedLeadTime += supplier.leadTimeMean * kgAllocated;
    weightedReliability += effectiveReliability * kgAllocated;
    weightedSustainability += supplier.sustainability * kgAllocated;
    weightedQuality += supplier.quality * kgAllocated;
    totalCo2 += kgAllocated * transport.co2;

    totalDeliveries += numBatches;
    for (let b = 0; b < numBatches; b++) {
      if (rand() > effectiveReliability) {
        lateDeliveries++;
      }
    }
  }

  const numSuppliersUsed = allocations.filter((a) => (a.kg || 0) > 0).length;
  if (numSuppliersUsed === 0) validationFlags.push("No supplier allocations provided");

  if (hasReport) totalOrderCost += MARKET_REPORT_COST;

  // 6. PENALTIES
  let lateDeliveryPenalty = 0;
  if (lateDeliveries > 0) {
    lateDeliveryPenalty = lateDeliveries * 500;
  }

  let totalProcurementCost = totalMaterialCost + totalTransportCost + totalOrderCost + lateDeliveryPenalty;

  const avgLeadTime = totalKg > 0 ? weightedLeadTime / totalKg : 0;
  const avgReliability = totalKg > 0 ? weightedReliability / totalKg : 0;
  const avgSustainability = totalKg > 0 ? weightedSustainability / totalKg : 0;
  const avgQuality = totalKg > 0 ? weightedQuality / totalKg : 0;

  const cottonCoverage = reqCottonKg > 0 ? totalCottonAllocated / reqCottonKg : 0;
  const nylonCoverage = reqNylonKg > 0 ? totalNylonAllocated / reqNylonKg : 0;

  if (cottonCoverage < 1.0) {
    validationFlags.push(
      `Cotton allocation insufficient: ${(cottonCoverage * 100).toFixed(1)}% of required`,
    );
  }
  if (nylonCoverage < 1.0) {
    validationFlags.push(
      `Nylon allocation insufficient: ${(nylonCoverage * 100).toFixed(1)}% of required`,
    );
  }

  // 7. GRADING (55 POINTS)

  // Category 1: Forecasting & Planning (15 pts)
  let forecastingScore: number;
  if (avgForecastError <= 0.05) forecastingScore = 15;
  else if (avgForecastError <= 0.10) forecastingScore = 12;
  else if (avgForecastError <= 0.15) forecastingScore = 9;
  else forecastingScore = 6;

  const advancedMethods = ["linear_regression", "exponential_smoothing"];
  if (
    (advancedMethods.includes(forecastMethodA) || advancedMethods.includes(forecastMethodB)) &&
    forecastingScore > 0
  ) {
    forecastingScore = Math.min(15, forecastingScore + 1);
  }

  // Category 2: Supplier Selection (12 pts)
  let supplierMethodScore: number;
  if (numSuppliersUsed >= 2 && numSuppliersUsed <= 4) supplierMethodScore = 12;
  else if (numSuppliersUsed === 1) supplierMethodScore = 7;
  else if (numSuppliersUsed > 4) supplierMethodScore = 9;
  else supplierMethodScore = 0;

  // Category 3: Cost/Service/Risk Trade-offs (12 pts)
  let costScore: number;
  if (totalProcurementCost < 30000) costScore = 6;
  else if (totalProcurementCost < 35000) costScore = 5;
  else if (totalProcurementCost < 40000) costScore = 4;
  else costScore = 2;

  let reliabilityScore: number;
  if (avgReliability >= 0.96) reliabilityScore = 6;
  else if (avgReliability >= 0.94) reliabilityScore = 5;
  else if (avgReliability >= 0.92) reliabilityScore = 3;
  else reliabilityScore = 2;

  const tradeoffsScore = costScore + reliabilityScore;

  // Category 4: Quality + Sustainability (8 pts)
  let qualityScore: number;
  if (avgQuality >= 4.2) qualityScore = 4;
  else if (avgQuality >= 4.0) qualityScore = 3;
  else if (avgQuality >= 3.5) qualityScore = 2;
  else qualityScore = 1;

  let sustainabilityScore: number;
  if (avgSustainability >= 4.2) sustainabilityScore = 4;
  else if (avgSustainability >= 4.0) sustainabilityScore = 3;
  else if (avgSustainability >= 3.5) sustainabilityScore = 2;
  else sustainabilityScore = 1;

  const qualitySustainabilityScore = qualityScore + sustainabilityScore;

  // Category 5: Validity + Justification (8 pts)
  let validityPoints = 5;
  if (validationFlags.length > 0) {
    validityPoints = Math.max(0, 5 - validationFlags.length);
  }
  if (cottonCoverage < 0.95 || nylonCoverage < 0.95) {
    validityPoints = Math.max(0, validityPoints - 2);
  }

  let justificationPoints: number;
  if (justification.length >= 500) justificationPoints = 3;
  else if (justification.length >= 300) justificationPoints = 2;
  else if (justification.length >= 150) justificationPoints = 1;
  else justificationPoints = 0;

  const validityJustificationScore = validityPoints + justificationPoints;

  const scoreBreakdown: M1ScoreBreakdown = {
    forecasting: forecastingScore,
    supplierMethod: supplierMethodScore,
    tradeoffs: tradeoffsScore,
    qualitySustainability: qualitySustainabilityScore,
    validityJustification: validityJustificationScore,
  };

  const totalScore = Math.round(
    forecastingScore + supplierMethodScore + tradeoffsScore + qualitySustainabilityScore + validityJustificationScore,
  );

  let letterGrade: string;
  if (totalScore >= 51) letterGrade = "A";
  else if (totalScore >= 45) letterGrade = "B";
  else if (totalScore >= 38) letterGrade = "C";
  else if (totalScore >= 30) letterGrade = "D";
  else letterGrade = "F";

  // 8. FEEDBACK
  const feedback: string[] = [];

  if (avgForecastError > 0.10) {
    const neitherIsAdvanced =
      !advancedMethods.includes(forecastMethodA) && !advancedMethods.includes(forecastMethodB);
    const suggestion = neitherIsAdvanced
      ? "linear regression or exponential smoothing"
      : advancedMethods.includes(forecastMethodA)
        ? "exponential smoothing for SKU B"
        : "linear regression for SKU A";
    feedback.push(
      `Forecasting error was ${(avgForecastError * 100).toFixed(1)}%. Consider using ${suggestion} for better accuracy.`,
    );
  }
  if (totalProcurementCost > 35000) {
    feedback.push(
      `Total procurement cost (€${Math.round(totalProcurementCost).toLocaleString()}) is high. Consider nearshore suppliers or rail transport to reduce costs.`,
    );
  }
  if (avgReliability < 0.94) {
    feedback.push(
      `Average reliability (${(avgReliability * 100).toFixed(1)}%) is below target. Consider Priority/Premium assurance packages.`,
    );
  }
  if (lateDeliveries > 0) {
    feedback.push(
      `${lateDeliveries} late deliveries incurred €${lateDeliveryPenalty.toLocaleString()} in penalties.`,
    );
  }
  if (avgSustainability < 4.0) {
    feedback.push(
      `Sustainability index (${avgSustainability.toFixed(1)}/5.0) could be improved by selecting certified suppliers (GOTS, OEKO-TEX).`,
    );
  }

  return {
    score: totalScore,
    maxScore: 55,
    letterGrade,
    scoreBreakdown,
    kpis: {
      totalProcurementCost: Math.round(totalProcurementCost * 100) / 100,
      materialCost: Math.round(totalMaterialCost * 100) / 100,
      transportCost: Math.round(totalTransportCost * 100) / 100,
      orderCost: Math.round(totalOrderCost * 100) / 100,
      lateDeliveryPenalty: Math.round(lateDeliveryPenalty * 100) / 100,
      forecastA,
      forecastB,
      actualA,
      actualB,
      forecastErrorPct: Math.round(avgForecastError * 1000) / 10,
      avgLeadTimeDays: Math.round(avgLeadTime * 10) / 10,
      avgReliabilityPct: Math.round(avgReliability * 1000) / 10,
      avgSustainability: Math.round(avgSustainability * 100) / 100,
      avgQuality: Math.round(avgQuality * 100) / 100,
      totalCo2: Math.round(totalCo2 * 10) / 10,
      cottonAllocatedKg: Math.round(totalCottonAllocated * 10) / 10,
      nylonAllocatedKg: Math.round(totalNylonAllocated * 10) / 10,
      cottonRequiredKg: Math.round(reqCottonKg * 10) / 10,
      nylonRequiredKg: Math.round(reqNylonKg * 10) / 10,
      lateDeliveries,
      totalDeliveries,
    },
    validationFlags,
    feedback,
    hasReport,
    forecastMethod,
    forecastMethodA,
    forecastMethodB,
  };
}
