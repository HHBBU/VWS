import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, ChevronRight, History, TrendingUp, BarChart2 } from "lucide-react";
import { format } from "date-fns";

interface RunData {
  runNumber: number;
  score: number;
  letterGrade: string;
  isFinal: boolean;
  createdAt: string;
  kpi?: Record<string, unknown> | null;
}

interface RunHistoryPanelProps {
  runs: RunData[];
  maxScore?: number;
  moduleKey?: "M1" | "M2" | "M3";
}

function gradeColor(grade: string): string {
  if (grade === "A") return "text-green-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-yellow-600";
  return "text-red-600";
}

function gradeBg(grade: string): string {
  if (grade === "A") return "bg-green-100 text-green-700 border-green-200";
  if (grade === "B") return "bg-blue-100 text-blue-700 border-blue-200";
  if (grade === "C") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function fmt(v: unknown, decimals = 0): string {
  if (v == null || typeof v !== "number") return "—";
  return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function KpiSummary({ kpi, moduleKey, maxScore }: { kpi: Record<string, unknown>; moduleKey?: "M1" | "M2" | "M3"; maxScore: number }) {
  type KpiItem = { label: string; value: string; color?: string };
  let items: KpiItem[] = [];

  if (moduleKey === "M1") {
    const svc = typeof kpi.serviceLevel === "number" ? kpi.serviceLevel : null;
    items = [
      { label: "Score",          value: `${fmt(kpi.score ?? null)}/${maxScore}` },
      { label: "Service Level",  value: svc != null ? `${(svc * 100).toFixed(1)}%` : "—", color: svc != null && svc >= 0.95 ? "text-emerald-600" : "text-amber-600" },
      { label: "Total Cost",     value: typeof kpi.totalCost === "number" ? `€${fmt(kpi.totalCost)}` : "—" },
      { label: "Cotton",         value: `${fmt(kpi.cottonAllocatedKg)} / ${fmt(kpi.cottonRequiredKg)} kg` },
      { label: "Nylon",          value: `${fmt(kpi.nylonAllocatedKg)} / ${fmt(kpi.nylonRequiredKg)} kg` },
    ];
  } else if (moduleKey === "M2") {
    const svc = typeof kpi.serviceLevel === "number" ? kpi.serviceLevel : null;
    const util = typeof kpi.utilizationPct === "number" ? kpi.utilizationPct : null;
    items = [
      { label: "Service Level",  value: svc != null ? `${(svc * 100).toFixed(1)}%` : "—", color: svc != null && svc >= 0.95 ? "text-emerald-600" : "text-amber-600" },
      { label: "WC Utilisation", value: util != null ? `${util.toFixed(1)}%` : "—", color: util != null && util <= 85 ? "text-emerald-600" : "text-red-600" },
      { label: "Total Cost",     value: typeof kpi.totalCost === "number" ? `€${fmt(kpi.totalCost)}` : "—" },
      { label: "Filled Orders",  value: fmt(kpi.filledOrders ?? null) },
    ];
  } else if (moduleKey === "M3") {
    const fill = typeof kpi.fillRate === "number" ? kpi.fillRate : null;
    const margin = typeof kpi.profitMarginPct === "number" ? kpi.profitMarginPct : null;
    items = [
      { label: "Fill Rate",      value: fill != null ? `${fill.toFixed(1)}%` : "—", color: fill != null && fill >= 94 ? "text-emerald-600" : fill != null && fill >= 90 ? "text-blue-600" : "text-red-600" },
      { label: "Profit Margin",  value: margin != null ? `${margin.toFixed(1)}%` : "—", color: margin != null && margin >= 15 ? "text-emerald-600" : "text-red-600" },
      { label: "Total Cost",     value: typeof kpi.totalCost === "number" ? `€${fmt(kpi.totalCost)}` : "—" },
      { label: "Stockouts",      value: fmt(kpi.totalStockouts ?? null), color: (kpi.totalStockouts as number) > 0 ? "text-red-600" : "text-emerald-600" },
    ];
  } else {
    items = [
      { label: "Total Cost", value: typeof kpi.totalCost === "number" ? `€${fmt(kpi.totalCost)}` : "—" },
    ];
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 px-3 bg-muted/30 border-t border-border/40">
      {items.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className={`text-sm font-semibold ${color ?? "text-foreground"}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCompareChart({ runs, moduleKey }: { runs: RunData[]; moduleKey?: "M1" | "M2" | "M3" }) {
  const runsWithKpi = runs.filter(r => r.kpi);
  if (runsWithKpi.length < 2) return null;

  type ChartRow = { run: string; value: number | null; isFinal: boolean };
  let data: ChartRow[] = [];
  let metricLabel = "";
  let refValue: number | null = null;
  let color = "#6366f1";

  if (moduleKey === "M1") {
    metricLabel = "Service Level (%)";
    refValue = 95;
    color = "#22c55e";
    data = runsWithKpi.map(r => ({
      run: `#${r.runNumber}`,
      value: typeof r.kpi!.serviceLevel === "number" ? +(r.kpi!.serviceLevel as number * 100).toFixed(1) : null,
      isFinal: r.isFinal,
    }));
  } else if (moduleKey === "M2") {
    metricLabel = "Service Level (%)";
    refValue = 95;
    color = "#22c55e";
    data = runsWithKpi.map(r => ({
      run: `#${r.runNumber}`,
      value: typeof r.kpi!.serviceLevel === "number" ? +(r.kpi!.serviceLevel as number * 100).toFixed(1) : null,
      isFinal: r.isFinal,
    }));
  } else if (moduleKey === "M3") {
    metricLabel = "Fill Rate (%)";
    refValue = 94;
    color = "#3b82f6";
    data = runsWithKpi.map(r => ({
      run: `#${r.runNumber}`,
      value: typeof r.kpi!.fillRate === "number" ? +(r.kpi!.fillRate as number).toFixed(1) : null,
      isFinal: r.isFinal,
    }));
  } else {
    return null;
  }

  if (data.every(d => d.value == null)) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <BarChart2 className="w-3.5 h-3.5" />
        {metricLabel} — Run Comparison
      </p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="run" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              domain={[Math.max(0, Math.min(...data.filter(d => d.value != null).map(d => d.value!)) - 5), 100]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                fontSize: 12,
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
              formatter={(value: number) => [`${value}%`, metricLabel]}
            />
            {refValue != null && (
              <ReferenceLine
                y={refValue}
                stroke="#f59e0b"
                strokeDasharray="4 3"
                label={{ value: `Target ${refValue}%`, position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
              />
            )}
            <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RunHistoryPanel({ runs, maxScore = 52, moduleKey }: RunHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);

  if (runs.length === 0) return null;

  const chartData = runs.map((r) => ({
    run: `#${r.runNumber}`,
    score: r.score,
    isFinal: r.isFinal,
  }));

  return (
    <Card className="border-border/60">
      <CardHeader
        className="cursor-pointer select-none pb-3 hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Run History
            <Badge variant="secondary" className="ml-1 text-xs font-normal">
              {runs.length} run{runs.length !== 1 ? "s" : ""}
            </Badge>
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          {runs.length >= 2 && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Score Trend
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="run"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, maxScore]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                        offset: 5,
                        style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        fontSize: 12,
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                      formatter={(value: number) => [`${value}/${maxScore}`, "Score"]}
                    />
                    <ReferenceLine
                      y={maxScore}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <KpiCompareChart runs={runs} moduleKey={moduleKey} />

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Run</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date / Time</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Grade</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {[...runs].reverse().map((r) => {
                  const isExpanded = expandedRun === r.runNumber;
                  const hasKpi = !!r.kpi;
                  return (
                    <>
                      <tr
                        key={r.runNumber}
                        className={`border-b border-border/30 last:border-0 ${
                          r.isFinal
                            ? "bg-green-50 dark:bg-green-900/10"
                            : hasKpi ? "hover:bg-muted/20 cursor-pointer" : ""
                        }`}
                        onClick={() => hasKpi && setExpandedRun(isExpanded ? null : r.runNumber)}
                      >
                        <td className="py-2 px-3 font-medium">
                          #{r.runNumber}
                          {r.isFinal && (
                            <Badge className="ml-2 bg-green-500 text-white text-[10px] px-1.5 py-0">
                              Final
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {format(new Date(r.createdAt), "MMM d, yyyy · h:mm a")}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold">
                          {r.score}/{maxScore}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${gradeBg(r.letterGrade)}`}
                          >
                            {r.letterGrade}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {hasKpi && (
                            isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground inline" />
                              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground inline" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && r.kpi && (
                        <tr key={`${r.runNumber}-kpi`} className="border-b border-border/20">
                          <td colSpan={5} className="p-0">
                            <KpiSummary kpi={r.kpi} moduleKey={moduleKey} maxScore={maxScore} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {runs.some(r => r.kpi) && (
            <p className="text-xs text-muted-foreground text-center">Click a row to see KPI details for that run</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
