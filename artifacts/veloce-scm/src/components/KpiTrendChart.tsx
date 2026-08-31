import { useState, type ReactNode } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RunData {
  runNumber: number;
  score: number;
  letterGrade: string;
  isFinal: boolean;
  createdAt: string;
  kpi?: Record<string, unknown> | null;
}

interface KpiTrendChartProps {
  runs: RunData[];
  maxScore?: number;
  moduleKey?: "M1" | "M2" | "M3";
}

// ─── Per-module config ────────────────────────────────────────────────────────

interface ModuleConfig {
  primaryKey: string;
  secondaryKey: string;
  tertiaryKey?: string;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel?: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  primaryAxisLabel: string;
  secondaryAxisLabel: string;
  referenceValue: number;
  referenceLabel: string;
  tertiaryReferenceValue?: number;
  tertiaryReferenceLabel?: string;
  primaryFormat: (v: number) => string;
  secondaryFormat: (v: number) => string;
  secondaryTickFormat: (v: number) => string;
  tertiaryFormat?: (v: number) => string;
  primaryDeltaDirection: "higher" | "lower" | "target" | "range";
  secondaryDeltaDirection: "higher" | "lower" | "target" | "range";
  tertiaryDeltaDirection?: "higher" | "lower" | "target" | "range";
  primaryHealthyRange?: [number, number];
  secondaryHealthyRange?: [number, number];
  tertiaryHealthyRange?: [number, number];
  description: string;
  legendNote: string;
  getPrimary: (kpi: Record<string, unknown>) => number;
  getSecondary: (kpi: Record<string, unknown>) => number;
  getTertiary?: (kpi: Record<string, unknown>) => number;
}

function num(v: unknown): number {
  return typeof v === "number" && isFinite(v) ? v : 0;
}

