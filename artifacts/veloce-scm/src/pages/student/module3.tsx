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
  Package,
  CheckCircle,
  AlertTriangle,
  Network,
  Truck,
  Info,
  Leaf,
  BarChart3,
  BookOpen,
  DollarSign,
  Calculator,
} from "lucide-react";
import { GuideSheet } from "@/components/GuideSheet";
import { RunHistoryPanel } from "@/components/RunHistoryPanel";
import { module3Guide } from "@/guides/module3Guide";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface M3Context {
  hasM1Data: boolean;
  hasM2Data: boolean;
  forecastA: number;
  forecastB: number;
  m2ServiceLevel: number;
  m2CapacityUtilization: number;
}

interface MathBenchmark {
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

interface M3Result {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: {
    performance: number;
    inventoryMath: number;
    policyReasoning: number;
    validity: number;
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

// ─── Network / Service reference ─────────────────────────────────────────────

const NETWORK_LEAD_TIMES: Record<string, { min: number; max: number }> = {
  centralized:   { min: 5, max: 10 },
  hybrid:        { min: 3, max: 7  },
  decentralized: { min: 1, max: 4  },
};

// ─── Saw-tooth chart data generator ──────────────────────────────────────────

function generateRopqData(rop: number, q: number, dailyDemand: number, avgLeadTime: number) {
  const data: Array<{ day: string; inventory: number; rop: number; safetyStock: number }> = [];
  let inventory = rop + q;
  let orderPlaced = false;
  let orderArrivalDay = -1;
  const safetyStock = Math.max(0, rop - dailyDemand * avgLeadTime);

  for (let day = 0; day <= 42; day++) {
    if (orderArrivalDay === day) {
      inventory += q;
      orderPlaced = false;
      orderArrivalDay = -1;
    }
    data.push({
      day: `D${day}`,
      inventory: Math.max(0, inventory),
      rop,
      safetyStock: Math.max(0, safetyStock),
    });
    inventory -= dailyDemand;
    if (inventory <= rop && !orderPlaced && orderArrivalDay === -1 && q > 0) {
      orderPlaced = true;
      orderArrivalDay = day + Math.round(avgLeadTime);
    }
  }
  return data;
}

// ─── Helper: letter-grade colour ─────────────────────────────────────────────

function gradeColor(grade: string) {
  if (grade === "A") return "text-emerald-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-amber-600";
  return "text-red-600";
}

// ─── Module 3 Page ────────────────────────────────────────────────────────────

export default function Module3Page() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Module status
  const { data: moduleData, isLoading: moduleLoading } = useGetModuleData("M3");

  // M3 context (M1+M2 imported data)
  const [m3Context, setM3Context] = useState<M3Context | null>(null);
  const [contextLoading, setContextLoading] = useState(true);

  // Decision state
  const [networkStrategy, setNetworkStrategy] = useState<"centralized" | "hybrid" | "decentralized">("hybrid");
  const [serviceMode, setServiceMode] = useState<"standard" | "express" | "mixed">("standard");
  const [serviceLevel, setServiceLevel] = useState("0.95");
  const [rop, setRop] = useState(4500);
  const [q, setQ] = useState(9000);
  const [forecastMethod, setForecastMethod] = useState("moving_average");
  const [justification, setJustification] = useState("");

