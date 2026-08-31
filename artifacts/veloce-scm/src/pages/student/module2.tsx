import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { MODULE_IMAGES } from "@/config/moduleImages";
import { useModuleImages } from "@/hooks/useModuleImages";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetModuleDataQueryKey,
  getGetStudentDashboardQueryKey,
  useGetModuleData,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  TrendingUp,
  Factory,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Info,
  BookOpen,
  Wrench,
  GraduationCap,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Package,
  FileDown,
} from "lucide-react";
import { GuideSheet } from "@/components/GuideSheet";
import { arcPath, SemiGauge, COST_BAR_COLORS, wcColor, slColor, ceColor } from "@/components/KpiCharts";
import { MultiRunRadarChart } from "@/components/MultiRunRadarChart";
import { KpiTrendChart } from "@/components/KpiTrendChart";
import { RunHistoryPanel } from "@/components/RunHistoryPanel";
import { module2Guide } from "@/guides/module2Guide";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Line,
  Area,
  ReferenceArea,
} from "recharts";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { openSimulationReport } from "@/components/SimulationReport";
import {
  BENCHMARK_SL_BEST,
  BENCHMARK_SL_TYPICAL,
  BENCHMARK_UTIL_UPPER,
  BENCHMARK_UTIL_LOWER,
} from "@/config/benchmarks";

// ─── Constants ───────────────────────────────────────────────────────────────

const CAPACITY_DAILY: Record<string, number> = {
  standard: 800,
  overtime: 1050,
  two_shift: 1500,
};

const TARGET_COSTS: Record<string, number> = {
  standard:  65000,
  overtime:  80000,
  two_shift: 100000,
};

const DEFAULT_SOP_A = [4200, 4300, 4400, 4400, 4500, 4500, 4100, 3900];
const DEFAULT_SOP_B = [2100, 2150, 2200, 2200, 2250, 2250, 2050, 1950];

