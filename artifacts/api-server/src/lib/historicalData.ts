/**
 * Historical demand data for Module 1 — Static 30-Year Dataset
 * Matches the student guide's table exactly (Years 1–30).
 * Students forecast Year 31.
 */

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

const SKU_A_DATA = [
  8100, 8450, 8700, 9050, 9200, 9600, 9750, 10100, 10350, 10650,
  10900, 11200, 11450, 11750, 12050, 12350, 12650, 12900, 13200, 13500,
  13850, 14150, 14450, 14800, 15050, 15350, 15650, 16050, 16350, 16700,
];

const SKU_B_DATA = [
  9150, 8750, 8900, 9200, 9000, 8750, 9250, 9050, 8850, 9300,
  9000, 8800, 9150, 8950, 9200, 9050, 8900, 9250, 8850, 9150,
  8950, 9100, 8800, 9200, 9000, 8850, 8800, 9000, 9200, 9000,
];

function calcTrend(values: number[]): number {
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * values[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
  return Math.round((n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX));
}

export function generateHistoricalDemand(): HistoricalData {
  const dataPoints: HistoricalDataPoint[] = SKU_A_DATA.map((skuA, i) => ({
    month: i + 1,
    skuA,
    skuB: SKU_B_DATA[i],
  }));

  const avgA = Math.round(SKU_A_DATA.reduce((a, b) => a + b, 0) / SKU_A_DATA.length);
  const avgB = Math.round(SKU_B_DATA.reduce((a, b) => a + b, 0) / SKU_B_DATA.length);
  const trendA = calcTrend(SKU_A_DATA);
  const trendB = calcTrend(SKU_B_DATA);

  return { dataPoints, avgA, avgB, trendA, trendB };
}

let _cached: HistoricalData | null = null;
export function getHistoricalData(): HistoricalData {
  if (!_cached) _cached = generateHistoricalDemand();
  return _cached;
}
