import { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RunData {
  runNumber: number;
  score: number;
  letterGrade: string;
  isFinal: boolean;
  createdAt: string;
  kpi?: Record<string, unknown> | null;
}

interface AxisDef {
  key: string;
  label: string;
  normalize: (kpi: Record<string, unknown>) => number;
  rawLabel: (kpi: Record<string, unknown>) => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const num = (v: unknown): number => (typeof v === "number" && isFinite(v) ? v : 0);

// ─── Axis definitions per module ──────────────────────────────────────────────

const M1_AXES: AxisDef[] = [
  {
    key: "costEff",
    label: "Cost Efficiency",
    normalize: (k) => clamp(100 - (num(k.totalProcurementCost) / 120000) * 100),
    rawLabel: (k) => `€${Math.round(num(k.totalProcurementCost)).toLocaleString()}`,
  },
  {
    key: "reliability",
    label: "Reliability",
    normalize: (k) => clamp(num(k.avgReliabilityPct)),
    rawLabel: (k) => `${num(k.avgReliabilityPct).toFixed(1)}%`,
  },
  {
    key: "quality",
    label: "Quality",
    normalize: (k) => clamp((num(k.avgQuality) / 5) * 100),
    rawLabel: (k) => `${num(k.avgQuality).toFixed(2)}/5`,
  },
  {
    key: "sustainability",
    label: "Sustainability",
    normalize: (k) => clamp((num(k.avgSustainability) / 5) * 100),
    rawLabel: (k) => `${num(k.avgSustainability).toFixed(2)}/5`,
  },
  {
    key: "forecastAcc",
    label: "Forecast Accuracy",
    normalize: (k) => clamp(100 - num(k.forecastErrorPct) * 4),
    rawLabel: (k) => `${num(k.forecastErrorPct).toFixed(1)}% error`,
  },
  {
    key: "speed",
    label: "Speed (Lead Time)",
    normalize: (k) => clamp(100 - (num(k.avgLeadTimeDays) / 35) * 100),
    rawLabel: (k) => `${num(k.avgLeadTimeDays).toFixed(1)} days`,
  },
];

const M2_AXES: AxisDef[] = [
  {
    key: "serviceLevel",
    label: "Service Level",
    normalize: (k) => {
      const sl = num(k.serviceLevel);
      return clamp(sl > 1 ? sl : sl * 100);
    },
    rawLabel: (k) => {
      const sl = num(k.serviceLevel);
      return sl > 1 ? `${sl.toFixed(1)}%` : `${(sl * 100).toFixed(1)}%`;
    },
  },
  {
    key: "utilization",
    label: "Utilization Score",
    normalize: (k) => {
      const raw = num(k.capacityUtilization ?? k.utilizationPct);
      const uPct = raw > 1 ? raw : raw * 100;
      // 80–95% is the sweet spot (full score); penalise over/under
      if (uPct >= 80 && uPct <= 95) return 100;
      if (uPct < 80) return clamp(uPct * 1.25);
      return clamp(100 - (uPct - 95) * 5);
    },
    rawLabel: (k) => {
      const raw = num(k.capacityUtilization ?? k.utilizationPct);
      const uPct = raw > 1 ? raw : raw * 100;
      return `${uPct.toFixed(1)}%`;
    },
  },
  {
    key: "costScore",
    label: "Cost Score",
    normalize: (k) => clamp(100 - (num(k.totalCost) / 150000) * 100),
    rawLabel: (k) => `€${Math.round(num(k.totalCost)).toLocaleString()}`,
  },
  {
    key: "qualityScore",
    label: "Quality (Low Scrap)",
    normalize: (k) => clamp(100 - (num(k.scrapReworkCost) / 25000) * 100),
    rawLabel: (k) => `€${Math.round(num(k.scrapReworkCost)).toLocaleString()} scrap`,
  },
  {
    key: "leanScore",
    label: "Lean Investment",
    normalize: (k) => clamp((num(k.totalInvestmentCost) / 80000) * 100),
    rawLabel: (k) => `€${Math.round(num(k.totalInvestmentCost)).toLocaleString()} invested`,
  },
];

const M3_AXES: AxisDef[] = [
  {
    key: "fillRate",
    label: "Fill Rate",
    normalize: (k) => clamp(num(k.fillRate)),
    rawLabel: (k) => `${num(k.fillRate).toFixed(1)}%`,
  },
  {
    key: "profitMargin",
    label: "Profit Margin",
    normalize: (k) => clamp(num(k.profitMarginPct) * 4), // 25% margin → 100
    rawLabel: (k) => `${num(k.profitMarginPct).toFixed(1)}%`,
  },
  {
    key: "costScore",
    label: "Cost Score",
    normalize: (k) => clamp(100 - (num(k.totalCost) / 250000) * 100),
    rawLabel: (k) => `€${Math.round(num(k.totalCost)).toLocaleString()}`,
  },
  {
    key: "carbonScore",
    label: "Carbon Score",
    normalize: (k) => clamp(100 - (num(k.totalCarbonKg) / 80000) * 100),
    rawLabel: (k) => `${Math.round(num(k.totalCarbonKg)).toLocaleString()} kg CO₂`,
  },
  {
    key: "stockoutScore",
    label: "Stockout Score",
    normalize: (k) => clamp(100 - (num(k.totalStockouts) / 300) * 100),
    rawLabel: (k) => `${Math.round(num(k.totalStockouts))} units lost`,
  },
];

const MODULE_AXES: Record<string, AxisDef[]> = { M1: M1_AXES, M2: M2_AXES, M3: M3_AXES };

// Distinct colors, ordered by run recency (last run gets the first/boldest color)
const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#f43f5e", "#0ea5e9"];

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, rawMap }: {
  active?: boolean;
  payload?: any[];
  rawMap: Record<string, Record<string, string>>;
}) {
  if (!active || !payload?.length) return null;
  const axisLabel = payload[0]?.payload?.subject as string;
  return (
    <div className="bg-background border border-border rounded-xl p-3 shadow-xl text-xs min-w-[200px]">
      <p className="font-semibold text-sm mb-2">{axisLabel}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-semibold">
              {rawMap[entry.name]?.[axisLabel] ?? `${Number(entry.value).toFixed(0)}/100`}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 border-t border-border pt-1">
        All axes normalized 0–100 for comparison
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface MultiRunRadarChartProps {
  runs: RunData[];
  moduleKey: "M1" | "M2" | "M3";
  maxScore?: number;
}

export function MultiRunRadarChart({ runs, moduleKey, maxScore = 52 }: MultiRunRadarChartProps) {
  const axes = MODULE_AXES[moduleKey] ?? M1_AXES;

  // Only include runs that have kpi data
  const validRuns = useMemo(
    () => runs.filter((r) => r.kpi && Object.keys(r.kpi).length > 0),
    [runs],
  );

  if (validRuns.length < 2) {
    if (validRuns.length === 1) {
      return (
        <Card className="border-dashed border-primary/30 bg-primary/3">
          <CardContent className="py-6 text-center">
            <BarChart3 className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">
              Complete a second practice run to unlock the run-comparison radar chart.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  // Assign colors: most recent run = first color (most prominent)
  const sortedRuns = [...validRuns].sort((a, b) => a.runNumber - b.runNumber);
  const runMeta = sortedRuns.map((r, i) => ({
    run: r,
    name: r.isFinal ? `Final (#${r.runNumber})` : `Run #${r.runNumber}`,
    color: PALETTE[i % PALETTE.length],
    isLatest: i === sortedRuns.length - 1,
  }));

  // Build radar data: one row per axis
  const radarData = axes.map((axis) => {
    const row: Record<string, string | number> = { subject: axis.label };
    runMeta.forEach(({ run, name }) => {
      row[name] = run.kpi ? axis.normalize(run.kpi) : 0;
    });
    return row;
  });

  // Raw labels map: runName → axisLabel → raw string
  const rawMap: Record<string, Record<string, string>> = {};
  runMeta.forEach(({ run, name }) => {
    rawMap[name] = {};
    axes.forEach((axis) => {
      rawMap[name][axis.label] = run.kpi ? axis.rawLabel(run.kpi) : "—";
    });
  });

  const moduleLabels: Record<string, { title: string; desc: string }> = {
    M1: {
      title: "Run Comparison — Procurement KPIs",
      desc: "Cost Efficiency, Reliability, Quality, Sustainability, Forecast Accuracy, Speed — all normalized 0–100",
    },
    M2: {
      title: "Run Comparison — Production KPIs",
      desc: "Service Level, Utilization, Cost, Scrap Quality, Lean Investment — all normalized 0–100",
    },
    M3: {
      title: "Run Comparison — Distribution KPIs",
      desc: "Fill Rate, Profit Margin, Cost, Carbon Footprint, Stockouts — all normalized 0–100",
    },
  };
  const { title, desc } = moduleLabels[moduleKey] ?? moduleLabels.M1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid gridType="polygon" stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickCount={5}
            />
            {runMeta.map(({ name, color, isLatest }) => (
              <Radar
                key={name}
                name={name}
                dataKey={name}
                stroke={color}
                fill={color}
                fillOpacity={isLatest ? 0.22 : 0.08}
                strokeWidth={isLatest ? 2.5 : 1.5}
                dot={isLatest}
              />
            ))}
            <Tooltip content={<CustomTooltip rawMap={rawMap} />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontWeight: entry.payload?.isLatest ? 700 : 400 }}>
                  {value}
                  {runMeta.find(m => m.name === value)?.isLatest ? " ★" : ""}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-1">
          ★ = most recent run · Outer ring = 100% · Hover axes for raw values
        </p>
      </CardContent>
    </Card>
  );
}
