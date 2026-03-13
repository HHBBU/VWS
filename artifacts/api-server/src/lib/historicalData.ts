/**
 * Historical demand data generator for Module 1
 * Generates 24 months of deterministic SKU A & B demand
 * Uses Mulberry32 PRNG seeded at 12345 for reproducibility
 */

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalRandom(rand: () => number): number {
  const u1 = Math.max(1e-10, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface HistoricalDataPoint {
  month: number;
  skuA: number;
  skuB: number;
}

export interface HistoricalData {
  dataPoints: HistoricalDataPoint[];
  avgA: number;
  avgB: number;
  trendA: number;
  trendB: number;
}

export function generateHistoricalDemand(): HistoricalData {
  const rand = mulberry32(12345);

  const BASE_A = 15000;
  const TREND_A = 150;
  const SEASONAL_AMP_A = 2000;
  const NOISE_SD_A = 800;

  const BASE_B = 8000;
  const TREND_B = 50;
  const SEASONAL_AMP_B = 800;
  const NOISE_SD_B = 400;

  const dataPoints: HistoricalDataPoint[] = [];

  for (let month = 1; month <= 24; month++) {
    const trendA = BASE_A + TREND_A * month;
    const seasonalA = SEASONAL_AMP_A * Math.sin((2 * Math.PI * month) / 12);
    const noiseA = normalRandom(rand) * NOISE_SD_A;
    const skuA = Math.max(0, Math.round(trendA + seasonalA + noiseA));

    const trendB = BASE_B + TREND_B * month;
    const seasonalB = SEASONAL_AMP_B * Math.sin((2 * Math.PI * month) / 12);
    const noiseB = normalRandom(rand) * NOISE_SD_B;
    const skuB = Math.max(0, Math.round(trendB + seasonalB + noiseB));

    dataPoints.push({ month, skuA, skuB });
  }

  const avgA = Math.round(dataPoints.reduce((s, d) => s + d.skuA, 0) / 24);
  const avgB = Math.round(dataPoints.reduce((s, d) => s + d.skuB, 0) / 24);

  return { dataPoints, avgA, avgB, trendA: TREND_A, trendB: TREND_B };
}

let _cached: HistoricalData | null = null;
export function getHistoricalData(): HistoricalData {
  if (!_cached) _cached = generateHistoricalDemand();
  return _cached;
}