const MODULE_CONFIG: Record<string, ModuleConfig> = {
  M1: {
    primaryKey: "reliability",
    secondaryKey: "procurementCost",
    primaryLabel: "Supplier Reliability %",
    secondaryLabel: "Total Procurement Cost (€)",
    primaryColor: "#3b82f6",
    secondaryColor: "#f59e0b",
    primaryAxisLabel: "Reliability %",
    secondaryAxisLabel: "Procurement Cost €",
    referenceValue: 95,
    referenceLabel: "Target 95%",
    primaryFormat: (v) => `${v.toFixed(1)}%`,
    secondaryFormat: (v) => `€${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    secondaryTickFormat: (v) => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`,
    primaryDeltaDirection: "higher",
    secondaryDeltaDirection: "lower",
    description: "Supplier Reliability % and Total Procurement Cost across all your M1 runs",
    legendNote: "Blue line = Supplier Reliability · Dashed amber = Procurement Cost",
    getPrimary: (kpi) => +(num(kpi.avgReliabilityPct)).toFixed(2),
    getSecondary: (kpi) => Math.round(num(kpi.totalProcurementCost)),
  },
  M2: {
    primaryKey: "utilization",
    secondaryKey: "scrapReworkCost",
    tertiaryKey: "serviceLevel",
    primaryLabel: "Utilization %",
    secondaryLabel: "Scrap/Rework Cost (€)",
    tertiaryLabel: "Service Level %",
    primaryColor: "#8b5cf6",
    secondaryColor: "#ef4444",
    tertiaryColor: "#10b981",
    primaryAxisLabel: "Utilization %",
    secondaryAxisLabel: "Scrap/Rework Cost €",
    referenceValue: 85,
    referenceLabel: "Target 85%",
    tertiaryReferenceValue: 95,
    tertiaryReferenceLabel: "Target 95%",
    primaryFormat: (v) => `${v.toFixed(1)}%`,
    secondaryFormat: (v) => `€${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    secondaryTickFormat: (v) => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`,
    primaryDeltaDirection: "range",
    primaryHealthyRange: [80, 95],
    secondaryDeltaDirection: "lower",
    tertiaryDeltaDirection: "higher",
    description: "Utilization %, Service Level, and Scrap/Rework Cost across all your M2 runs",
    legendNote: "Purple = Utilization · Green = Service Level · Dashed red = Scrap/Rework Cost",
    getPrimary: (kpi) => +(num(kpi.capacityUtilization)).toFixed(2),
    getSecondary: (kpi) => Math.round(num(kpi.scrapReworkCost)),
    getTertiary: (kpi) => +(num(kpi.serviceLevel)).toFixed(2),
  },
  M3: {
    primaryKey: "fillRate",
    secondaryKey: "totalCost",
    tertiaryKey: "profitMargin",
    primaryLabel: "Fill Rate %",
    secondaryLabel: "Total Cost (€)",
    tertiaryLabel: "Profit Margin %",
    primaryColor: "#3b82f6",
    secondaryColor: "#f59e0b",
    tertiaryColor: "#10b981",
    primaryAxisLabel: "Fill Rate / Margin %",
    secondaryAxisLabel: "Total Cost €",
    referenceValue: 94,
    referenceLabel: "Target 94%",
    tertiaryReferenceValue: 15,
    tertiaryReferenceLabel: "Target 15%",
    primaryFormat: (v) => `${v.toFixed(1)}%`,
    secondaryFormat: (v) => `€${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    secondaryTickFormat: (v) => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`,
    tertiaryFormat: (v) => `${v.toFixed(1)}%`,
    primaryDeltaDirection: "higher",
    secondaryDeltaDirection: "lower",
    tertiaryDeltaDirection: "higher",
    description: "Fill Rate, Profit Margin, and Total Cost across all your M3 runs",
    legendNote: "Blue = Fill Rate · Green = Profit Margin · Dashed amber = Total Cost",
    getPrimary: (kpi) => +(num(kpi.fillRate)).toFixed(2),
    getSecondary: (kpi) => Math.round(num(kpi.totalCost)),
    getTertiary: (kpi) => +(num(kpi.profitMarginPct)).toFixed(2),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: unknown, decimals = 0): string {
  if (v == null || typeof v !== "number") return "—";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function gradeColor(grade: string): string {
  if (grade === "A") return "text-emerald-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-amber-600";
  return "text-red-600";
}

type DeltaTone = "improved" | "regressed" | "neutral";
type DeltaDirection = "higher" | "lower" | "target" | "range";

function distanceToRange(value: number, [min, max]: [number, number]): number {
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}

function deltaTone(
  previous: number,
  current: number,
  direction: DeltaDirection,
  target: number,
  healthyRange?: [number, number],
): DeltaTone {
  const delta = current - previous;
  if (delta === 0) return "neutral";
  if (direction === "higher") return delta > 0 ? "improved" : "regressed";
  if (direction === "lower") return delta < 0 ? "improved" : "regressed";
  if (direction === "range" && healthyRange) {
    const previousDistance = distanceToRange(previous, healthyRange);
    const currentDistance = distanceToRange(current, healthyRange);
    if (currentDistance === previousDistance) return "neutral";
    return currentDistance < previousDistance ? "improved" : "regressed";
  }

  const previousDistance = Math.abs(previous - target);
  const currentDistance = Math.abs(current - target);
  if (currentDistance === previousDistance) return "neutral";
  return currentDistance < previousDistance ? "improved" : "regressed";
}

function deltaToneClass(tone: DeltaTone): string {
  if (tone === "improved") return "text-emerald-600 dark:text-emerald-400";
  if (tone === "regressed") return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function formatDelta(
  previous: number | null,
  current: number,
  formatter: (v: number) => string,
  direction: DeltaDirection,
  target: number,
  healthyRange?: [number, number],
): ReactNode {
  if (previous == null) {
    return <span className="text-muted-foreground">First run</span>;
  }

  const delta = current - previous;
  if (delta === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const tone = deltaTone(previous, current, direction, target, healthyRange);
  const arrow = delta > 0 ? "↑" : "↓";
  const sign = delta > 0 ? "+" : "−";
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${deltaToneClass(tone)}`}>
      <span aria-hidden="true">{arrow}</span>
      <span>{sign}{formatter(Math.abs(delta))}</span>
      <span className="sr-only">
        {tone === "improved" ? " improvement" : tone === "regressed" ? " regression" : " neutral change"}
      </span>
    </span>
  );
}

function KpiDeltaTable({
  chartData,
  sorted,
  cfg,
}: {
  chartData: Record<string, unknown>[];
  sorted: RunData[];
  cfg: ModuleConfig;
}) {
  const columns = [
    {
      key: cfg.primaryKey,
      label: cfg.primaryLabel,
      format: cfg.primaryFormat,
      direction: cfg.primaryDeltaDirection,
      target: cfg.referenceValue,
      healthyRange: cfg.primaryHealthyRange,
    },
    {
      key: cfg.secondaryKey,
      label: cfg.secondaryLabel,
      format: cfg.secondaryFormat,
      direction: cfg.secondaryDeltaDirection,
      target: 0,
      healthyRange: cfg.secondaryHealthyRange,
    },
    ...(cfg.tertiaryKey && cfg.getTertiary && cfg.tertiaryFormat
      ? [{
          key: cfg.tertiaryKey,
          label: cfg.tertiaryLabel ?? cfg.tertiaryKey,
          format: cfg.tertiaryFormat,
          direction: cfg.tertiaryDeltaDirection ?? "higher" as DeltaDirection,
          target: cfg.tertiaryReferenceValue ?? 0,
          healthyRange: cfg.tertiaryHealthyRange,
        }]
      : []),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Run-over-run KPI summary</h3>
          <p className="text-[11px] text-muted-foreground">Changes are compared with the previous scored run.</p>
        </div>
        <p className="hidden sm:block text-[10px] text-muted-foreground whitespace-nowrap">
          <span className="text-emerald-600 dark:text-emerald-400">Green = improvement</span>
          {" · "}
          <span className="text-red-600 dark:text-red-400">Red = regression</span>
        </p>
      </div>
      <div
        className="overflow-x-auto rounded-lg border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        role="region"
        tabIndex={0}
        data-testid="kpi-delta-table-scroll-region"
        aria-label="Run-over-run KPI summary table. Scroll horizontally to view all columns."
        aria-describedby="kpi-delta-scroll-instructions"
      >
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-muted/40">
            <tr className="border-b border-border/60">
              <th scope="col" rowSpan={2} className="px-3 py-2 text-left font-medium text-muted-foreground">Run</th>
              {columns.map((column) => (
                <th key={column.key} scope="colgroup" colSpan={2} className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {column.label}
                </th>
              ))}
              <th scope="col" rowSpan={2} className="px-3 py-2 text-left font-medium text-muted-foreground">Grade</th>
            </tr>
            <tr className="border-b border-border/40 text-[10px] text-muted-foreground">
              {columns.flatMap((column) => [
                <th key={`${column.key}-value`} scope="col" className="px-3 py-1 text-left font-normal">Value</th>,
                <th key={`${column.key}-delta`} scope="col" className="px-3 py-1 text-left font-normal">Δ</th>,
              ])}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {chartData.map((row, index) => {
              const previousRow = index > 0 ? chartData[index - 1] : null;
              const run = sorted[index];
              return (
                <tr key={run.runNumber} className="hover:bg-muted/20">
                  <th scope="row" className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                    #{run.runNumber}
                    {run.isFinal && <span className="ml-1 text-emerald-600" title="Final submission">★</span>}
                  </th>
                  {columns.flatMap((column) => {
                    const current = Number(row[column.key]);
                    const previous = previousRow ? Number(previousRow[column.key]) : null;
                    return [
                      <td key={`${run.runNumber}-${column.key}-value`} className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {column.format(current)}
                      </td>,
                      <td key={`${run.runNumber}-${column.key}-delta`} className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {formatDelta(
                          previous,
                          current,
                          column.format,
                          column.direction,
                          column.target,
                          column.healthyRange,
                        )}
                      </td>,
                    ];
                  })}
                  <td className={`px-3 py-2 font-semibold ${gradeColor(run.letterGrade)}`}>{run.letterGrade}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p id="kpi-delta-scroll-instructions" className="sr-only">
        The table may be wider than your screen. Use shift and mouse wheel, or the arrow keys after focusing this region, to scroll horizontally.
      </p>
      <p className="text-[10px] text-muted-foreground sm:hidden">
        <span className="text-emerald-600 dark:text-emerald-400">Green = improvement</span>
        {" · "}
        <span className="text-red-600 dark:text-red-400">Red = regression</span>
      </p>
    </div>
  );
}

// ─── Expanded KPI Detail ──────────────────────────────────────────────────────

function RunKpiDetail({
  run,
  maxScore,
  moduleKey,
}: {
  run: RunData;
  maxScore: number;
  moduleKey: string;
}) {
  if (!run.kpi) return null;
  const kpi = run.kpi;

  let items: { label: string; value: string; color?: string }[] = [];

  if (moduleKey === "M1") {
    const reliability = num(kpi.avgReliabilityPct);
    const cost = num(kpi.totalProcurementCost);
    const transport = num(kpi.transportCost);
    items = [
      {
        label: "Supplier Reliability",
        value: `${reliability.toFixed(1)}%`,
        color: reliability >= 95 ? "text-emerald-600" : reliability >= 90 ? "text-blue-600" : "text-red-600",
      },
      {
        label: "Procurement Cost",
        value: `€${fmt(cost)}`,
      },
      {
        label: "Transport Cost",
        value: `€${fmt(transport)}`,
      },
      {
        label: "Forecast Error",
        value: `${num(kpi.forecastErrorPct).toFixed(1)}%`,
        color: num(kpi.forecastErrorPct) <= 10 ? "text-emerald-600" : "text-red-600",
      },
      {
        label: "Avg Lead Time",
        value: `${num(kpi.avgLeadTimeDays).toFixed(1)}d`,
      },
      {
        label: "Late Deliveries",
        value: `${num(kpi.lateDeliveries)}/${num(kpi.totalDeliveries)}`,
        color: num(kpi.lateDeliveries) === 0 ? "text-emerald-600" : "text-amber-600",
      },
      {
        label: "CO₂ (kg)",
        value: `${fmt(kpi.totalCo2)}`,
      },
      {
        label: "Sustainability",
        value: `${num(kpi.avgSustainability).toFixed(1)}/5`,
      },
    ];
  } else if (moduleKey === "M2") {
    const utilization = num(kpi.capacityUtilization);
    const sl = num(kpi.serviceLevel);
    const scrap = num(kpi.scrapReworkCost);
    items = [
      {
        label: "Utilization",
        value: `${utilization.toFixed(1)}%`,
        color: utilization >= 80 && utilization <= 95 ? "text-emerald-600" : "text-amber-600",
      },
      {
        label: "Service Level",
        value: `${sl.toFixed(1)}%`,
        color: sl >= 95 ? "text-emerald-600" : sl >= 90 ? "text-blue-600" : "text-red-600",
      },
      {
        label: "Scrap/Rework Cost",
        value: `€${fmt(scrap)}`,
        color: scrap === 0 ? "text-emerald-600" : "text-red-600",
      },
      {
        label: "Total Cost",
        value: `€${fmt(kpi.totalCost)}`,
      },
      {
        label: "Capacity Cost",
        value: `€${fmt(kpi.capacityCost)}`,
      },
      {
        label: "Stockout Cost",
        value: `€${fmt(kpi.stockoutCost)}`,
        color: num(kpi.stockoutCost) === 0 ? "text-emerald-600" : "text-red-600",
      },
      {
        label: "Holding Cost",
        value: `€${fmt(kpi.holdingCost)}`,
      },
      {
        label: "Lean/Training Cost",
        value: `€${fmt(kpi.leanCost)}`,
      },
    ];
  } else {
    // M3
    const fill = num(kpi.fillRate);
    const margin = num(kpi.profitMarginPct);
    const stockouts = num(kpi.totalStockouts);
    items = [
      {
        label: "Fill Rate",
        value: `${fill.toFixed(1)}%`,
        color: fill >= 94 ? "text-emerald-600" : fill >= 90 ? "text-blue-600" : "text-red-600",
      },
      {
        label: "Profit Margin",
        value: `${margin.toFixed(1)}%`,
        color: margin >= 15 ? "text-emerald-600" : "text-red-600",
      },
      { label: "Total Cost", value: `€${fmt(kpi.totalCost)}` },
      { label: "Holding Cost", value: `€${fmt(kpi.holdingCost)}` },
      { label: "Transport Cost", value: `€${fmt(kpi.transportCost)}` },
      {
        label: "Stockout Cost",
        value: `€${fmt(kpi.stockoutCost)}`,
        color: stockouts > 0 ? "text-red-600" : "text-emerald-600",
      },
      { label: "Carbon (kg CO₂)", value: `${fmt(kpi.totalCarbonKg)}` },
      { label: "Revenue", value: `€${fmt(kpi.totalRevenue)}` },
    ];
  }

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">
        Run #{run.runNumber} · {format(new Date(run.createdAt), "MMM d, yyyy · h:mm a")}
        {run.isFinal && (
          <Badge className="ml-2 bg-green-500 text-white text-[10px] px-1.5 py-0 align-middle">
            Final
          </Badge>
        )}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map(({ label, value, color }) => (
          <div key={label} className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
            <span className={`text-sm font-semibold ${color ?? "text-foreground"}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Dot (clickable) ───────────────────────────────────────────────────

function ClickableDot(props: any) {
  const { cx, cy, payload, selectedRun, onClick, color } = props;
  if (cx == null || cy == null) return null;
  const isSelected = selectedRun === payload.runNumber;
  const isFinal = payload.isFinal;
  return (
    <g
      onClick={() => onClick(payload.runNumber)}
      style={{ cursor: "pointer" }}
    >
      {(isSelected || isFinal) && (
        <circle
          cx={cx}
          cy={cy}
          r={isFinal ? 10 : 9}
          fill="none"
          stroke={isFinal ? "#22c55e" : color}
          strokeWidth={2}
          opacity={0.5}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 6 : 5}
        fill={isFinal ? "#22c55e" : color}
        stroke="white"
        strokeWidth={2}
      />
    </g>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  cfg,
}: {
  active?: boolean;
  payload?: any[];
  cfg: ModuleConfig;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  function labelFor(dataKey: string): string {
    if (dataKey === cfg.primaryKey) return cfg.primaryLabel;
    if (dataKey === cfg.secondaryKey) return cfg.secondaryLabel;
    if (cfg.tertiaryKey && dataKey === cfg.tertiaryKey) return cfg.tertiaryLabel ?? dataKey;
    return dataKey;
  }

  function formatFor(dataKey: string, value: number): string {
    if (dataKey === cfg.primaryKey) return cfg.primaryFormat(value);
    if (dataKey === cfg.secondaryKey) return cfg.secondaryFormat(value);
    if (cfg.tertiaryKey && dataKey === cfg.tertiaryKey && cfg.tertiaryFormat) return cfg.tertiaryFormat(value);
    return String(value);
  }

  return (
    <div className="bg-background border border-border rounded-xl p-3 shadow-xl text-xs min-w-[200px]">
      <p className="font-semibold text-sm mb-1.5">
        Run #{d.runNumber}
        {d.isFinal && (
          <span className="ml-1.5 inline-block bg-green-100 text-green-700 text-[10px] px-1.5 py-0 rounded">
            Final
          </span>
        )}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {labelFor(entry.dataKey)}
          </span>
          <span className="font-semibold">
            {formatFor(entry.dataKey, Number(entry.value))}
          </span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-1.5 border-t border-border pt-1">
        Click to expand this run's full KPI details
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KpiTrendChart({ runs, maxScore = 52, moduleKey = "M3" }: KpiTrendChartProps) {
  const [selectedRun, setSelectedRun] = useState<number | null>(null);

  const cfg = MODULE_CONFIG[moduleKey] ?? MODULE_CONFIG.M3;

  const runsWithKpi = runs.filter((r) => r.kpi && Object.keys(r.kpi).length > 0);
  if (runsWithKpi.length < 1) return null;

  const sorted = [...runsWithKpi].sort((a, b) => a.runNumber - b.runNumber);

  const chartData = sorted.map((r) => {
    const point: Record<string, unknown> = {
      run: `#${r.runNumber}`,
      runNumber: r.runNumber,
      isFinal: r.isFinal,
      [cfg.primaryKey]: cfg.getPrimary(r.kpi!),
      [cfg.secondaryKey]: cfg.getSecondary(r.kpi!),
    };
    if (cfg.tertiaryKey && cfg.getTertiary) {
      point[cfg.tertiaryKey] = cfg.getTertiary(r.kpi!);
    }
    return point;
  });

  const primaryValues = chartData.map((d) => d[cfg.primaryKey] as number).filter((v) => isFinite(v));
  const secondaryValues = chartData.map((d) => d[cfg.secondaryKey] as number).filter((v) => v > 0);
  const tertiaryValues = cfg.tertiaryKey
    ? chartData.map((d) => d[cfg.tertiaryKey!] as number).filter((v) => isFinite(v))
    : [];

  // If every computed value across all configured series is 0 the KPI fields
  // are missing or have the wrong names (e.g. data stored before field-name
  // standardisation). Rendering a flat-zero chart is misleading, so show a
  // placeholder instead. We check all three series so that M3 runs with only a
  // non-zero profitMarginPct still render the chart normally.
  const allPrimaryZero = primaryValues.length === 0 || primaryValues.every((v) => v === 0);
  const allSecondaryZero = secondaryValues.length === 0;
  const allTertiaryZero =
    tertiaryValues.length === 0 || tertiaryValues.every((v) => v === 0);
  const hasNoUsableData = allPrimaryZero && allSecondaryZero && (!cfg.tertiaryKey || allTertiaryZero);
  if (hasNoUsableData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            KPI Trend — Across Practice Runs
          </CardTitle>
          <CardDescription>{cfg.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <TrendingUp className="w-8 h-8 opacity-20" />
            <p className="text-sm font-medium">No trend data yet</p>
            <p className="text-xs text-center max-w-xs">
              KPI details will appear here once your runs have been scored with the current metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extend the left-axis domain to cover both primary (fill rate) and tertiary
  // (profit margin) values, which can range from negative to ~100.
  const allLeftValues = [...primaryValues, ...tertiaryValues];
  const rawMin = allLeftValues.length ? Math.min(...allLeftValues) : 0;
  const rawMax = allLeftValues.length ? Math.max(...allLeftValues) : 100;
  const padding = Math.max(5, (rawMax - rawMin) * 0.12);
  // Always show any tertiary reference line (e.g. 15% profit margin target)
  // even when all data values are above it, so the target is never clipped.
  const tertiaryRefMin = cfg.tertiaryReferenceValue != null ? cfg.tertiaryReferenceValue - 3 : Infinity;
  const primaryMin = Math.floor(Math.min(rawMin - padding, tertiaryRefMin));
  // Always show the primary reference target line (e.g. 94% fill-rate target)
  // plus a small margin above it, even when data values are all well below it.
  const primaryMax = Math.min(100, Math.max(cfg.referenceValue + 3, Math.ceil(rawMax + padding)));
  const secondaryMin = secondaryValues.length ? Math.max(0, Math.min(...secondaryValues) * 0.85) : 0;
  const secondaryMax = secondaryValues.length ? Math.max(...secondaryValues) * 1.1 : 300000;

  const selectedRunData = selectedRun != null
    ? runsWithKpi.find((r) => r.runNumber === selectedRun) ?? null
    : null;

  const handleDotClick = (runNumber: number) => {
    setSelectedRun((prev) => (prev === runNumber ? null : runNumber));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" />
          KPI Trend — Across Practice Runs
        </CardTitle>
        <CardDescription>
          {cfg.description} · Click any point to see full KPI details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis
                dataKey="run"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
              />

              {/* Left Y-axis: primary metric (%) */}
              <YAxis
                yAxisId="primary"
                domain={[primaryMin, primaryMax]}
                tick={{ fontSize: 10, fill: cfg.primaryColor }}
                stroke={cfg.primaryColor}
                tickFormatter={(v) => `${v}%`}
                width={42}
                label={{
                  value: cfg.primaryAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: 8,
                  style: { fontSize: 10, fill: cfg.primaryColor },
                }}
              />

              {/* Right Y-axis: secondary metric (cost) */}
              <YAxis
                yAxisId="secondary"
                orientation="right"
                domain={[secondaryMin, secondaryMax]}
                tick={{ fontSize: 10, fill: cfg.secondaryColor }}
                stroke={cfg.secondaryColor}
                tickFormatter={cfg.secondaryTickFormat}
                width={52}
                label={{
                  value: cfg.secondaryAxisLabel,
                  angle: 90,
                  position: "insideRight",
                  offset: 8,
                  style: { fontSize: 10, fill: cfg.secondaryColor },
                }}
              />

              <Tooltip content={<CustomTooltip cfg={cfg} />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => {
                  if (value === cfg.primaryKey) return cfg.primaryLabel;
                  if (value === cfg.secondaryKey) return cfg.secondaryLabel;
                  if (cfg.tertiaryKey && value === cfg.tertiaryKey) return cfg.tertiaryLabel ?? value;
                  return value;
                }}
              />

              {/* Reference line for target % */}
              <ReferenceLine
                yAxisId="primary"
                y={cfg.referenceValue}
                stroke={cfg.primaryColor}
                strokeDasharray="5 3"
                strokeOpacity={0.5}
                label={{
                  value: cfg.referenceLabel,
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: cfg.primaryColor,
                  opacity: 0.7,
                }}
              />

              {/* Tertiary reference line (e.g. M3 profit margin target) */}
              {cfg.tertiaryReferenceValue != null && cfg.tertiaryColor && (
                <ReferenceLine
                  yAxisId="primary"
                  y={cfg.tertiaryReferenceValue}
                  stroke={cfg.tertiaryColor}
                  strokeDasharray="5 3"
                  strokeOpacity={0.5}
                  label={{
                    value: cfg.tertiaryReferenceLabel ?? `Target ${cfg.tertiaryReferenceValue}%`,
                    position: "insideBottomRight",
                    fontSize: 9,
                    fill: cfg.tertiaryColor,
                    opacity: 0.7,
                  }}
                />
              )}

              <Line
                yAxisId="primary"
                type="monotone"
                dataKey={cfg.primaryKey}
                name={cfg.primaryKey}
                stroke={cfg.primaryColor}
                strokeWidth={2.5}
                dot={(props: any) => (
                  <ClickableDot
                    {...props}
                    selectedRun={selectedRun}
                    onClick={handleDotClick}
                    color={cfg.primaryColor}
                  />
                )}
                activeDot={false}
              />

              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey={cfg.secondaryKey}
                name={cfg.secondaryKey}
                stroke={cfg.secondaryColor}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={(props: any) => (
                  <ClickableDot
                    {...props}
                    selectedRun={selectedRun}
                    onClick={handleDotClick}
                    color={cfg.secondaryColor}
                  />
                )}
                activeDot={false}
              />

              {cfg.tertiaryKey && cfg.tertiaryColor && (
                <Line
                  yAxisId="primary"
                  type="monotone"
                  dataKey={cfg.tertiaryKey}
                  name={cfg.tertiaryKey}
                  stroke={cfg.tertiaryColor}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={(props: any) => (
                    <ClickableDot
                      {...props}
                      selectedRun={selectedRun}
                      onClick={handleDotClick}
                      color={cfg.tertiaryColor!}
                    />
                  )}
                  activeDot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Run selector chips */}
        <div className="flex flex-wrap gap-1.5">
          {sorted.map((r) => {
            const isSelected = selectedRun === r.runNumber;
            return (
              <button
                key={r.runNumber}
                onClick={() => handleDotClick(r.runNumber)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/70"
                }`}
              >
                #{r.runNumber}
                {r.isFinal && (
                  <span className={`font-semibold ${isSelected ? "text-primary-foreground" : "text-green-600"}`}>
                    ★
                  </span>
                )}
                <span className={`font-semibold ml-0.5 ${isSelected ? "text-primary-foreground" : gradeColor(r.letterGrade)}`}>
                  {r.letterGrade}
                </span>
              </button>
            );
          })}
          {selectedRun != null && (
            <button
              onClick={() => setSelectedRun(null)}
              className="text-[10px] text-muted-foreground underline underline-offset-2 ml-1 self-center"
            >
              clear
            </button>
          )}
        </div>

        <KpiDeltaTable chartData={chartData} sorted={sorted} cfg={cfg} />

        {/* Expanded KPI detail */}
        {selectedRunData && (
          <RunKpiDetail run={selectedRunData} maxScore={maxScore} moduleKey={moduleKey} />
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          ★ = final submission · {cfg.legendNote} · Click any dot or chip to expand
        </p>
      </CardContent>
    </Card>
  );
}