const WC_SAM = [
  { key: "cutting",   label: "Cutting",           samA: 0.8, samB: 1.1, capBase: 1500 },
  { key: "dyeing",    label: "Dyeing / Finishing", samA: 0.7, samB: 1.0, capBase: 1400 },
  { key: "sewing",    label: "Sewing",             samA: 3.2, samB: 4.8, capBase: 3100 },
  { key: "packaging", label: "Packaging",          samA: 0.5, samB: 0.7, capBase: 1100 },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface M1Context {
  hasM1Data: boolean;
  avgReliabilityPct: number;
  avgLeadTimeDays: number;
  forecastA: number;
  forecastB: number;
}

interface SimResult {
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
      wc_utilizations_pre: Record<string, number>;
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
  runNumber: number;
  isFinal: boolean;
  _snap?: {
    capacityMode: string;
    sopA: number[];
    sopB: number[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function euro(n: number | undefined | null): string {
  if (n == null) return "—";
  return `€${Math.round(n).toLocaleString()}`;
}

function gradeColor(grade: string) {
  if (grade === "A") return "text-green-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-yellow-600";
  return "text-red-600";
}

// ─── Chart helpers ────────────────────────────────────────────────────────────


// ─── Sub-components ───────────────────────────────────────────────────────────

function M1Banner({ ctx }: { ctx: M1Context }) {
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem("vws_m2_cascade_open") !== "false"; } catch { return true; }
  });
  const toggle = () => setOpen((v) => {
    const next = !v;
    try { localStorage.setItem("vws_m2_cascade_open", String(next)); } catch {}
    return next;
  });
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-blue-800">
                {ctx.hasM1Data
                  ? "📊 Module 1 Context — Your M1 results drive the M2 simulation"
                  : "⚠ Using default M1 values — Complete Module 1 first for personalised results"}
              </p>
              <Button
                variant="ghost" size="sm"
                className="h-7 px-2 text-blue-700 hover:bg-blue-100 ml-2 shrink-0 text-xs font-medium"
                onClick={toggle}
              >
                {open ? "Hide ▲" : "Show ▼"}
              </Button>
            </div>
            {open && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="bg-white rounded p-2 text-center border border-blue-100">
                    <div className="text-xs text-slate-500">Supplier Reliability</div>
                    <div className="font-bold text-blue-700">{ctx.avgReliabilityPct.toFixed(1)}%</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-blue-100">
                    <div className="text-xs text-slate-500">Avg Lead Time</div>
                    <div className="font-bold text-blue-700">{ctx.avgLeadTimeDays.toFixed(1)} days</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-blue-100">
                    <div className="text-xs text-slate-500">Forecast SKU A (annual)</div>
                    <div className="font-bold text-blue-700">{fmt(ctx.forecastA)}</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-blue-100">
                    <div className="text-xs text-slate-500">Forecast SKU B (annual)</div>
                    <div className="font-bold text-blue-700">{fmt(ctx.forecastB)}</div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed mb-2">
                  <strong>How M1 feeds M2:</strong> Your supplier reliability ({ctx.avgReliabilityPct.toFixed(1)}%) drives daily supply variation in the 56-day simulation. Your lead time ({ctx.avgLeadTimeDays.toFixed(1)} days) sets the safety stock buffer. Your annual forecasts are converted to 8-week MPS targets — SKU A ≈ <strong>{fmt(Math.round(ctx.forecastA / 52 * 8))}</strong> units, SKU B ≈ <strong>{fmt(Math.round(ctx.forecastB / 52 * 8))}</strong> units over 8 weeks.
                </p>
                <p className="text-xs text-blue-800 font-semibold bg-blue-100 rounded px-2.5 py-1.5">
                  📌 You do <em>not</em> re-forecast in Module 2. Your M1 forecast values are the fixed demand inputs for this simulation — your task here is to plan production and operations, not to revise demand estimates.
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BomPanel() {
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem("vws_m2_bom_open") === "true"; } catch { return false; }
  });
  const toggle = () => setOpen((v) => {
    const next = !v;
    try { localStorage.setItem("vws_m2_bom_open", String(next)); } catch {}
    return next;
  });

  const wcRows = [
    { wc: "Cutting",          samA: 0.8, samB: 1.1, cap: 1500 },
    { wc: "Dyeing/Finishing", samA: 0.7, samB: 1.0, cap: 1400 },
    { wc: "Sewing",           samA: 3.2, samB: 4.8, cap: 3100 },
    { wc: "Packaging",        samA: 0.5, samB: 0.7, cap: 1100 },
  ] as const;

  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardHeader className="pb-2">
        <button type="button" onClick={toggle} className="flex items-center justify-between w-full text-left">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
            <Package className="w-4 h-4 text-slate-500" />
            📦 Bill of Materials &amp; Production Data — Click to expand
          </CardTitle>
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-5">
          {/* BOM Table */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Bill of Materials — Raw Material per Finished Unit</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg">
                <thead className="bg-muted/50">
                  <tr>
                    {["SKU", "Description", "Material", "BOM qty/unit", "Yield factor", "Net kg/unit", "Annual need formula"].map((h) => (
                      <th key={h} className="p-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <tr className="hover:bg-muted/20">
                    <td className="p-1.5 font-bold text-indigo-700">SKU A</td>
                    <td className="p-1.5">Trend Tee</td>
                    <td className="p-1.5">Cotton</td>
                    <td className="p-1.5 tabular-nums">0.23 kg</td>
                    <td className="p-1.5 tabular-nums">× 1.06 (+6%)</td>
                    <td className="p-1.5 tabular-nums font-semibold">0.2438 kg</td>
                    <td className="p-1.5 text-slate-500 italic text-[10px]">forecastA × 0.2438</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-1.5 font-bold text-green-700">SKU B</td>
                    <td className="p-1.5">Core Jogger</td>
                    <td className="p-1.5">Nylon</td>
                    <td className="p-1.5 tabular-nums">0.42 kg</td>
                    <td className="p-1.5 tabular-nums">× 1.08 (+8%)</td>
                    <td className="p-1.5 tabular-nums font-semibold">0.4536 kg</td>
                    <td className="p-1.5 text-slate-500 italic text-[10px]">forecastB × 0.4536</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SAM Table */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Work Centre SAM &amp; Theoretical Daily Throughput</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg">
                <thead className="bg-muted/50">
                  <tr>
                    {["Work Centre", "SAM (SKU A)", "SAM (SKU B)", "Capacity (min/day)", "Max A/day", "Max B/day"].map((h) => (
                      <th key={h} className="p-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {h.startsWith("SAM") ? (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="underline decoration-dotted cursor-help">{h}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[260px] text-center">
                                Standard Allowed Minutes — the time required to make one unit at this work centre
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {wcRows.map(({ wc, samA, samB, cap }) => {
                    const maxA = Math.floor(cap / samA);
                    const maxB = Math.floor(cap / samB);
                    return (
                      <tr key={wc} className="hover:bg-muted/20">
                        <td className="p-1.5 font-semibold">{wc}</td>
                        <td className="p-1.5 tabular-nums">{samA} min</td>
                        <td className="p-1.5 tabular-nums">{samB} min</td>
                        <td className="p-1.5 tabular-nums">{cap.toLocaleString()}</td>
                        <td className="p-1.5 tabular-nums">{maxA.toLocaleString()}</td>
                        <td className="p-1.5 tabular-nums">{maxB.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
              <span className="text-slate-400 shrink-0">Formula:</span>
              <span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 whitespace-nowrap">Capacity (min/day) ÷ SAM (min/unit) = Max throughput (units/day)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Capacity improvements (Section 3) multiply the targeted work centre's daily capacity by the improvement multiplier.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function SopChart({
  sopA,
  sopB,
  capacityMode,
}: {
  sopA: number[];
  sopB: number[];
  capacityMode: string;
}) {
  const weeklyCapacity = (CAPACITY_DAILY[capacityMode] ?? 800) * 7;

  const data = useMemo(
    () =>
      sopA.map((a, i) => {
        const production = a + sopB[i];
        const overCapacity = Math.max(0, production - weeklyCapacity);
        return {
          week: `W${i + 1}`,
          skuA: a,
          skuB: sopB[i],
          production,
          overCapacity: overCapacity > 0 ? overCapacity : undefined,
        };
      }),
    [sopA, sopB, weeklyCapacity],
  );

  const anyOver = data.some((d) => d.overCapacity !== undefined);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Visual S&OP Planner — Real-time Capacity Check
        </CardTitle>
        <CardDescription>
          Production bars update as you type. Red reference line = weekly capacity limit (
          {fmt(weeklyCapacity)} units/week for {capacityMode.replace("_", "-")} mode).
          {anyOver && (
            <span className="text-red-600 font-medium ml-1">
              ⚠ Some weeks exceed capacity — reduce targets or upgrade capacity mode.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="week" />
            <YAxis
              domain={[0, 12000]}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              label={{ value: "Units / Week", angle: -90, position: "insideLeft", offset: -5 }}
            />
            <ReTooltip
              formatter={(value: any, name: string) => [
                Number(value).toLocaleString(),
                name,
              ]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Legend />
            <ReferenceLine
              y={weeklyCapacity}
              label={{ value: "Capacity", position: "right", fontSize: 11 }}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={2}
            />
            <Bar dataKey="skuA" name="SKU A (Trend Tee)" stackId="prod" fill="#6366f1" radius={[0, 0, 0, 0]} />
            <Bar dataKey="skuB" name="SKU B (Core Jogger)" stackId="prod" fill="#22c55e" radius={[0, 0, 0, 0]} />
            {anyOver && (
              <Bar dataKey="overCapacity" name="Over Capacity" stackId="over" fill="#ef4444" radius={[4, 4, 0, 0]} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700">
          <strong>Tip:</strong> Aim for total weekly production (SKU A + B) to stay below the red
          line each week. Utilization 80–95% earns maximum capacity efficiency points.
        </div>
      </CardContent>
    </Card>
  );
}

function WcCapacityPanel({
  sopA,
  sopB,
  capacityMode,
  bottleneckTarget,
}: {
  sopA: number[];
  sopB: number[];
  capacityMode: string;
  bottleneckTarget: string;
}) {
  const totalA = sopA.reduce((s, v) => s + v, 0);
  const totalB = sopB.reduce((s, v) => s + v, 0);
  const scale = (CAPACITY_DAILY[capacityMode] ?? 800) / 800;

  const wcs = WC_SAM.map(({ key, label, samA, samB, capBase }) => {
    const needed  = totalA * samA + totalB * samB;
    const avail   = capBase * scale * 56;
    const pct     = avail > 0 ? Math.round((needed / avail) * 100) : 0;
    const status  = pct > 100 ? "red" : pct > 85 ? "amber" : "green";
    const isTargeted = bottleneckTarget === key;
    return { key, label, pct, status, isTargeted };
  });

  const worstPct = Math.max(...wcs.map((w) => w.pct));

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-slate-50">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm text-indigo-800">
          <Factory className="w-4 h-4 text-indigo-500" />
          Live Work-Center Load — 56-Day Preview
          {worstPct > 100 && (
            <span className="ml-auto text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
              ⚠ Over-capacity
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-slate-500">
          Updates in real-time as you edit targets above. Shows aggregate work-center load over the full 56-day simulation at the current capacity mode.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {wcs.map(({ key, label, pct, status, isTargeted }) => {
          const barColor =
            status === "red"   ? "bg-red-500"   :
            status === "amber" ? "bg-amber-400" : "bg-green-500";
          const textColor =
            status === "red"   ? "text-red-600"   :
            status === "amber" ? "text-amber-600" : "text-green-700";
          const displayPct = Math.min(pct, 110);
          const barWidth   = (displayPct / 110) * 100;

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  {label}
                  {isTargeted && (
                    <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                      Targeted ↓
                    </span>
                  )}
                </span>
                <span className={`font-bold tabular-nums ${textColor}`}>{pct}%</span>
              </div>
              <div className="relative h-2.5 bg-slate-100 rounded-full overflow-visible">
                {/* threshold zone markers */}
                <div className="absolute top-0 bottom-0 w-px bg-amber-300/80 rounded-full" style={{ left: `${(85 / 110) * 100}%` }} />
                <div className="absolute top-0 bottom-0 w-px bg-red-400/80 rounded-full"   style={{ left: `${(100 / 110) * 100}%` }} />
                {/* fill */}
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[10px] text-slate-500 border-t border-slate-100">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≤ 85% efficient</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 85–100% loaded</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt; 100% over-capacity</span>
          <span className="ml-auto italic text-slate-400 hidden sm:inline">
            Find the highest bar → target it in Section 2 ↓
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsPanel({
  result,
  sopA,
  sopB,
  m1Context,
  capacityMode,
  onDownload,
}: {
  result: SimResult;
  sopA: number[];
  sopB: number[];
  m1Context: M1Context | null;
  capacityMode: string;
  onDownload: () => void;
}) {
  const images = useModuleImages();
  const [weeklyChartOpen, setWeeklyChartOpen] = useState(false);
  const [wcWeeklyOpen, setWcWeeklyOpen] = useState(false);
  const bd = result.scoreBreakdown;

  const costVsTarget = result.kpis.costVsTargetPct;
  const costVsTargetLabel =
    costVsTarget == null ? "—"
    : costVsTarget > 0 ? `+${costVsTarget.toFixed(1)}% over`
    : `${Math.abs(costVsTarget).toFixed(1)}% under`;

  const bottleneckName = result.kpis.trueBottleneck
    ? result.kpis.trueBottleneck.charAt(0).toUpperCase() + result.kpis.trueBottleneck.slice(1)
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Score header */}
      <Card className={result.isFinal ? "border-green-300 bg-green-50" : "border-indigo-200 bg-indigo-50"}>
        <CardContent className="pt-4 pb-4">
          <img
            src={images.module2.results.src}
            alt={images.module2.results.alt}
            className="w-full rounded-md mb-2"
            style={{ height: "180px", objectFit: "cover" }}
            loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module2.results.src; if (t.src !== def) t.src = def; }}
                  />
          <p className="text-xs italic text-muted-foreground px-1 pb-4">{images.module2.results.caption}</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <Trophy className={`w-8 h-8 ${result.isFinal ? "text-green-600" : "text-indigo-600"}`} />
              <div>
                <div className="text-3xl font-bold">
                  {result.score}
                  <span className="text-lg text-slate-500">/{result.maxScore}</span>
                </div>
                <div className={`text-xl font-bold ${gradeColor(result.letterGrade)}`}>
                  Grade {result.letterGrade}
                </div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <Badge variant={result.isFinal ? "default" : "secondary"} className="mb-1">
                {result.isFinal ? "Final Submission" : `Practice Run #${result.runNumber}`}
              </Badge>
              <p className="text-sm text-slate-600">
                {result.isFinal
                  ? "This score is recorded in your gradebook."
                  : "Adjust your plan and run more practice rounds before submitting."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score breakdown — v3 rubric */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            { label: "Performance Outcomes (Service + Cost)", value: bd.performance, max: 20 },
            { label: "S&OP Planning Quality", value: bd.sopQuality, max: 10 },
            { label: "Bottleneck & Capacity Decision", value: bd.bottleneckScore, max: 10 },
            { label: "Lean · Quality · Layout Decisions", value: bd.leanQualityScore, max: 10 },
          ] as const).map(({ label, value, max }) => {
            const val = value ?? 0;
            const pct = Math.min(100, (val / max) * 100);
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{label}</span>
                  <span className="font-semibold">
                    {val} / {max}
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}

          {/* Bottleneck detail */}
          {bd.bottleneckDetail && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-semibold text-slate-600 mb-2">Bottleneck Analysis</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(bd.bottleneckDetail.wc_utilizations).map(([wc, util]) => (
                  <div
                    key={wc}
                    className={`text-center rounded p-1.5 border ${
                      wc === bd.bottleneckDetail!.true_bottleneck
                        ? "bg-red-50 border-red-200 font-bold text-red-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="capitalize">{wc}</div>
                    <div>{util}%</div>
                    {wc === bd.bottleneckDetail!.true_bottleneck && (
                      <div className="text-red-600 font-medium">Bottleneck</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            Simulation KPIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Service Level", value: `${result.kpis.serviceLevel}%`, highlight: result.kpis.serviceLevel >= 95 },
              { label: "Total Cost", value: euro(result.kpis.totalCost), highlight: false },
              { label: "Capacity Utilization", value: `${result.kpis.capacityUtilization}%`, highlight: result.kpis.capacityUtilization >= 80 && result.kpis.capacityUtilization <= 95 },
              { label: "Stockouts A", value: fmt(result.kpis.totalStockoutsA), highlight: result.kpis.totalStockoutsA === 0 },
              { label: "Stockouts B", value: fmt(result.kpis.totalStockoutsB), highlight: result.kpis.totalStockoutsB === 0 },
              { label: "Production A", value: fmt(result.kpis.totalProductionA), highlight: false },
              { label: "Production B", value: fmt(result.kpis.totalProductionB), highlight: false },
              { label: "Ending Inv A", value: fmt(result.kpis.endingInventoryA), highlight: false },
              // v3 new KPI tiles
              { label: "Cost vs Target", value: costVsTargetLabel, highlight: (result.kpis.costVsTargetPct ?? 999) <= 5 },
              { label: "True Bottleneck", value: bottleneckName, highlight: false },
              { label: "Scrap/Rework Cost", value: euro(result.kpis.scrapReworkCost), highlight: false },
              { label: "Total Investment", value: euro(result.kpis.totalInvestmentCost), highlight: false },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className={`rounded-lg p-3 text-center border ${
                  highlight ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                <div className={`font-bold text-sm ${highlight ? "text-green-700" : "text-slate-800"}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Real-world impact note */}
          {(result.kpis.totalStockoutsA + result.kpis.totalStockoutsB) > 0 && (
            <div className="mt-3 pt-3 border-t text-[11px] text-slate-500 italic">
              ≈ {(result.kpis.totalStockoutsA + result.kpis.totalStockoutsB).toLocaleString()} units went unfulfilled — each unit represents a customer order that couldn't be completed on time.
            </div>
          )}

          {/* Cost breakdown */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-slate-600 mb-2">Cost Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                ["Capacity", euro(result.kpis.capacityCost)],
                ["Holding", euro(result.kpis.holdingCost)],
                ["Changeovers", euro(result.kpis.changeoverCost)],
                ["Stockouts", euro(result.kpis.stockoutCost)],
                ["Markdown", euro(result.kpis.markdownCost)],
                ["Training", euro(result.kpis.trainingCost)],
                ["Lean", euro(result.kpis.leanCost)],
                ["Capacity Impr.", euro(result.kpis.capacityImprovementCost)],
              ].map(([label, val]) => (
                <div key={label} className="text-center">
                  <div className="text-slate-500">{label}</div>
                  <div className="font-medium">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation flags */}
      {result.validationFlags.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              Validation Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.validationFlags.map((f, i) => (
                <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                  <span className="mt-0.5">•</span> {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {result.feedback.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700">
              <Info className="w-4 h-4" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.feedback.map((f, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="mt-0.5">→</span> {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Charts ──────────────────────────────────────────────── */}

      {/* Charts 1, 2, 3 — 2-column responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Chart 1: Cost Breakdown Bar */}
        {(() => {
          const snapMode = result._snap?.capacityMode ?? capacityMode;
          const targetCost = TARGET_COSTS[snapMode] ?? 65000;
          const totalCost = result.kpis.totalCost;
          const isOver = totalCost > targetCost;
          const costItems = [
            { name: "Capacity",     value: result.kpis.capacityCost },
            { name: "Holding",      value: result.kpis.holdingCost },
            { name: "Changeovers",  value: result.kpis.changeoverCost },
            { name: "Stockouts",    value: result.kpis.stockoutCost },
            { name: "Markdown",     value: result.kpis.markdownCost },
            { name: "Scrap/Rework", value: result.kpis.scrapReworkCost },
            { name: "Training",     value: result.kpis.trainingCost },
            { name: "Lean",         value: result.kpis.leanCost },
            { name: "Cap. Impr.",   value: result.kpis.capacityImprovementCost },
          ];
          const maxBar = Math.max(...costItems.map((c) => c.value), targetCost);
          const yMax = maxBar * 1.12;
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Cost Breakdown vs Target
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Total: <strong className={isOver ? "text-red-600" : "text-green-700"}>{euro(totalCost)}</strong>
                  {" · "}Target: {euro(Math.round(targetCost))}
                  {isOver && <span className="text-red-600 font-medium ml-1">(+{result.kpis.costVsTargetPct?.toFixed(1)}% over)</span>}
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={costItems} margin={{ top: 10, right: 52, bottom: 36, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis domain={[0, yMax]} tickFormatter={(v) => v >= 1000 ? `€${(v/1000).toFixed(0)}k` : `€${v}`} tick={{ fontSize: 10 }} />
                    <ReTooltip formatter={(v: number | string) => [`€${Math.round(Number(v)).toLocaleString()}`, "Cost"]} contentStyle={{ fontSize: 12 }} />
                    {isOver && (
                      <ReferenceArea y1={targetCost} y2={yMax} fill="rgba(239,68,68,0.10)" />
                    )}
                    <ReferenceLine y={targetCost} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
                      label={{ value: "Target", position: "right", fontSize: 10, fill: "#ef4444" }} />
                    <ReferenceLine y={totalCost} stroke="#6366f1" strokeDasharray="3 2" strokeWidth={1}
                      label={{ value: `Total ${euro(Math.round(totalCost))}`, position: "right", fontSize: 9, fill: "#6366f1" }} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {costItems.map((item) => (
                        <Cell key={item.name} fill={COST_BAR_COLORS[item.name] ?? "#94a3b8"} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })()}

        {/* Chart 2: Work Center Utilization */}
        {(() => {
          const wcUtils = bd.bottleneckDetail?.wc_utilizations ?? {};
          const trueBottleneck = bd.bottleneckDetail?.true_bottleneck ?? "";
          const wcData = [
            { name: "Cutting",          util: wcUtils["cutting"]   ?? 0 },
            { name: "Dyeing/Finishing", util: wcUtils["dyeing"]    ?? 0 },
            { name: "Sewing",           util: wcUtils["sewing"]    ?? 0 },
            { name: "Packaging",        util: wcUtils["packaging"] ?? 0 },
          ];
          const maxUtil = Math.max(...wcData.map((d) => d.util));
          const xMax = Math.max(130, maxUtil + 15);

          interface BarLabelProps {
            x?: number;
            y?: number;
            width?: number;
            value?: number | string;
            index?: number;
          }
          const BottleneckLabel = ({ x = 0, y = 0, width = 0, value, index = 0 }: BarLabelProps) => {
            const wc = wcData[index];
            const isBottleneck = wc != null && wc.name.toLowerCase() === trueBottleneck.toLowerCase();
            return (
              <g>
                <text x={x + width + 4} y={y + 10} fontSize={10} fill={isBottleneck ? "#ef4444" : "#475569"}>
                  {value}%
                </text>
                {isBottleneck && (
                  <text x={x + width + 4} y={y + 22} fontSize={9} fontWeight="600" fill="#ef4444">
                    ⚠ Bottleneck
                  </text>
                )}
              </g>
            );
          };

          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-600" />
                  Work Center Utilization — Peak Week
                </CardTitle>
                <p className="text-xs text-slate-500">
                  True bottleneck: <strong className="capitalize">{trueBottleneck || "—"}</strong>
                  {" "}at {bd.bottleneckDetail?.true_bottleneck_util ?? "—"}%
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart layout="vertical" data={wcData} margin={{ top: 8, right: 80, bottom: 8, left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} horizontal={false} />
                    <XAxis type="number" domain={[0, xMax]}
                      tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={64} />
                    <ReTooltip formatter={(v: number | string) => [`${v}%`, "Utilization"]} contentStyle={{ fontSize: 12 }} />
                    <ReferenceLine x={85} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
                      label={{ value: "Recommended Max", position: "insideTopRight", fontSize: 8, fill: "#92400e", offset: 4 }} />
                    <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
                      label={{ value: "Capacity Limit", position: "insideTopRight", fontSize: 8, fill: "#991b1b", offset: 4 }} />
                    <Bar dataKey="util" radius={[0, 3, 3, 0]} label={<BottleneckLabel />}>
                      {wcData.map((d) => (
                        <Cell key={d.name} fill={wcColor(d.util)} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })()}

        {/* Chart 3: Gauge pair — spans both columns */}
        {(() => {
          const sl = result.kpis.serviceLevel;
          const cvtPct = result.kpis.costVsTargetPct ?? 0;
          const ceValue = Math.max(0, 100 - Math.min(100, cvtPct));
          const cu = result.kpis.capacityUtilization;
          const cuColor = cu > 100 || cu < BENCHMARK_UTIL_LOWER - 10
            ? "#ef4444"
            : cu >= BENCHMARK_UTIL_LOWER && cu <= BENCHMARK_UTIL_UPPER
            ? "#22c55e"
            : "#f59e0b";
          return (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Performance Gauges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <SemiGauge
                      value={sl}
                      label="Service Level"
                      valueLabel={`${sl.toFixed(1)}%`}
                      color={slColor(sl)}
                      benchmarks={[
                        { value: BENCHMARK_SL_BEST, color: "#22c55e" },
                        { value: BENCHMARK_SL_TYPICAL, color: "#f59e0b" },
                      ]}
                    />
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {sl >= BENCHMARK_SL_BEST ? `Best-in-class (≥${BENCHMARK_SL_BEST}%)` : sl >= 95 ? "Excellent" : sl >= BENCHMARK_SL_TYPICAL ? "Industry typical" : "Below avg"}
                    </p>
                  </div>
                  <div>
                    <SemiGauge
                      value={ceValue}
                      label="Cost Efficiency"
                      valueLabel={cvtPct > 0 ? `+${cvtPct.toFixed(1)}%` : `${cvtPct.toFixed(1)}%`}
                      color={ceColor(cvtPct)}
                    />
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {cvtPct <= 5 ? "Within target" : cvtPct <= 15 ? "Moderately over" : "Significantly over"}
                    </p>
                  </div>
                  <div>
                    <SemiGauge
                      value={cu}
                      label="Capacity Util."
                      valueLabel={`${cu.toFixed(0)}%`}
                      color={cuColor}
                      benchmarks={[
                        { value: BENCHMARK_UTIL_UPPER, color: "#f59e0b" },
                        { value: BENCHMARK_UTIL_LOWER, color: "#f59e0b" },
                      ]}
                    />
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {cu >= BENCHMARK_UTIL_LOWER && cu <= BENCHMARK_UTIL_UPPER ? "Optimal range" : cu > BENCHMARK_UTIL_UPPER ? "Over-stressed" : "Under-utilised"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Good</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Warning</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical</span>
                </div>
                <p className="text-center text-[10px] text-slate-400 italic mt-2">
                  SL ticks: <span className="text-green-500 font-medium">≥{BENCHMARK_SL_BEST}%</span> best-in-class · <span className="text-amber-400 font-medium">{BENCHMARK_SL_TYPICAL}%</span> typical floor · Util. ticks: optimal {BENCHMARK_UTIL_LOWER}–{BENCHMARK_UTIL_UPPER}%
                </p>
              </CardContent>
            </Card>
          );
        })()}
        {/* Chart 4: Pre vs Post Improvement Work-Center Utilization */}
        {(() => {
          const bd2 = result.scoreBreakdown.bottleneckDetail;
          if (!bd2) return null;
          const wcUtilPost = bd2.wc_utilizations;
          const wcUtilPre  = bd2.wc_utilizations_pre ?? wcUtilPost;
          const hasImprovement = bd2.student_target && bd2.student_target !== "none";
          const wcLabels: Record<string, string> = {
            cutting: "Cutting",
            dyeing: "Dyeing",
            sewing: "Sewing",
            packaging: "Packaging",
          };
          const chartData = Object.keys(wcLabels).map((key) => ({
            name: wcLabels[key],
            key,
            before: wcUtilPre[key] ?? 0,
            after: wcUtilPost[key] ?? 0,
            isImproved: hasImprovement && bd2.student_target === key,
            isBottleneck: bd2.true_bottleneck === key,
          }));
          const allValues = chartData.flatMap((d) => [d.before, d.after]);
          const yMax = Math.max(130, ...allValues) * 1.1;
          return (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-600" />
                  Work-Center Utilization: Before vs After Improvement
                </CardTitle>
                <p className="text-xs text-slate-500">
                  {hasImprovement
                    ? <>Capacity improvement applied to <strong className="capitalize">{bd2.student_target}</strong>. Blue = before, green = after.</>
                    : "No capacity improvement was applied — bars are equal. Target a bottleneck work center to see the impact."}
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: 24, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={[0, yMax]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 10 }}
                      label={{ value: "Utilization %", angle: -90, position: "insideLeft", offset: -4, fontSize: 10 }}
                    />
                    <ReTooltip
                      formatter={(v: number | string, name: string) => [`${v}%`, name]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend />
                    <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
                      label={{ value: "Recommended Max", position: "insideTopRight", fontSize: 8, fill: "#92400e" }} />
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
                      label={{ value: "Capacity Limit", position: "insideTopRight", fontSize: 8, fill: "#991b1b" }} />
                    <Bar dataKey="before" name="Before Improvement" fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.75} />
                    <Bar dataKey="after"  name="After Improvement"  radius={[3, 3, 0, 0]}>
                      {chartData.map((d) => (
                        <Cell
                          key={d.key}
                          fill={d.isImproved ? "#22c55e" : d.isBottleneck ? "#ef4444" : "#6366f1"}
                          opacity={d.isImproved ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-slate-400 italic text-center mt-1">
                  Utilization computed from your 8-week S&OP plan at the selected capacity mode.
                  {bd2.true_bottleneck && (
                    <> True bottleneck: <span className="capitalize font-medium text-red-500">{bd2.true_bottleneck}</span> at {bd2.true_bottleneck_util}%.</>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Chart 5: Weekly Production vs Demand — collapsible */}
      {(() => {
        const forecastA = m1Context?.forecastA ?? 17800;
        const forecastB = m1Context?.forecastB ?? 9000;
        const weeklyDemand = Math.round(((forecastA + forecastB) / 30) * 7);
        const snapSopA = result._snap?.sopA ?? sopA;
        const snapSopB = result._snap?.sopB ?? sopB;
        const weeklyData = snapSopA.map((a, i) => {
          const production = a + (snapSopB[i] ?? 0);
          const demand = weeklyDemand;
          const surplus = Math.max(0, production - demand);
          const deficit = Math.max(0, demand - production);
          return { week: `W${i + 1}`, production, demand, surplus, deficit };
        });
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                S&OP Plan vs Demand — 8 Weeks
              </CardTitle>
            </CardHeader>
            <CardContent className={weeklyChartOpen ? "" : "pb-3"}>
              {!weeklyChartOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setWeeklyChartOpen(true)}
                >
                  <BarChart3 className="w-4 h-4" />
                  📊 View Weekly Plan Chart
                  <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                </Button>
              )}
              {weeklyChartOpen && (
                <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 mb-2 text-slate-500"
                  onClick={() => setWeeklyChartOpen(false)}
                >
                  <ChevronUp className="w-4 h-4" /> Collapse chart
                </Button>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={weeklyData} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => Number(v) >= 1000 ? `${(Number(v)/1000).toFixed(0)}k` : String(v)}
                      tick={{ fontSize: 10 }}
                      label={{ value: "Units / Week", angle: -90, position: "insideLeft", offset: -4, fontSize: 10 }} />
                    <ReTooltip
                      formatter={(v: number | string, name: string) => {
                        const labels: Record<string, string> = {
                          production: "Planned Production",
                          demand: "Forecasted Demand",
                          surplus: "Surplus (green)",
                          deficit: "Shortfall (red)",
                        };
                        return [Number(v).toLocaleString(), labels[name] ?? name];
                      }}
                      contentStyle={{ fontSize: 12 }} />
                    <Legend formatter={(val) => {
                      const m: Record<string, string> = {
                        production: "Planned Production",
                        demand: "Forecasted Demand",
                      };
                      return m[val] ?? val;
                    }} />
                    {/* Green surplus shading: stacked from demand up to production */}
                    <Area type="monotone" dataKey="demand" stackId="g" fill="transparent" stroke="none" legendType="none" />
                    <Area type="monotone" dataKey="surplus" stackId="g" fill="rgba(34,197,94,0.35)" stroke="none" legendType="none" name="surplus" />
                    {/* Red deficit shading: stacked from production up to demand */}
                    <Area type="monotone" dataKey="production" stackId="r" fill="transparent" stroke="none" legendType="none" />
                    <Area type="monotone" dataKey="deficit" stackId="r" fill="rgba(239,68,68,0.30)" stroke="none" legendType="none" name="deficit" />
                    {/* Lines on top */}
                    <Line type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} name="production" />
                    <Line type="monotone" dataKey="demand" stroke="#f97316" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: "#f97316" }} name="demand" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-5 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400/50 inline-block" /> Production &gt; Demand (surplus)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400/40 inline-block" /> Production &lt; Demand (shortfall)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  Demand = baseline forecast from M1 data. Actual stochastic demand varies ±15%.
                </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })()}
      {/* Weekly Work-Center Load — collapsible mini-charts */}
      {(() => {
        const snapSopA = result._snap?.sopA ?? sopA;
        const snapSopB = result._snap?.sopB ?? sopB;
        const snapMode = result._snap?.capacityMode ?? capacityMode;
        const scale = (CAPACITY_DAILY[snapMode] ?? 800) / 800;

        const wcWeeklyData = WC_SAM.map(({ key, label, samA, samB, capBase }) => {
          const weeklyAvail = capBase * scale * 7;
          const weeks = snapSopA.map((a, i) => {
            const required = a * samA + (snapSopB[i] ?? 0) * samB;
            const util = weeklyAvail > 0 ? Math.round((required / weeklyAvail) * 1000) / 10 : 0;
            return { week: `W${i + 1}`, util, over100: util > 100 };
          });
          const maxUtil = Math.max(...weeks.map((w) => w.util));
          const hasOverCapacity = weeks.some((w) => w.util > 100);
          const hasAmber = weeks.some((w) => w.util > 85 && w.util <= 100);
          return { key, label, weeks, maxUtil, hasOverCapacity, hasAmber };
        });

        const anyOver = wcWeeklyData.some((wc) => wc.hasOverCapacity);

        return (
          <Card>
            <CardHeader className="pb-2">
              <button
                type="button"
                className="flex items-center justify-between w-full text-left"
                onClick={() => setWcWeeklyOpen((v) => !v)}
              >
                <CardTitle className="text-sm flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-600" />
                  Weekly Work-Center Load
                  {anyOver && (
                    <span className="ml-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      ⚠ Over-capacity weeks
                    </span>
                  )}
                </CardTitle>
                {wcWeeklyOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              <p className="text-xs text-slate-500 text-left">
                Week-by-week utilization % per work center — spot which weeks push a centre over capacity.
              </p>
            </CardHeader>
            {wcWeeklyOpen && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wcWeeklyData.map(({ key, label, weeks, maxUtil, hasOverCapacity }) => {
                    const yDom: [number, number] = [0, Math.max(120, maxUtil * 1.1)];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                          <span>{label}</span>
                          {hasOverCapacity && (
                            <span className="text-red-600 text-[10px] font-semibold">⚠ Over capacity</span>
                          )}
                        </div>
                        <ResponsiveContainer width="100%" height={140}>
                          <ComposedChart data={weeks} margin={{ top: 6, right: 8, bottom: 4, left: -8 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                            <YAxis
                              domain={yDom}
                              tickFormatter={(v) => `${v}%`}
                              tick={{ fontSize: 9 }}
                              width={36}
                            />
                            <ReTooltip
                              formatter={(v: number | string) => [`${v}%`, "Utilization"]}
                              contentStyle={{ fontSize: 11 }}
                            />
                            {/* 85% reference */}
                            <ReferenceLine
                              y={85}
                              stroke="#f59e0b"
                              strokeDasharray="4 2"
                              strokeWidth={1.2}
                              label={{ value: "85%", position: "right", fontSize: 8, fill: "#92400e" }}
                            />
                            {/* 100% reference */}
                            <ReferenceLine
                              y={100}
                              stroke="#ef4444"
                              strokeDasharray="4 2"
                              strokeWidth={1.5}
                              label={{ value: "100%", position: "right", fontSize: 8, fill: "#991b1b" }}
                            />
                            {/* Area fill — red above 100, amber 85–100, green below */}
                            <Area
                              type="monotone"
                              dataKey="util"
                              stroke="none"
                              fill="rgba(99,102,241,0.12)"
                              legendType="none"
                              isAnimationActive={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="util"
                              strokeWidth={2}
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const u = payload.util as number;
                                const fill =
                                  u > 100 ? "#ef4444" :
                                  u > 85  ? "#f59e0b" : "#22c55e";
                                return <circle key={`dot-${payload.week}`} cx={cx} cy={cy} r={3.5} fill={fill} stroke="#fff" strokeWidth={1} />;
                              }}
                              stroke="#6366f1"
                              isAnimationActive={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> ≤ 85% efficient</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 85–100% loaded</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &gt; 100% over-capacity</span>
                  <span className="ml-auto italic text-slate-400 hidden sm:inline">Dot colour = week status · dashes = 85% and 100% thresholds</span>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })()}

      <Button variant="outline" onClick={onDownload} className="w-full gap-2">
        <FileDown className="w-4 h-4" /> Download Report
      </Button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Module2Page() {
  const images = useModuleImages();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── S&OP plan state ──
  const [sopA, setSopA] = useState<number[]>([...DEFAULT_SOP_A]);
  const [sopB, setSopB] = useState<number[]>([...DEFAULT_SOP_B]);

  // ── Policy state ──
  const [capacityMode, setCapacityMode] = useState<string>("overtime");
  const [lotSize, setLotSize] = useState<string>("medium");
  const [priorityRule, setPriorityRule] = useState<string>("balanced");
  const [safetyStock, setSafetyStock] = useState<string>("6_dos");

  // ── v3 new decision state ──
  const [bottleneckTarget, setBottleneckTarget] = useState<string>("none");
  const [trainingChoice, setTrainingChoice] = useState<string>("none");
  const [layoutChoice, setLayoutChoice] = useState<string>("functional");
  const [flowChoice, setFlowChoice] = useState<string>("cellular");
  const [leanChoice, setLeanChoice] = useState<string>("none");

  const [justification, setJustification] = useState<string>("");

  // ── App state ──
  const [isPracticing, setIsPracticing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SimResult | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [m1Context, setM1Context] = useState<M1Context | null>(null);

  // ── Load module status ──
  const { data: moduleData, isLoading } = useGetModuleData("M2", {
    query: { queryKey: getGetModuleDataQueryKey("M2"), retry: false },
  });
  const { data: currentUser } = useGetCurrentUser();

  // ── Load M1 context ──
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/student/modules/M2/m1-context`, { credentials: "include" })
      .then((r) => r.json())
      .then(setM1Context)
      .catch(() => {});
  }, []);

  const isSubmitted = moduleData?.isSubmitted ?? false;
  const recentRuns = moduleData?.recentRuns ?? [];
  const practiceCount = moduleData?.practiceCount ?? 0;
  const practiceAtLimit = practiceCount >= 4;

  // ── Helpers ──
  const buildPayload = useCallback(
    () => ({
      sopPlanA: sopA,
      sopPlanB: sopB,
      capacityMode,
      lotSize,
      priorityRule,
      safetyStock,
      justification,
      bottleneckTarget,
      trainingChoice,
      layoutChoice,
      flowChoice,
      leanChoice,
    }),
    [sopA, sopB, capacityMode, lotSize, priorityRule, safetyStock, justification,
     bottleneckTarget, trainingChoice, layoutChoice, flowChoice, leanChoice],
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey("M2") });
    queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
  }, [queryClient]);

  const handleDownloadReport = useCallback(() => {
    if (!lastResult) return;
    const snap = (lastResult as any)._snap ?? {};
    openSimulationReport({
      moduleKey: "M2",
      isPractice: !lastResult.isFinal,
      studentName: currentUser?.name ?? "Student",
      studentId: currentUser?.studentId ?? null,
      section: currentUser?.section ?? null,
      completedAt: new Date(),
      runNumber: lastResult.runNumber,
      decisions: {
        sopA: snap.sopA ?? sopA,
        sopB: snap.sopB ?? sopB,
        capacityMode: snap.capacityMode ?? capacityMode,
        lotSize, priorityRule, safetyStock,
        bottleneckTarget, trainingChoice, layoutChoice, flowChoice, leanChoice,
      },
      result: lastResult as any,
      justification,
    });
  }, [lastResult, currentUser, sopA, sopB, capacityMode, lotSize, priorityRule,
      safetyStock, bottleneckTarget, trainingChoice, layoutChoice, flowChoice, leanChoice, justification]);

  const handlePractice = async () => {
    setIsPracticing(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/student/modules/M2/practice`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Practice Failed", description: data.error ?? "An error occurred." });
        return;
      }
      setLastResult({ ...data, isFinal: false, _snap: { capacityMode, sopA: [...sopA], sopB: [...sopB] } });
      invalidate();
      toast({ title: "Practice Run Complete", description: `Run #${data.runNumber} scored ${data.score}/${data.maxScore}` });
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Could not reach the server." });
    } finally {
      setIsPracticing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/student/modules/M2/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Submit Failed", description: data.error ?? "An error occurred." });
        return;
      }
      setLastResult({ ...data, isFinal: true, _snap: { capacityMode, sopA: [...sopA], sopB: [...sopB] } });
      invalidate();
      toast({ title: "Module 2 Submitted!", description: `Final score: ${data.score}/${data.maxScore} — Module 3 is now unlocked.` });
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Could not reach the server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading / Error states ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>

        {/* Module 2 banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-40 md:h-52 shadow-md">
          <img
            src={`${import.meta.env.BASE_URL}img/banner-module2.png`}
            alt="Manufacturing operations and production planning"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-center px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Module 2</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Operations Planning</h2>
            <p className="text-white/70 text-sm">MRP, capacity planning &amp; production scheduling — Porto Manufacturing Campus</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Factory className="w-6 h-6 text-indigo-600" />
              Module 2: Operations Planning & Manufacturing
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Sofia Costa · Porto Manufacturing Campus · 56-Day Production Simulation
            </p>
            {!isSubmitted && moduleData?.windowEnabled !== false && (() => {
              const windowEnd = moduleData?.windowEnd ? new Date(moduleData.windowEnd) : null;
              const windowStart = moduleData?.windowStart ? new Date(moduleData.windowStart) : null;
              if (windowStart && isFuture(windowStart)) {
                return (
                  <span className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    Opens {format(windowStart, "MMM d, yyyy")}
                  </span>
                );
              }
              if (windowEnd && isPast(windowEnd)) {
                return (
                  <span className="text-sm text-red-600 font-medium flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Window Closed
                  </span>
                );
              }
              if (windowEnd) {
                const daysLeft = differenceInDays(windowEnd, new Date());
                const isClosingSoon = daysLeft >= 0 && daysLeft <= 7;
                return (
                  <span className={`text-sm flex items-center gap-1.5 mt-1 ${isClosingSoon ? "text-amber-600 font-medium" : "text-slate-500"}`}>
                    Closes {format(windowEnd, "MMM d, yyyy")}
                    {isClosingSoon && ` (${daysLeft === 0 ? "today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`})`}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Student Guide
          </Button>
          <Badge
            variant={isSubmitted ? "default" : "secondary"}
            className={`text-sm px-3 py-1 ${isSubmitted ? "bg-green-600" : ""}`}
          >
            {isSubmitted ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Submitted
              </span>
            ) : (
              "In Progress"
            )}
          </Badge>
        </div>
      </motion.div>

      {/* ── M1 Context Banner ── */}
      {m1Context && <M1Banner ctx={m1Context} />}

      {/* ── Visual S&OP Chart ── */}
      <SopChart sopA={sopA} sopB={sopB} capacityMode={capacityMode} />

      {/* ── Live WC Capacity Preview ── */}
      <WcCapacityPanel
        sopA={sopA}
        sopB={sopB}
        capacityMode={capacityMode}
        bottleneckTarget={bottleneckTarget}
      />

      {/* ── Decision Form ── */}
      {!isSubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* 1. 8-Week S&OP Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                1 — 8-Week S&OP Production Plan
              </CardTitle>
              <CardDescription>
                Enter weekly production targets (units) for each SKU. These drive the 56-day daily
                simulation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img
                src={images.module2.sopPlan.src}
                alt={images.module2.sopPlan.alt}
                className="w-full rounded-md mb-2"
                style={{ height: "180px", objectFit: "cover" }}
                loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module2.sopPlan.src; if (t.src !== def) t.src = def; }}
                  />
              <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module2.sopPlan.caption}</p>
              <div className="mb-4 p-3 border-l-4 border-indigo-400 bg-indigo-50 rounded-r-lg text-xs text-indigo-900 space-y-1.5">
                <p className="font-semibold text-indigo-800">What is the Master Production Schedule (MPS)?</p>
                <p>The MPS translates your annual demand forecast into a week-by-week factory output plan: <em>how many units of each SKU should the factory produce each week?</em></p>
                <p><strong>Step 1</strong> — 8-week gross target = Annual forecast ÷ 52 weeks × 8 weeks</p>
                <p><strong>Step 2</strong> — Yield-adjust for lot-size changeover loss (units scrapped during machine changeovers):</p>
                <div className="grid grid-cols-3 gap-1.5 my-1.5 text-center">
                  <div className="bg-white/70 border border-indigo-200 rounded p-1.5">
                    <div className="font-semibold text-indigo-800 text-[11px]">Small lots</div>
                    <div className="text-[11px]">8% loss → ÷ 0.92</div>
                    <div className="text-[10px] text-indigo-600">14 changeovers/8-wk</div>
                  </div>
                  <div className="bg-indigo-100 border border-indigo-300 rounded p-1.5">
                    <div className="font-semibold text-indigo-800 text-[11px]">Medium lots</div>
                    <div className="text-[11px]">4% loss → ÷ 0.96</div>
                    <div className="text-[10px] text-indigo-600">7 changeovers/8-wk</div>
                  </div>
                  <div className="bg-white/70 border border-indigo-200 rounded p-1.5">
                    <div className="font-semibold text-indigo-800 text-[11px]">Large lots</div>
                    <div className="text-[11px]">2% loss → ÷ 0.98</div>
                    <div className="text-[10px] text-indigo-600">3 changeovers/8-wk</div>
                  </div>
                </div>
                <p><strong>Step 3</strong> — Distribute the yield-adjusted target across 8 weeks, adjusting for seasonal demand patterns</p>
                {m1Context && (
                  <p className="text-indigo-700 font-medium pt-0.5">
                    Worked example (your M1 forecasts, medium lots): SKU A → {Math.round(m1Context.forecastA / 52 * 8).toLocaleString()} gross units ÷ 0.96 ≈ <strong>{Math.round(m1Context.forecastA / 52 * 8 / 0.96).toLocaleString()} yield-adjusted units</strong> to schedule over 8 weeks
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-semibold text-slate-700 whitespace-nowrap">
                        SKU
                      </th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                        <th key={w} className="text-center py-2 px-2 font-semibold text-slate-700 whitespace-nowrap min-w-[90px]">
                          Week {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                          SKU A — Trend Tee
                        </div>
                      </td>
                      {sopA.map((val, i) => (
                        <td key={i} className="px-1 py-1">
                          <Input
                            type="number"
                            min={0}
                            step={100}
                            value={val}
                            onChange={(e) => {
                              const updated = [...sopA];
                              updated[i] = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setSopA(updated);
                            }}
                            className="text-center h-8 text-sm"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                          SKU B — Core Jogger
                        </div>
                      </td>
                      {sopB.map((val, i) => (
                        <td key={i} className="px-1 py-1">
                          <Input
                            type="number"
                            min={0}
                            step={100}
                            value={val}
                            onChange={(e) => {
                              const updated = [...sopB];
                              updated[i] = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setSopB(updated);
                            }}
                            className="text-center h-8 text-sm"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-slate-50 border-t">
                      <td className="py-1 pr-4 text-xs font-medium text-slate-500">Weekly Total</td>
                      {sopA.map((a, i) => (
                        <td key={i} className="px-2 py-1 text-center text-xs font-medium text-slate-600">
                          {(a + sopB[i]).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                <div className="bg-indigo-50 rounded p-2 text-center">
                  <div className="text-slate-500">Total Planned A</div>
                  <div className="font-bold text-indigo-700">
                    {sopA.reduce((s, x) => s + x, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 rounded p-2 text-center">
                  <div className="text-slate-500">Total Planned B</div>
                  <div className="font-bold text-green-700">
                    {sopB.reduce((s, x) => s + x, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-100 rounded p-2 text-center">
                  <div className="text-slate-500">Total Combined</div>
                  <div className="font-bold">
                    {(sopA.reduce((s, x) => s + x, 0) + sopB.reduce((s, x) => s + x, 0)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-100 rounded p-2 text-center">
                  <div className="text-slate-500">Weekly Capacity</div>
                  <div className="font-bold">
                    {((CAPACITY_DAILY[capacityMode] ?? 800) * 7).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOM & Work Centre Reference */}
          <BomPanel />

          {/* 2. Operations Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                2 — Factory Operations Policies
              </CardTitle>
              <CardDescription>
                Configure your capacity, lot sizing, priority, and safety stock policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img
                src={images.module2.factoryOperations.src}
                alt={images.module2.factoryOperations.alt}
                className="w-full rounded-md mb-2"
                style={{ height: "180px", objectFit: "cover" }}
                loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module2.factoryOperations.src; if (t.src !== def) t.src = def; }}
                  />
              <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module2.factoryOperations.caption}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Capacity Mode</Label>
                  <Select value={capacityMode} onValueChange={setCapacityMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard — 800 units/day · €480/day</SelectItem>
                      <SelectItem value="overtime">Overtime — 1,050 units/day · €680/day</SelectItem>
                      <SelectItem value="two_shift">Two-Shift — 1,500 units/day · €990/day</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Weekly capacity: {((CAPACITY_DAILY[capacityMode] ?? 800) * 7).toLocaleString()} units
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Lot Sizing Strategy</Label>
                  <Select value={lotSize} onValueChange={setLotSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small — 14 changeovers/week · 8% loss</SelectItem>
                      <SelectItem value="medium">Medium — 7 changeovers/week · 4% loss</SelectItem>
                      <SelectItem value="large">Large — 3 changeovers/week · 2% loss</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Changeover cost: €800 each × 8 weeks × changeovers/week
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority Rule</Label>
                  <Select value={priorityRule} onValueChange={setPriorityRule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced — Proportional split</SelectItem>
                      <SelectItem value="priority_a">Priority SKU A — Trend Tee first</SelectItem>
                      <SelectItem value="priority_b">Priority SKU B — Core Jogger first</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Determines which SKU gets capacity when daily total exceeds limit
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Safety Stock Policy</Label>
                  <Select value={safetyStock} onValueChange={setSafetyStock}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3_dos">3 Days of Supply — Low buffer</SelectItem>
                      <SelectItem value="6_dos">6 Days of Supply — Medium buffer</SelectItem>
                      <SelectItem value="9_dos">9 Days of Supply — High buffer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Initial inventory buffer; high buffer raises holding cost but reduces stockouts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3 — Bottleneck & Capacity Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                3 — Bottleneck & Capacity Improvement
              </CardTitle>
              <CardDescription>
                Review the work-center SAM data in the Student Guide. Which work center is your
                bottleneck? Select an improvement — or choose "No improvement" if utilization is
                acceptable. Investment costs are included in total cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <img
                src={images.module2.bottleneck.src}
                alt={images.module2.bottleneck.alt}
                className="w-full rounded-md"
                style={{ height: "180px", objectFit: "cover" }}
                loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module2.bottleneck.src; if (t.src !== def) t.src = def; }}
                  />
              <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module2.bottleneck.caption}</p>
              <div className="space-y-1.5">
                <Label>Capacity Improvement Decision</Label>
                <Select value={bottleneckTarget} onValueChange={setBottleneckTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No improvement needed (€0)</SelectItem>
                    <SelectItem value="cutting_modify">Modify Cutting — Auto-spreader (+20%, €18,000)</SelectItem>
                    <SelectItem value="cutting_buy">Buy New Cutting Table (+45%, €42,000)</SelectItem>
                    <SelectItem value="dyeing_modify">Modify Dyeing — Batch controller (+20%, €26,000)</SelectItem>
                    <SelectItem value="dyeing_buy">Buy New Dye Vessel/Line (+45%, €65,000)</SelectItem>
                    <SelectItem value="sewing_modify">Modify Sewing — Line balancing aids (+20%, €22,000)</SelectItem>
                    <SelectItem value="sewing_buy">Buy New Sewing Module (+50%, €95,000)</SelectItem>
                    <SelectItem value="packaging_modify">Modify Packaging — Conveyor/scanner (+20%, €14,000)</SelectItem>
                    <SelectItem value="packaging_buy">Buy New Packing Line (+45%, €30,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
                <strong>Grading note:</strong> Choosing the correct bottleneck work center earns up to 10 pts.
                Choosing the wrong work center or missing a critical bottleneck results in partial credit.
                Use the work-center SAM table in the Student Guide to identify the true bottleneck.
              </div>
            </CardContent>
          </Card>

          {/* 4 — Workforce Training & Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                4 — Workforce Training & Quality Improvement
              </CardTitle>
              <CardDescription>
                Current scrap/rework rates: SKU A = 4.5%, SKU B = 5.5%. Training reduces these
                losses and improves effective output. Costs are one-time investments included in
                total cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <img
                src={images.module2.workforceTraining.src}
                alt={images.module2.workforceTraining.alt}
                className="w-full rounded-md"
                style={{ height: "180px", objectFit: "cover" }}
                loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module2.workforceTraining.src; if (t.src !== def) t.src = def; }}
                  />
              <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module2.workforceTraining.caption}</p>
              <div className="space-y-1.5">
                <Label>Training Investment</Label>
                <Select value={trainingChoice} onValueChange={setTrainingChoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No formal training (€0)</SelectItem>
                    <SelectItem value="green_belt">Six Sigma Green Belt — Team Training (€7,500 · Scrap ↓20%, Rework ↓15%, Setup ↓5%)</SelectItem>
                    <SelectItem value="black_belt">Six Sigma Black Belt — Improvement Project (€16,000 · Scrap ↓35%, Rework ↓25%, Setup ↓8%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                <strong>Effect:</strong> Training reduces the lot-sizing yield loss and scrap/rework cost.
                Check your Scrap/Rework Cost KPI after a practice run to evaluate whether training investment is justified.
              </div>
            </CardContent>
          </Card>

          {/* 5 — Factory Layout & Lean */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                5 — Factory Layout & Lean Initiatives
              </CardTitle>
              <CardDescription>
                Layout and flow affect changeover efficiency. Lean initiatives reduce holding cost,
                defects, or downtime. All costs are one-time investments included in total cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={images.module2.leanLayout.src}
                alt={images.module2.leanLayout.alt}
                className="w-full rounded-md"
                style={{ height: "180px", objectFit: "cover" }}
                loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module2.leanLayout.src; if (t.src !== def) t.src = def; }}
                  />
              <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module2.leanLayout.caption}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Factory Layout</Label>
                  <Select value={layoutChoice} onValueChange={setLayoutChoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional Layout — shared equipment by function</SelectItem>
                      <SelectItem value="product">Product Layout — dedicated line per SKU</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Functional + Cellular = 20% fewer effective changeovers
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Production Flow Model</Label>
                  <Select value={flowChoice} onValueChange={setFlowChoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cellular">Cellular Manufacturing — mini-lines per product family</SelectItem>
                      <SelectItem value="batch">Traditional Batch Production</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Supports style changeover flexibility and WIP reduction
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Lean / Quality-at-Source Initiative</Label>
                <Select value={leanChoice} onValueChange={setLeanChoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No lean initiative (€0)</SelectItem>
                    <SelectItem value="5s">5S + Visual Management (€3,000 · Motion losses ↓5%)</SelectItem>
                    <SelectItem value="poka_yoke">Poka-Yoke Devices (€6,500 · Sewing/packing defects ↓25%)</SelectItem>
                    <SelectItem value="andon">Andon Lights (€4,500 · Downtime ↓8%; disruptions partially recovered)</SelectItem>
                    <SelectItem value="poka_andon_bundle">Poka-Yoke + Andon Bundle (€10,000 · Best quality-at-source)</SelectItem>
                    <SelectItem value="lean_flow">Lean Flow Package — Kanban + Standard Work + Visual Control (€12,000 · WIP ↓25%, Cycle time ↓10%)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Lean reduces holding cost (lean flow), disruption impact (andon), or defects (poka-yoke)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6 — Strategic Justification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                6 — Strategic Justification
              </CardTitle>
              <CardDescription>
                Explain your S&OP strategy, bottleneck analysis, improvement choices, and how you
                accounted for M1 supplier variability. Include two MRP "need → release" examples (one SKU A,
                one SKU B).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={8}
                placeholder="Explain your 8-week production plan, how you identified and addressed the bottleneck, why you chose your training and lean investments, how you handled M1 lead time and reliability data, and why your capacity mode / lot sizing / safety stock / priority rule fit the Veloce Wear fast-fashion context. Include two MRP 'need → release' examples (one SKU A, one SKU B)."
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Practice Runs</span>
                <span className={`font-semibold ${practiceAtLimit ? "text-red-600" : "text-slate-700"}`}>
                  {practiceCount} / 4 used
                </span>
              </div>
              <Button
                onClick={handlePractice}
                disabled={isPracticing || isSubmitting || practiceAtLimit}
                variant="outline"
                className={`w-full gap-2 ${practiceAtLimit ? "opacity-50 cursor-not-allowed" : ""}`}
                size="lg"
                title={practiceAtLimit ? "Practice run limit reached — submit your final decision" : undefined}
              >
                {isPracticing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
                {isPracticing ? "Running Simulation…" : practiceAtLimit ? "Limit Reached" : "Run Practice Simulation"}
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isPracticing || isSubmitting}
                  className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Submitting…" : "Submit Final"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Module 2 Final?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will lock your Module 2 decisions permanently and record your score in the
                    gradebook. Module 3 will unlock after submission. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                    Confirm Final Submission
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      )}

      {/* ── Submitted Banner ── */}
      {isSubmitted && !lastResult && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-5 pb-5 text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h3 className="font-bold text-green-800 text-lg">Module 2 Submitted</h3>
            {moduleData?.finalSubmission && (
              <p className="text-2xl font-bold text-green-800 mt-1">
                {moduleData.finalSubmission.score}
                <span className="text-base font-normal text-green-700">/{moduleData.finalSubmission.maxScore ?? 50}</span>
              </p>
            )}
            <p className="text-green-700 text-sm mt-1">
              Your final score is recorded. Check your gradebook or continue to Module 3.
            </p>
            <Link href="/dashboard">
              <Button className="mt-4" variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Results Panel ── */}
      <AnimatePresence>
        {lastResult && (
          <ResultsPanel
            result={lastResult}
            sopA={sopA}
            sopB={sopB}
            m1Context={m1Context}
            capacityMode={capacityMode}
            onDownload={handleDownloadReport}
          />
        )}
      </AnimatePresence>

      {recentRuns.length > 0 && (
        <div className="space-y-4">
          <MultiRunRadarChart runs={recentRuns} moduleKey="M2" maxScore={50} />
          <KpiTrendChart runs={recentRuns} moduleKey="M2" maxScore={50} />
          <RunHistoryPanel runs={recentRuns} moduleKey="M2" maxScore={50} />
        </div>
      )}

      <GuideSheet
        open={guideOpen}
        onOpenChange={setGuideOpen}
        content={module2Guide}
        title="Module 2: Student Guide"
      />
    </div>
  );
}