  // Submission state
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<M3Result | null>(null);
  const [runType, setRunType] = useState<"practice" | "final" | null>(null);
  const [submittedRop, setSubmittedRop] = useState<number | null>(null);
  const [submittedQ, setSubmittedQ] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // Load M3 context
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/student/modules/M3/context`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setM3Context(d))
      .catch(() => {})
      .finally(() => setContextLoading(false));
  }, []);

  // Derived values for chart
  const dailyDemand = useMemo(() => {
    const fA = m3Context?.forecastA ?? 17800;
    const fB = m3Context?.forecastB ?? 9000;
    return Math.round((fA + fB) / 30);
  }, [m3Context]);

  const avgLeadTime = useMemo(() => {
    const lt = NETWORK_LEAD_TIMES[networkStrategy];
    return (lt.min + lt.max) / 2;
  }, [networkStrategy]);

  const chartData = useMemo(
    () => generateRopqData(rop, q, dailyDemand, avgLeadTime),
    [rop, q, dailyDemand, avgLeadTime],
  );

  // Submit practice or final
  const handleSubmit = useCallback(
    async (type: "practice" | "final") => {
      if (!justification.trim()) {
        toast({ title: "Justification required", description: "Please enter your strategic justification.", variant: "destructive" });
        return;
      }
      setIsRunning(true);
      setRunType(type);
      setResult(null);
      setSubmittedRop(rop);
      setSubmittedQ(q);

      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const endpoint = type === "practice"
        ? `${base}/api/student/modules/M3/practice`
        : `${base}/api/student/modules/M3/submit`;

      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            networkStrategy,
            serviceMode,
            serviceLevel: parseFloat(serviceLevel),
            rop,
            q,
            forecastMethod,
            justification,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error ?? "Simulation failed");

        setResult(data as M3Result);
        queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey("M3") });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });

        if (type === "final") {
          toast({
            title: "🎓 Course Complete!",
            description: `Module 3 submitted — score ${data.score}/55 (${data.letterGrade})`,
          });
        } else {
          toast({
            title: "Practice run complete",
            description: `Score: ${data.score}/55 (${data.letterGrade}) — keep improving!`,
          });
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsRunning(false);
      }
    },
    [networkStrategy, serviceMode, serviceLevel, rop, q, forecastMethod, justification, toast, queryClient],
  );

  const isSubmitted = moduleData?.isSubmitted ?? false;

  if (moduleLoading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Module 3: Distribution Network &amp; Inventory Policy</h1>
          <p className="text-sm text-gray-500">Veloce Wear Global Fulfillment Strategy — 90-Day Simulation</p>
          {!isSubmitted && moduleData?.windowEnabled !== false && (() => {
            const windowEnd = moduleData?.windowEnd ? new Date(moduleData.windowEnd) : null;
            const windowStart = moduleData?.windowStart ? new Date(moduleData.windowStart) : null;
            if (windowStart && isFuture(windowStart)) {
              return (
                <span className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
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
                <span className={`text-sm flex items-center gap-1.5 mt-1 ${isClosingSoon ? "text-amber-600 font-medium" : "text-gray-500"}`}>
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
        {isSubmitted ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Course Complete
          </Badge>
        ) : (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Trophy className="h-3 w-3 mr-1" /> Final Module
          </Badge>
        )}
      </div>

      {/* M1/M2 Context Banner */}
      {m3Context && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-2">
                  📊 Context Imported from Your Previous Modules
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white/70 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-xs">M1 Forecast SKU A</p>
                    <p className="font-bold text-gray-900">{(m3Context.forecastA).toLocaleString()} units</p>
                  </div>
                  <div className="bg-white/70 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-xs">M1 Forecast SKU B</p>
                    <p className="font-bold text-gray-900">{(m3Context.forecastB).toLocaleString()} units</p>
                  </div>
                  <div className="bg-white/70 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-xs">M2 Service Level</p>
                    <p className={`font-bold ${m3Context.m2ServiceLevel >= 95 ? "text-emerald-700" : m3Context.m2ServiceLevel >= 90 ? "text-amber-700" : "text-red-700"}`}>
                      {m3Context.m2ServiceLevel.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-xs">Daily Demand Avg</p>
                    <p className="font-bold text-gray-900">~{dailyDemand.toLocaleString()} units</p>
                  </div>
                </div>
                {m3Context.m2ServiceLevel < 92 && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠️ Your M2 service level was below 92% — this widens lead time variability in M3. A higher ROP is recommended.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitted banner */}
      {isSubmitted && moduleData?.finalSubmission && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800">🎓 Congratulations — Course Complete!</p>
                <p className="text-sm text-emerald-700">
                  Module 3 Final Score: <strong>{moduleData.finalSubmission.score}/55</strong> ·
                  Submitted {moduleData.finalSubmission.submittedAt ? format(new Date(moduleData.finalSubmission.submittedAt), "MMM d, yyyy 'at' h:mm a") : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── INTERACTIVE ROP/Q VISUALIZER ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Interactive ROP/Q Inventory Visualizer
          </CardTitle>
          <CardDescription>
            Real-time saw-tooth model — adjust ROP and Q below to see your inventory cycle over 42 days.
            Green = on-hand inventory · Red dashed = reorder point · Gray area = safety stock buffer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis dataKey="day" interval={5} tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  tick={{ fontSize: 11 }}
                  label={{ value: "Units", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
                />
                <ReTooltip
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend />
                <ReferenceLine
                  y={rop}
                  label={{ value: "ROP", position: "right", fontSize: 11 }}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="safetyStock"
                  fill="#e2e8f0"
                  stroke="none"
                  name="Safety Stock Zone"
                  fillOpacity={0.8}
                />
                <Line
                  type="monotone"
                  dataKey="inventory"
                  name="On-Hand Inventory"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 When green line hits the red ROP line → order of Q units is placed → arrives in ~{avgLeadTime.toFixed(1)} days (based on {networkStrategy} network)
          </p>
        </CardContent>
      </Card>

      {/* ── DECISION FORM ── */}
      {!isSubmitted && (
        <>
          {/* Section 1: Network Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-5 w-5 text-blue-600" />
                1. Distribution Network Design
              </CardTitle>
              <CardDescription>Choose your DC footprint and shipping strategy</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Network Strategy</Label>
                <Select value={networkStrategy} onValueChange={(v) => setNetworkStrategy(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centralized">Centralized — Porto DC only (€0/wk, LT 5–10d)</SelectItem>
                    <SelectItem value="hybrid">Hybrid — Porto + NA DC (€22k/wk, LT 3–7d)</SelectItem>
                    <SelectItem value="decentralized">Decentralized — Porto + NA + APAC (€40k/wk, LT 1–4d)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Shipping Service Mode</Label>
                <Select value={serviceMode} onValueChange={(v) => setServiceMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Ground — €0.75/unit · 5d · 1× carbon</SelectItem>
                    <SelectItem value="express">Express Air — €1.10/unit · 2d · 2.5× carbon</SelectItem>
                    <SelectItem value="mixed">Mixed Strategy — €0.90/unit · 3d · 1.5× carbon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Network summary */}
              <div className="col-span-full grid grid-cols-3 gap-2 text-xs">
                {(["centralized", "hybrid", "decentralized"] as const).map((n) => (
                  <div
                    key={n}
                    className={`rounded-lg border p-2 transition-all ${networkStrategy === n ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                  >
                    <p className="font-semibold capitalize mb-1">{n}</p>
                    <p className="text-gray-600">LT: {NETWORK_LEAD_TIMES[n].min}–{NETWORK_LEAD_TIMES[n].max}d</p>
                    <p className="text-gray-600">DC: {n === "centralized" ? "€0" : n === "hybrid" ? "€22k" : "€40k"}/wk</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: ROP/Q Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-purple-600" />
                2. ROP/Q Inventory Policy
              </CardTitle>
              <CardDescription>
                Adjust the reorder point and order quantity — the chart above updates in real time.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="m3-rop">Reorder Point (ROP) — Units</Label>
                <Input
                  id="m3-rop"
                  type="number"
                  min={0}
                  value={rop}
                  onChange={(e) => setRop(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="text-xs text-gray-500">
                  Trigger a new order when inventory + pipeline ≤ ROP.
                  Suggested: ≥{Math.round(dailyDemand * avgLeadTime).toLocaleString()} units (~{avgLeadTime.toFixed(1)}d × {dailyDemand}/day)
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m3-q">Order Quantity (Q) — Units</Label>
                <Input
                  id="m3-q"
                  type="number"
                  min={1}
                  max={50000}
                  value={q}
                  onChange={(e) => setQ(Math.max(1, Math.min(50000, parseInt(e.target.value) || 1)))}
                />
                <p className="text-xs text-gray-500">
                  Units ordered each time ROP is hit.
                  Use EOQ = √(2DS/H) with S=€200, H=€3.60 (SKU A) / €6.00 (SKU B).
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2 max-w-sm">
                <Label htmlFor="m3-sl">Target Service Level (for SS calculation)</Label>
                <Select value={serviceLevel} onValueChange={setServiceLevel}>
                  <SelectTrigger id="m3-sl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.80">80% (Z = 0.84) — Minimum protection</SelectItem>
                    <SelectItem value="0.85">85% (Z = 1.04) — Moderate protection</SelectItem>
                    <SelectItem value="0.90">90% (Z = 1.28) — Good standard</SelectItem>
                    <SelectItem value="0.95">95% (Z = 1.65) — Industry standard</SelectItem>
                    <SelectItem value="0.98">98% (Z = 2.05) — High protection</SelectItem>
                    <SelectItem value="0.99">99% (Z = 2.33) — Maximum protection</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  The Z-score you used when calculating your Safety Stock (SS = Z × σd × √L).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Forecast Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                3. Demand Forecasting Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={forecastMethod} onValueChange={setForecastMethod}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moving_average">Moving Average (3-month)</SelectItem>
                  <SelectItem value="exponential_smoothing">Exponential Smoothing (α=0.3)</SelectItem>
                  <SelectItem value="seasonal">Seasonal Decomposition</SelectItem>
                  <SelectItem value="naive">Naïve (last period = next period)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Demand forecasting method influences how you set ROP and Q — justify your choice below.
              </p>
            </CardContent>
          </Card>

          {/* Section 4: Justification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-gray-600" />
                4. Strategic Justification
              </CardTitle>
              <CardDescription>
                Explain your network strategy choice, ROP/Q calculations (EOQ/SS/ROP formulas), service mode
                trade-offs, service level reasoning, and how M1/M2 results influenced your decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                placeholder="Discuss: Which network strategy did you choose and why? How did you calculate EOQ, Safety Stock, and ROP for each SKU? What service level did you target and why? What are the cost vs. carbon trade-offs of your service mode? How did M1 supplier reliability and M2 service level affect your M3 decisions?..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {justification.length} characters
                  {justification.length >= 400
                    ? " · ✅ Full 3 pts"
                    : justification.length >= 250
                    ? " · ⚡ 2 pts (add more for full marks)"
                    : justification.length >= 100
                    ? " · ⚠️ Under 250 chars — 1 pt only"
                    : " · ⚠️ Under 100 chars — 0 pts"}
                </p>
                <div className="flex gap-1 text-xs text-gray-400">
                  <span className={justification.length >= 250 ? "text-amber-600 font-medium" : ""}>250</span>
                  <span>/</span>
                  <span className={justification.length >= 400 ? "text-emerald-600 font-medium" : ""}>400</span>
                </div>
              </div>
              <Progress
                value={Math.min(100, (justification.length / 400) * 100)}
                className="h-1.5 mt-1"
              />
            </CardContent>
          </Card>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSubmit("practice")}
              disabled={isRunning}
            >
              {isRunning && runType === "practice" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running 90-Day Simulation…</>
              ) : (
                <><TrendingUp className="h-4 w-4 mr-2" /> Run Practice Simulation</>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isRunning}>
                  <Trophy className="h-4 w-4 mr-2" /> Submit Final &amp; Complete Course
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>🎓 Submit Module 3 Final</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will run your final 90-day distribution simulation and complete the SCM 4330 course.
                    Your score is permanent and cannot be changed. Make sure your justification is complete (≥400 chars for full points).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go Back</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleSubmit("final")}
                  >
                    Confirm Final Submission
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}

      {/* ── RESULTS PANEL ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Score header */}
            <Card className={`border-2 ${result.letterGrade === "A" ? "border-emerald-400" : result.letterGrade === "B" ? "border-blue-400" : result.letterGrade === "C" ? "border-amber-400" : "border-red-400"}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {runType === "final" ? "🎓 Final Score — Course Complete!" : "Practice Run Score"}
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {result.score}
                      <span className="text-xl text-gray-400">/55</span>
                      <span className={`text-2xl ml-3 font-bold ${gradeColor(result.letterGrade)}`}>
                        {result.letterGrade}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Fill Rate</p>
                    <p className={`text-2xl font-bold ${result.kpis.fillRate >= 94 ? "text-emerald-600" : result.kpis.fillRate >= 90 ? "text-blue-600" : "text-red-600"}`}>
                      {result.kpis.fillRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score breakdown (v3) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Performance — Fill Rate + Cost Efficiency", score: result.scoreBreakdown.performance, max: 30 },
                  { label: "Inventory Math — EOQ · Safety Stock · ROP", score: result.scoreBreakdown.inventoryMath, max: 15 },
                  { label: "Policy Quality & Reasoning",               score: result.scoreBreakdown.policyReasoning, max: 8 },
                  { label: "Validity & Completeness",                  score: result.scoreBreakdown.validity,        max: 2 },
                ].map(({ label, score, max }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{label}</span>
                      <span className="font-semibold">{score}/{max}</span>
                    </div>
                    <Progress value={(score / max) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* KPI grid — core metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Fill Rate",       value: `${result.kpis.fillRate.toFixed(1)}%`,          icon: <TrendingUp className="h-4 w-4" />,    color: result.kpis.fillRate >= 94 ? "text-emerald-600" : "text-red-600" },
                { label: "Total Cost",      value: `€${result.kpis.totalCost.toLocaleString()}`,   icon: <Package className="h-4 w-4" />,       color: "text-blue-600" },
                { label: "Carbon Footprint",value: `${result.kpis.totalCarbonKg.toLocaleString()} kg`, icon: <Leaf className="h-4 w-4" />,   color: result.kpis.totalCarbonKg > 50000 ? "text-red-600" : "text-emerald-600" },
                { label: "Stockouts",       value: result.kpis.totalStockouts.toLocaleString(),     icon: <AlertTriangle className="h-4 w-4" />, color: result.kpis.totalStockouts > 0 ? "text-red-600" : "text-emerald-600" },
              ].map(({ label, value, icon, color }) => (
                <Card key={label} className="border border-gray-100">
                  <CardContent className="pt-3 pb-2 px-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${color} text-xs`}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* KPI grid — v3 profit / margin */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Profit Margin %",
                  value: `${result.kpis.profitMarginPct.toFixed(1)}%`,
                  icon: <DollarSign className="h-4 w-4" />,
                  color: result.kpis.profitMarginPct >= 15 ? "text-emerald-600" : "text-red-600",
                },
                {
                  label: "Total Revenue",
                  value: `€${result.kpis.totalRevenue.toLocaleString()}`,
                  icon: <TrendingUp className="h-4 w-4" />,
                  color: "text-blue-600",
                },
                {
                  label: "Markdown Cost",
                  value: `€${result.kpis.markdownCost.toLocaleString()}`,
                  icon: <Package className="h-4 w-4" />,
                  color: result.kpis.markdownCost > 10000 ? "text-red-600" : "text-gray-700",
                },
                {
                  label: "Cost vs Target",
                  value: `${result.kpis.costVsTarget > 0 ? "+" : ""}${result.kpis.costVsTarget.toFixed(1)}%`,
                  icon: <BarChart3 className="h-4 w-4" />,
                  color: result.kpis.costVsTarget <= 5 ? "text-emerald-600" : result.kpis.costVsTarget <= 15 ? "text-amber-600" : "text-red-600",
                },
              ].map(({ label, value, icon, color }) => (
                <Card key={label} className="border border-gray-100">
                  <CardContent className="pt-3 pb-2 px-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${color} text-xs`}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cost breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Cost Breakdown (90 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    ["Shipping",            result.kpis.shippingCost],
                    ["DC Operations",       result.kpis.dcCost],
                    ["Holding",             result.kpis.holdingCost],
                    ["Transport",           result.kpis.transportCost],
                    ["Stockout Penalties",  result.kpis.stockoutCost],
                    ["Carbon Tax",          result.kpis.carbonTaxCost],
                    ["Markdown Cost",       result.kpis.markdownCost],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between bg-gray-50 rounded px-2 py-1.5">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium">€{(val as number).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Math Benchmark Detail Card (v3) */}
            {result.scoreBreakdown.mathBenchmark && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-800 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Inventory Math Benchmark Detail
                  </CardTitle>
                  <p className="text-xs text-purple-600">
                    How the engine scored your Q and ROP against formula-derived benchmarks
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="bg-white/70 rounded-lg px-3 py-2 text-xs">
                      <p className="text-purple-600 mb-0.5">Reference EOQ</p>
                      <p className="font-bold text-gray-900">{result.scoreBreakdown.mathBenchmark.refEoq.toLocaleString()} units</p>
                      <p className="text-gray-500 mt-0.5">
                        Your Q: {(submittedQ ?? q).toLocaleString()} · Ratio: {result.scoreBreakdown.mathBenchmark.qRatio !== null ? result.scoreBreakdown.mathBenchmark.qRatio.toFixed(3) : "–"}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg px-3 py-2 text-xs">
                      <p className="text-purple-600 mb-0.5">Reference ROP</p>
                      <p className="font-bold text-gray-900">{result.scoreBreakdown.mathBenchmark.refRop.toLocaleString()} units</p>
                      <p className="text-gray-500 mt-0.5">
                        Your ROP: {(submittedRop ?? rop).toLocaleString()} · Ratio: {result.scoreBreakdown.mathBenchmark.ropRatio !== null ? result.scoreBreakdown.mathBenchmark.ropRatio.toFixed(3) : "–"}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg px-3 py-2 text-xs">
                      <p className="text-purple-600 mb-0.5">Reference SS</p>
                      <p className="font-bold text-gray-900">{result.scoreBreakdown.mathBenchmark.refSs.toLocaleString()} units</p>
                      <p className="text-gray-500 mt-0.5">
                        Your SS: {result.scoreBreakdown.mathBenchmark.studentSs.toLocaleString()} (implicit from ROP − μd×L)
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: "EOQ (Q) Score", score: result.scoreBreakdown.mathBenchmark.qScore,   max: 6 },
                      { label: "ROP Score",      score: result.scoreBreakdown.mathBenchmark.ropScore, max: 5 },
                      { label: "Safety Stock",   score: result.scoreBreakdown.mathBenchmark.ssScore,  max: 4 },
                    ].map(({ label, score, max }) => (
                      <div key={label} className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-purple-600 mb-0.5">{label}</p>
                        <p className={`font-bold ${score === max ? "text-emerald-700" : score >= max * 0.5 ? "text-amber-700" : "text-red-700"}`}>
                          {score}/{max} pts
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Avg daily demand used: {result.scoreBreakdown.mathBenchmark.avgDailyDemand.toLocaleString()} units/day · Avg lead time: {result.scoreBreakdown.mathBenchmark.avgLeadTime} days
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Additional KPI details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Holding Cost",     value: `€${result.kpis.holdingCost.toLocaleString()}`,   icon: <Package className="h-4 w-4" />,  color: "text-gray-700" },
                { label: "Transport Cost",   value: `€${result.kpis.transportCost.toLocaleString()}`, icon: <Truck className="h-4 w-4" />,    color: "text-gray-700" },
                { label: "DC Cost",          value: `€${result.kpis.dcCost.toLocaleString()}`,        icon: <Network className="h-4 w-4" />,  color: "text-gray-700" },
                { label: "Ending Inventory", value: result.kpis.endingInventory.toLocaleString(),     icon: <Package className="h-4 w-4" />,  color: "text-gray-700" },
              ].map(({ label, value, icon, color }) => (
                <Card key={label} className="border border-gray-100">
                  <CardContent className="pt-3 pb-2 px-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${color} text-xs`}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Validation flags */}
            {result.validationFlags.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700 mb-1 text-sm">Validation Issues</p>
                      <ul className="text-xs text-red-600 space-y-0.5">
                        {result.validationFlags.map((f) => <li key={f}>• {f}</li>)}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {result.feedback.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <p className="font-semibold text-blue-800 mb-2 text-sm flex items-center gap-1.5">
                    <Info className="h-4 w-4" /> Improvement Suggestions
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {result.feedback.map((f) => <li key={f}>• {f}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {moduleData && moduleData.recentRuns.length > 0 && (
        <RunHistoryPanel runs={moduleData.recentRuns} />
      )}

      <GuideSheet
        open={guideOpen}
        onOpenChange={setGuideOpen}
        content={module3Guide}
        title="Module 3: Student Guide"
      />
    </div>
  );
}
