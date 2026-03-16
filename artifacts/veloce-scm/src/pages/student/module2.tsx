import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetModuleDataQueryKey,
  getGetStudentDashboardQueryKey,
  useGetModuleData,
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
  History,
  Info,
  BookOpen,
} from "lucide-react";
import { GuideSheet } from "@/components/GuideSheet";
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
} from "recharts";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

// ─── Constants ───────────────────────────────────────────────────────────────

const CAPACITY_DAILY: Record<string, number> = {
  standard: 800,
  overtime: 1050,
  two_shift: 1500,
};

// Weekly production targets scaled for corrected capacity (800-1500 units/day)
// Monthly demand: ~18,500 A + 9,200 B = ~27,700/mo → ~6,400/week combined
// Overtime mode (1,050/day × 7 = 7,350/week) handles this comfortably
const DEFAULT_SOP_A = [4200, 4300, 4400, 4400, 4500, 4500, 4100, 3900];
const DEFAULT_SOP_B = [2100, 2150, 2200, 2200, 2250, 2250, 2050, 1950];

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
    mrpLogic: number;
    justification: number;
    validity: number;
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
  };
  validationFlags: string[];
  feedback: string[];
  runNumber: number;
  isFinal: boolean;
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function M1Banner({ ctx }: { ctx: M1Context }) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-800 mb-2">
              {ctx.hasM1Data
                ? "Module 1 Data Imported — Your M1 results drive the M2 simulation"
                : "Using default M1 values — Complete Module 1 first for personalised results"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <div className="text-xs text-slate-500">Supplier Reliability</div>
                <div className="font-bold text-blue-700">{ctx.avgReliabilityPct.toFixed(1)}%</div>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <div className="text-xs text-slate-500">Avg Lead Time</div>
                <div className="font-bold text-blue-700">{ctx.avgLeadTimeDays.toFixed(1)} days</div>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <div className="text-xs text-slate-500">Forecast SKU A</div>
                <div className="font-bold text-blue-700">{fmt(ctx.forecastA)} /mo</div>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <div className="text-xs text-slate-500">Forecast SKU B</div>
                <div className="font-bold text-blue-700">{fmt(ctx.forecastB)} /mo</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
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
          line each week. Utilization 80–95% earns maximum MRP Logic points.
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsPanel({ result }: { result: SimResult }) {
  const bd = result.scoreBreakdown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Score header */}
      <Card className={result.isFinal ? "border-green-300 bg-green-50" : "border-indigo-200 bg-indigo-50"}>
        <CardContent className="pt-4 pb-4">
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

      {/* Score breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Performance Outcomes", key: "performance" as const, max: 30 },
            { label: "S&OP Planning Quality", key: "sopQuality" as const, max: 10 },
            { label: "MRP Logic & Utilization", key: "mrpLogic" as const, max: 8 },
            { label: "Strategic Justification", key: "justification" as const, max: 5 },
            { label: "Plan Validity", key: "validity" as const, max: 2 },
          ].map(({ label, key, max }) => {
            const val = bd?.[key] ?? 0;
            const pct = Math.min(100, (val / max) * 100);
            return (
              <div key={key}>
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

          {/* Cost breakdown */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-slate-600 mb-2">Cost Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                ["Capacity", euro(result.kpis.capacityCost)],
                ["Holding", euro(result.kpis.holdingCost)],
                ["Changeovers", euro(result.kpis.changeoverCost)],
                ["Stockouts", euro(result.kpis.stockoutCost)],
                ["Markdown", euro(result.kpis.markdownCost)],
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
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Module2Page() {
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
  const [justification, setJustification] = useState<string>("");

  // ── App state ──
  const [isPracticing, setIsPracticing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SimResult | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [m1Context, setM1Context] = useState<M1Context | null>(null);

  // ── Load module status ──
  const { data: moduleData, isLoading } = useGetModuleData("M2", {
    query: { retry: false },
  });

  // ── Load M1 context ──
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/student/modules/M2/m1-context`, { credentials: "include" })
      .then((r) => r.json())
      .then(setM1Context)
      .catch(() => {});
  }, []);

  const isSubmitted = moduleData?.isLocked ?? false;
  const recentRuns = moduleData?.recentRuns ?? [];

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
    }),
    [sopA, sopB, capacityMode, lotSize, priorityRule, safetyStock, justification],
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey("M2") });
    queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
  }, [queryClient]);

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
      setLastResult({ ...data, isFinal: false });
      invalidate();
      toast({ title: "Practice Run Complete", description: `Run #${data.runNumber} scored ${data.score}/55` });
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
      setLastResult({ ...data, isFinal: true });
      invalidate();
      toast({ title: "Module 2 Submitted!", description: `Final score: ${data.score}/55 — Module 3 is now unlocked.` });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Factory className="w-6 h-6 text-indigo-600" />
              Module 2: Operations Planning & MRP
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Veloce Wear Manufacturing — Porto Factory · 56-Day Production Simulation
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

          {/* 3. Justification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                3 — Strategic Justification
              </CardTitle>
              <CardDescription>
                Explain your S&OP strategy and how you accounted for M1 supplier variability.
                ≥500 characters for full points (5 pts). ≥300 for partial (4 pts).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={8}
                placeholder="Explain your 8-week production plan, how you handled M1 lead time and reliability data, why you chose your capacity mode / lot sizing / safety stock / priority rule, and how your decisions align with Veloce Wear's mission of quality, sustainability, and supply chain agility..."
                className="resize-none"
              />
              <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                <span>
                  {justification.length < 300 && (
                    <span className="text-red-500">
                      Need {300 - justification.length} more characters for 4 pts
                    </span>
                  )}
                  {justification.length >= 300 && justification.length < 500 && (
                    <span className="text-yellow-600">
                      {500 - justification.length} more characters for full 5 pts
                    </span>
                  )}
                  {justification.length >= 500 && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Full justification points earned
                    </span>
                  )}
                </span>
                <span>{justification.length} characters</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePractice}
              disabled={isPracticing || isSubmitting}
              variant="outline"
              className="flex-1 gap-2"
              size="lg"
            >
              {isPracticing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {isPracticing ? "Running Simulation…" : "Run Practice Simulation"}
            </Button>

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
        {lastResult && <ResultsPanel result={lastResult} />}
      </AnimatePresence>

      {recentRuns.length > 0 && (
        <RunHistoryPanel runs={recentRuns} />
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
