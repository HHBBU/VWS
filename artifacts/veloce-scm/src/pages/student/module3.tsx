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
  FileDown,
} from "lucide-react";
import { GuideSheet } from "@/components/GuideSheet";
import { RunHistoryPanel } from "@/components/RunHistoryPanel";
import { module3Guide } from "@/guides/module3Guide";
import {
  ComposedChart,
  Bar,
  Cell,
  LabelList,
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
import { openSimulationReport } from "@/components/SimulationReport";

import { SemiGauge } from "@/components/KpiCharts";
import { MultiRunRadarChart } from "@/components/MultiRunRadarChart";
import { KpiTrendChart } from "@/components/KpiTrendChart";
import {
  CO2_KG_PER_FLIGHT,
  CAR_KM_PER_KG_CO2,
  BENCHMARK_SL_BEST,
  BENCHMARK_SL_TYPICAL,
  BENCHMARK_MARGIN_BEST,
  BENCHMARK_MARGIN_TYPICAL,
  BENCHMARK_MARGIN_SCALE_MAX,
} from "@/config/benchmarks";

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

// ─── DC Network Map ───────────────────────────────────────────────────────────

const SUPPLIERS_MAP = [
  { id: "pt", label: "PT", name: "Portugal", x: 196, y: 163, clr: "#15803d" },
  { id: "tr", label: "TR", name: "Turkey",   x: 333, y: 150, clr: "#d97706" },
  { id: "vn", label: "VN", name: "Vietnam",  x: 463, y: 168, clr: "#2563eb" },
  { id: "mx", label: "MX", name: "Mexico",   x:  71, y: 162, clr: "#9333ea" },
] as const;

const ALL_DCS_MAP = [
  { id: "fra", label: "Frankfurt",  sub: "Central EU",    x: 242, y: 102 },
  { id: "atl", label: "Atlanta",    sub: "North America", x:  80, y: 113 },
  { id: "sin", label: "Singapore",  sub: "APAC",          x: 456, y: 198 },
] as const;

const ACTIVE_DC_IDS: Record<string, string[]> = {
  centralized:   ["fra"],
  hybrid:        ["fra", "atl"],
  decentralized: ["fra", "atl", "sin"],
};

// Preferred DC per supplier (falls back to Frankfurt)
const SUPPLIER_PREF: Record<string, string> = { mx: "atl", vn: "sin" };

function arcPath(sx: number, sy: number, dx: number, dy: number): string {
  const cx = (sx + dx) / 2;
  const cy = Math.min(sy, dy) - 22;
  return `M ${sx} ${sy} Q ${cx} ${cy} ${dx} ${dy}`;
}

function NetworkMapSvg({ strategy }: { strategy: string }) {
  const activeIds = ACTIVE_DC_IDS[strategy] ?? ["fra"];
  const activeDCs = ALL_DCS_MAP.filter((d) => activeIds.includes(d.id));

  function dcForSupplier(suppId: string) {
    const pref = SUPPLIER_PREF[suppId];
    return activeDCs.find((d) => d.id === pref) ?? activeDCs[0]!;
  }

  const CUST = { x: 222, y: 68 };

  return (
    <svg
      key={strategy}
      viewBox="0 0 520 240"
      className="w-full rounded-xl border border-blue-100 bg-[#e0f2fe]"
      aria-label="Distribution network schematic map"
    >
      <style>{`
        @keyframes drawFlow {
          from { stroke-dasharray: 600; stroke-dashoffset: 600; }
          to   { stroke-dasharray: 600; stroke-dashoffset: 0; }
        }
        .flow-line-animate {
          animation: drawFlow 0.32s ease-out backwards;
        }
      `}</style>
      {/* ── Continent blobs ─────────────────────────────────────────── */}
      <ellipse cx="78"  cy="158" rx="68" ry="78" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.2" />
      <ellipse cx="246" cy="144" rx="91" ry="83" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.2" />
      <ellipse cx="337" cy="158" rx="43" ry="33" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.2" />
      <ellipse cx="458" cy="163" rx="61" ry="71" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.2" />

      {/* Region labels */}
      <text x="78"  y="94"  textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="500">Americas</text>
      <text x="246" y="75"  textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="500">Europe</text>
      <text x="458" y="100" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="500">Asia-Pacific</text>

      {/* ── Customer zone ───────────────────────────────────────────── */}
      <ellipse cx={CUST.x} cy={CUST.y} rx="49" ry="26"
        fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="5 2" />
      <text x={CUST.x} y={CUST.y - 31} textAnchor="middle" fontSize="8.5" fill="#4338ca" fontWeight="700">🛍 W. Europe</text>
      <text x={CUST.x} y={CUST.y - 20} textAnchor="middle" fontSize="7" fill="#6366f1">Customer Zone</text>

      {/* ── Supplier → DC flow lines ─────────────────────────────────── */}
      {SUPPLIERS_MAP.map((s, i) => {
        const dc = dcForSupplier(s.id);
        return (
          <path
            key={`sup-${s.id}`}
            className="flow-line-animate"
            style={{ animationDelay: `${i * 0.04}s` }}
            d={arcPath(s.x, s.y, dc.x, dc.y)}
            fill="none"
            stroke={s.clr}
            strokeWidth="1.5"
            strokeDasharray="5 3"
            opacity="0.5"
          />
        );
      })}

      {/* ── DC → Customer flow lines ─────────────────────────────────── */}
      {activeDCs.map((dc, i) => (
        <path
          key={`dc-cust-${dc.id}`}
          className="flow-line-animate"
          style={{ animationDelay: `${(SUPPLIERS_MAP.length * 0.04) + (i * 0.05)}s` }}
          d={arcPath(dc.x, dc.y, CUST.x, CUST.y)}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeDasharray="6 3"
          opacity="0.65"
        />
      ))}

      {/* ── Inactive DC ghost lines ──────────────────────────────────── */}
      {ALL_DCS_MAP.filter((d) => !activeIds.includes(d.id)).map((dc) => (
        <path
          key={`ghost-${dc.id}`}
          d={arcPath(dc.x, dc.y, CUST.x, CUST.y)}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.35"
        />
      ))}

      {/* ── Supplier nodes ───────────────────────────────────────────── */}
      {SUPPLIERS_MAP.map((s) => (
        <g key={s.id}>
          <circle cx={s.x} cy={s.y} r="13" fill={s.clr} opacity="0.15" />
          <circle cx={s.x} cy={s.y} r="9"  fill={s.clr} />
          <text x={s.x} y={s.y + 3.5} textAnchor="middle" fontSize="7" fill="white" fontWeight="700">{s.label}</text>
          <text x={s.x} y={s.y + 20}  textAnchor="middle" fontSize="7.5" fill="#374151" fontWeight="500">{s.name}</text>
        </g>
      ))}

      {/* ── DC nodes (all rendered; active ones highlighted) ─────────── */}
      {ALL_DCS_MAP.map((dc) => {
        const active = activeIds.includes(dc.id);
        return (
          <g key={dc.id} style={{ opacity: active ? 1 : 0.18, transition: "opacity 0.35s ease" }}>
            <circle cx={dc.x} cy={dc.y} r="16"
              fill={active ? "#dbeafe" : "#f1f5f9"}
              stroke={active ? "#2563eb" : "#94a3b8"}
              strokeWidth="1.5" />
            <circle cx={dc.x} cy={dc.y} r="7" fill={active ? "#2563eb" : "#94a3b8"} />
            <text x={dc.x} y={dc.y - 22} textAnchor="middle" fontSize="8" fill={active ? "#1e40af" : "#94a3b8"} fontWeight="700">{dc.label}</text>
            <text x={dc.x} y={dc.y - 13} textAnchor="middle" fontSize="7" fill={active ? "#3b82f6" : "#94a3b8"}>{dc.sub}</text>
          </g>
        );
      })}

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <g transform="translate(10,216)">
        <circle cx="6"   cy="4" r="5" fill="#15803d" />
        <text x="14"  y="8" fontSize="8" fill="#475569">Factory / Supplier</text>
        <circle cx="102" cy="4" r="5" fill="#2563eb" />
        <text x="110" y="8" fontSize="8" fill="#475569">DC (active)</text>
        <circle cx="171" cy="4" r="5" fill="#94a3b8" />
        <text x="179" y="8" fontSize="8" fill="#475569">DC (inactive)</text>
        <ellipse cx="247" cy="4" rx="9" ry="5"
          fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 1" />
        <text x="259" y="8" fontSize="8" fill="#475569">Customer Zone</text>
      </g>
    </svg>
  );
}

// ─── Previous-run snapshot ───────────────────────────────────────────────────

interface PreviousRun {
  networkStrategy: string;
  score: number;
  maxScore: number;
  letterGrade: string;
  fillRate: number;
  totalCost: number;
  totalCarbonKg: number;
  profitMarginPct: number;
  rop: number;
  q: number;
}

// ─── Module 3 Page ────────────────────────────────────────────────────────────

export default function Module3Page() {
  const images = useModuleImages();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Module status
  const { data: moduleData, isLoading: moduleLoading } = useGetModuleData("M3");
  const { data: currentUser } = useGetCurrentUser();

  // M3 context (M1+M2 imported data)
  const [m3Context, setM3Context] = useState<M3Context | null>(null);
  const [contextLoading, setContextLoading] = useState(true);

  // Decision state
  const [networkStrategy, setNetworkStrategy] = useState<"centralized" | "hybrid" | "decentralized">("hybrid");
  const [serviceMode, setServiceMode] = useState<"standard" | "express" | "mixed">("standard");
  const [serviceLevel, setServiceLevel] = useState("0.95");
  const [rop, setRop] = useState(4500);
  const [q, setQ] = useState(9000);
  const [justification, setJustification] = useState("");

  // Submission state
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<M3Result | null>(null);
  const [runType, setRunType] = useState<"practice" | "final" | null>(null);
  const [submittedRop, setSubmittedRop] = useState<number | null>(null);
  const [submittedQ, setSubmittedQ] = useState<number | null>(null);
  const [submittedNetworkStrategy, setSubmittedNetworkStrategy] = useState<string | null>(null);
  const [previousRun, setPreviousRun] = useState<PreviousRun | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [scoreChartOpen, setScoreChartOpen] = useState(false);
  const [contextBannerOpen, setContextBannerOpen] = useState<boolean>(() => {
    try { return localStorage.getItem("vws_m3_cascade_open") !== "false"; } catch { return true; }
  });

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
  const handleDownloadReport = useCallback(() => {
    if (!result) return;
    openSimulationReport({
      moduleKey: "M3",
      isPractice: runType !== "final",
      studentName: currentUser?.name ?? "Student",
      studentId: currentUser?.studentId ?? null,
      section: currentUser?.section ?? null,
      completedAt: new Date(),
      decisions: { networkStrategy, serviceMode, serviceLevel: parseFloat(serviceLevel), rop: submittedRop ?? rop, q: submittedQ ?? q },
      result: result as any,
      justification,
    });
  }, [result, runType, currentUser, networkStrategy, serviceMode, serviceLevel, rop, q, submittedRop, submittedQ, justification]);

  const handleSubmit = useCallback(
    async (type: "practice" | "final") => {
      if (!justification.trim()) {
        toast({ title: "Justification required", description: "Please enter your strategic justification.", variant: "destructive" });
        return;
      }
      setIsRunning(true);
      setRunType(type);
      // Archive the current result before overriding it so the student can compare runs
      if (result && submittedNetworkStrategy) {
        setPreviousRun({
          networkStrategy: submittedNetworkStrategy,
          score: result.score,
          maxScore: result.maxScore,
          letterGrade: result.letterGrade,
          fillRate: result.kpis.fillRate,
          totalCost: result.kpis.totalCost,
          totalCarbonKg: result.kpis.totalCarbonKg,
          profitMarginPct: result.kpis.profitMarginPct,
          rop: submittedRop ?? rop,
          q: submittedQ ?? q,
        });
      }
      setResult(null);
      setSubmittedRop(rop);
      setSubmittedQ(q);
      setSubmittedNetworkStrategy(networkStrategy);

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
            description: `Module 3 submitted — score ${data.score}/${data.maxScore} (${data.letterGrade})`,
          });
        } else {
          toast({
            title: "Practice run complete",
            description: `Score: ${data.score}/${data.maxScore} (${data.letterGrade}) — keep improving!`,
          });
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsRunning(false);
      }
    },
    [networkStrategy, serviceMode, serviceLevel, rop, q, justification, toast, queryClient, result, submittedNetworkStrategy, submittedRop, submittedQ],
  );

  const isSubmitted = moduleData?.isSubmitted ?? false;
  const practiceCount = moduleData?.practiceCount ?? 0;
  const practiceAtLimit = practiceCount >= 4;

  if (moduleLoading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Module 3 banner */}
      <div className="relative rounded-2xl overflow-hidden mb-2 h-40 md:h-52 shadow-md">
        <img
          src={`${import.meta.env.BASE_URL}img/banner-module3.png`}
          alt="Distribution network and inventory management"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Module 3</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Distribution Network</h2>
          <p className="text-white/70 text-sm">Network design, inventory policy &amp; global fulfillment strategy</p>
        </div>
      </div>

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
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-blue-800">
                    📊 Context from Modules 1 &amp; 2 — These numbers drive the M3 simulation
                  </p>
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 px-2 text-blue-700 hover:bg-blue-100 ml-2 shrink-0 text-xs font-medium"
                    onClick={() => setContextBannerOpen((v) => {
                      const next = !v;
                      try { localStorage.setItem("vws_m3_cascade_open", String(next)); } catch {}
                      return next;
                    })}
                  >
                    {contextBannerOpen ? "Hide ▲" : "Show ▼"}
                  </Button>
                </div>
                {contextBannerOpen && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-2">
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
                    <p className="text-xs text-blue-700 leading-relaxed mb-1">
                      <strong>How M1 &amp; M2 feed M3:</strong> Your M1 forecasts (A: {m3Context.forecastA.toLocaleString()}, B: {m3Context.forecastB.toLocaleString()}) set the demand rate for ROP/EOQ calculations. Your M2 service level ({m3Context.m2ServiceLevel.toFixed(1)}%) affects lead time variability — a lower service level means more supply disruptions, so a higher ROP is needed to compensate.
                    </p>
                    {m3Context.m2ServiceLevel < 92 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        ⚠️ Your M2 service level was below 92% — this widens lead time variability in M3. A higher ROP is recommended.
                      </p>
                    )}
                  </>
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
                  Module 3 Final Score: <strong>{moduleData.finalSubmission.score}/{moduleData.finalSubmission.maxScore ?? 52}</strong> ·
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
              <div className="col-span-full">
                <img
                  src={images.module3.networkStrategy.src}
                  alt={images.module3.networkStrategy.alt}
                  className="w-full rounded-md mb-1"
                  style={{ height: "180px", objectFit: "cover" }}
                  loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module3.networkStrategy.src; if (t.src !== def) t.src = def; }}
                  />
                <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module3.networkStrategy.caption}</p>
              </div>
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

              {/* Network Map */}
              <div className="col-span-full space-y-1">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-500" />
                  Network schematic — updates as you switch strategy
                </p>
                <NetworkMapSvg strategy={networkStrategy} />
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
              <div className="col-span-full">
                <img
                  src={images.module3.inventoryPolicy.src}
                  alt={images.module3.inventoryPolicy.alt}
                  className="w-full rounded-md mb-1"
                  style={{ height: "180px", objectFit: "cover" }}
                  loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module3.inventoryPolicy.src; if (t.src !== def) t.src = def; }}
                  />
                <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module3.inventoryPolicy.caption}</p>
              </div>
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

          {/* Section 3: Justification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-gray-600" />
                3. Strategic Justification
              </CardTitle>
              <CardDescription>
                Explain your network strategy choice, ROP/Q calculations (EOQ/SS/ROP formulas), service mode
                trade-offs, service level reasoning, and how M1/M2 results influenced your decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                placeholder="Discuss: Which network strategy did you choose and why? How did you calculate EOQ, Safety Stock, and ROP for each SKU? What service level did you target and why? What are the cost vs. carbon trade-offs of your service mode? How did M1 supplier reliability and M2 service level affect your M3 decisions? Which demand forecasting method did you apply (e.g., Moving Average, Exponential Smoothing, Seasonal Decomposition) and why?"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Practice Runs</span>
                <span className={`font-semibold ${practiceAtLimit ? "text-red-600" : "text-gray-700"}`}>
                  {practiceCount} / 4 used
                </span>
              </div>
              <Button
                className={`w-full bg-blue-600 hover:bg-blue-700 ${practiceAtLimit ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleSubmit("practice")}
                disabled={isRunning || practiceAtLimit}
                title={practiceAtLimit ? "Practice run limit reached — submit your final decision" : undefined}
              >
                {isRunning && runType === "practice" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running 90-Day Simulation…</>
                ) : practiceAtLimit ? (
                  <>Limit Reached</>
                ) : (
                  <><TrendingUp className="h-4 w-4 mr-2" /> Run Practice Simulation</>
                )}
              </Button>
            </div>

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
            {/* ── Previous run comparison panel ── */}
            {previousRun && (
              <Card className="border border-slate-200 bg-slate-50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <Network className="h-4 w-4 text-slate-400" />
                    Previous Run —{" "}
                    <span className="capitalize font-semibold text-slate-700">{previousRun.networkStrategy}</span>
                    <span className={`ml-auto text-base font-bold ${gradeColor(previousRun.letterGrade)}`}>
                      {previousRun.score}/{previousRun.maxScore} &nbsp;{previousRun.letterGrade}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Compare this strategy to your new results below
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3">
                  <NetworkMapSvg strategy={previousRun.networkStrategy} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      {
                        label: "Fill Rate",
                        value: `${previousRun.fillRate.toFixed(1)}%`,
                        color: previousRun.fillRate >= 94 ? "text-emerald-600" : "text-red-600",
                      },
                      {
                        label: "Total Cost",
                        value: `€${previousRun.totalCost.toLocaleString()}`,
                        color: "text-blue-600",
                      },
                      {
                        label: "Carbon",
                        value: `${previousRun.totalCarbonKg.toLocaleString()} kg`,
                        color: previousRun.totalCarbonKg > 50000 ? "text-red-600" : "text-emerald-600",
                      },
                      {
                        label: "Profit Margin",
                        value: `${previousRun.profitMarginPct.toFixed(1)}%`,
                        color: previousRun.profitMarginPct >= 15 ? "text-emerald-600" : "text-red-600",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white rounded border border-slate-100 px-2 py-1.5">
                        <p className="text-slate-500 mb-0.5">{label}</p>
                        <p className={`font-semibold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ROP: {previousRun.rop.toLocaleString()} &nbsp;·&nbsp; Q: {previousRun.q.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Score header */}
            <Card className={`border-2 ${result.letterGrade === "A" ? "border-emerald-400" : result.letterGrade === "B" ? "border-blue-400" : result.letterGrade === "C" ? "border-amber-400" : "border-red-400"}`}>
              <CardContent className="pt-5 pb-4">
                <img
                  src={images.module3.results.src}
                  alt={images.module3.results.alt}
                  className="w-full rounded-md mb-2"
                  style={{ height: "180px", objectFit: "cover" }}
                  loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module3.results.src; if (t.src !== def) t.src = def; }}
                  />
                <p className="text-xs italic text-muted-foreground px-1 pb-4">{images.module3.results.caption}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {runType === "final" ? "🎓 Final Score — Course Complete!" : "Practice Run Score"}
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {result.score}
                      <span className="text-xl text-gray-400">/{result.maxScore}</span>
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

            {/* Network strategy map — frozen to submitted strategy */}
            {submittedNetworkStrategy && (
              <Card className="border border-blue-100">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-500" />
                    Network Strategy — <span className="capitalize font-semibold text-blue-700">{submittedNetworkStrategy}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    The distribution network you chose drove the KPIs above.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <NetworkMapSvg strategy={submittedNetworkStrategy} />
                </CardContent>
              </Card>
            )}

            {/* KPI grid — core metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Fill Rate",       value: `${result.kpis.fillRate.toFixed(1)}%`,          icon: <TrendingUp className="h-4 w-4" />,    color: result.kpis.fillRate >= 94 ? "text-emerald-600" : "text-red-600", sub: result.kpis.fillRate >= BENCHMARK_SL_BEST ? `Best-in-class (≥${BENCHMARK_SL_BEST}%)` : result.kpis.fillRate >= BENCHMARK_SL_TYPICAL ? "Industry typical" : `Below avg (<${BENCHMARK_SL_TYPICAL}%)` },
                { label: "Total Cost",      value: `€${result.kpis.totalCost.toLocaleString()}`,   icon: <Package className="h-4 w-4" />,       color: "text-blue-600" },
                { label: "Carbon Footprint",value: `${result.kpis.totalCarbonKg.toLocaleString()} kg`, icon: <Leaf className="h-4 w-4" />,   color: result.kpis.totalCarbonKg > 50000 ? "text-red-600" : "text-emerald-600", sub: `≈ ${Math.round(result.kpis.totalCarbonKg / CO2_KG_PER_FLIGHT)} flights · ${Math.round(result.kpis.totalCarbonKg * CAR_KM_PER_KG_CO2 / 1000)}k km by car` },
                { label: "Stockouts",       value: result.kpis.totalStockouts.toLocaleString(),     icon: <AlertTriangle className="h-4 w-4" />, color: result.kpis.totalStockouts > 0 ? "text-red-600" : "text-emerald-600", sub: result.kpis.totalStockouts > 0 ? `≈ ${result.kpis.totalStockouts.toLocaleString()} customer orders unfilled` : "All orders fulfilled" },
              ].map(({ label, value, icon, color, sub }) => (
                <Card key={label} className="border border-gray-100">
                  <CardContent className="pt-3 pb-2 px-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${color} text-xs`}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{value}</p>
                    {sub && <p className="text-[10px] text-gray-400 italic mt-0.5 leading-tight">{sub}</p>}
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
                  color: result.kpis.profitMarginPct >= BENCHMARK_MARGIN_BEST ? "text-emerald-600" : result.kpis.profitMarginPct >= BENCHMARK_MARGIN_TYPICAL ? "text-amber-600" : "text-red-600",
                  sub: result.kpis.profitMarginPct >= BENCHMARK_MARGIN_BEST ? `Best-in-class (≥${BENCHMARK_MARGIN_BEST}%)` : result.kpis.profitMarginPct >= BENCHMARK_MARGIN_TYPICAL ? `Industry typical (${BENCHMARK_MARGIN_TYPICAL}–${BENCHMARK_MARGIN_BEST}%)` : `Below typical (<${BENCHMARK_MARGIN_TYPICAL}%)`,
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
              ].map(({ label, value, icon, color, sub }) => (
                <Card key={label} className="border border-gray-100">
                  <CardContent className="pt-3 pb-2 px-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${color} text-xs`}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{value}</p>
                    {sub && <p className="text-[10px] text-gray-400 italic mt-0.5 leading-tight">{sub}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Score breakdown (v3) — collapsible horizontal bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Score Breakdown</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setScoreChartOpen((v) => !v)}
                  >
                    {scoreChartOpen ? "Hide Chart" : "View Score Breakdown"}
                  </Button>
                </div>
              </CardHeader>
              {scoreChartOpen && (
                <CardContent className="pt-0">
                  {(() => {
                    const dims = [
                      { label: "Performance",     score: result.scoreBreakdown.performance,     max: 30, fill: "#6366f1" },
                      { label: "Inventory Math",  score: result.scoreBreakdown.inventoryMath,  max: 15, fill: "#3b82f6" },
                      { label: "Policy Reasoning",score: result.scoreBreakdown.policyReasoning, max: 8,  fill: "#8b5cf6" },
                      { label: "Validity",        score: result.scoreBreakdown.validity,        max: 2,  fill: "#14b8a6" },
                    ];
                    const chartData = dims.map((d) => ({
                      label: d.label,
                      earned: d.score,
                      remaining: d.max - d.score,
                      max: d.max,
                      fill: d.fill,
                      scoreLabel: `${d.score} / ${d.max} pts`,
                    }));
                    return (
                      <ResponsiveContainer width="100%" height={160}>
                        <ComposedChart
                          layout="vertical"
                          data={chartData}
                          margin={{ top: 4, right: 80, left: 4, bottom: 4 }}
                        >
                          <XAxis type="number" domain={[0, 30]} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={115} />
                          <ReTooltip
                            formatter={(v: number, name: string, props: { payload: { max: number } }) =>
                              name === "earned"
                                ? [`${v} / ${props.payload.max} pts`, "Score"]
                                : [null, null]
                            }
                          />
                          <Bar dataKey="earned" stackId="score" radius={[0, 0, 0, 0]} maxBarSize={22}>
                            {chartData.map((entry) => (
                              <Cell key={entry.label} fill={entry.fill} />
                            ))}
                            <LabelList
                              dataKey="scoreLabel"
                              position="right"
                              style={{ fontSize: 10, fill: "#374151" }}
                            />
                          </Bar>
                          <Bar dataKey="remaining" stackId="score" fill="#e5e7eb" radius={[0, 4, 4, 0]} maxBarSize={22} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              )}
            </Card>

            {/* ── Performance Gauges ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Performance Gauges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <SemiGauge
                    value={result.kpis.fillRate}
                    label="Fill Rate"
                    valueLabel={`${result.kpis.fillRate.toFixed(1)}%`}
                    color={result.kpis.fillRate >= 94 ? "#10b981" : result.kpis.fillRate >= 90 ? "#3b82f6" : "#ef4444"}
                    benchmarks={[
                      { value: BENCHMARK_SL_BEST, color: "#22c55e" },
                      { value: BENCHMARK_SL_TYPICAL, color: "#f59e0b" },
                    ]}
                  />
                  <SemiGauge
                    value={Math.max(0, 100 - result.kpis.costVsTarget)}
                    label="Cost Efficiency"
                    valueLabel={`${Math.max(0, 100 - result.kpis.costVsTarget).toFixed(0)}%`}
                    color={result.kpis.costVsTarget <= 5 ? "#10b981" : result.kpis.costVsTarget <= 15 ? "#f59e0b" : "#ef4444"}
                  />
                  <SemiGauge
                    value={Math.min(100, Math.max(0, result.kpis.profitMarginPct / BENCHMARK_MARGIN_SCALE_MAX * 100))}
                    label="Profit Margin"
                    valueLabel={`${result.kpis.profitMarginPct.toFixed(1)}%`}
                    color={result.kpis.profitMarginPct >= BENCHMARK_MARGIN_BEST ? "#10b981" : result.kpis.profitMarginPct >= BENCHMARK_MARGIN_TYPICAL ? "#f59e0b" : "#ef4444"}
                    benchmarks={[
                      { value: BENCHMARK_MARGIN_BEST / BENCHMARK_MARGIN_SCALE_MAX * 100, color: "#22c55e" },
                      { value: BENCHMARK_MARGIN_TYPICAL / BENCHMARK_MARGIN_SCALE_MAX * 100, color: "#f59e0b" },
                    ]}
                  />
                </div>
                <div className="mt-2 flex justify-center gap-6 text-xs text-gray-500 flex-wrap">
                  <span>Fill Rate ≥94% = full marks · ≥90% = partial</span>
                  <span>Cost Efficiency: 100% = on target</span>
                  <span>Margin gauge: 0–{BENCHMARK_MARGIN_SCALE_MAX}% scale</span>
                </div>
                <p className="text-center text-[10px] text-gray-400 italic mt-1.5">
                  Tick marks: <span className="text-green-500 font-medium">green</span> = best-in-class · <span className="text-amber-400 font-medium">amber</span> = typical floor
                </p>
              </CardContent>
            </Card>

            {/* ── Revenue vs Cost Breakdown ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Revenue vs Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const rev = result.kpis.totalRevenue;
                  const cost = result.kpis.totalCost;
                  const profit = rev - cost;
                  const chartData = [
                    { name: "Revenue", revenue: rev },
                    {
                      name: "Total Cost",
                      shipping:   result.kpis.shippingCost,
                      dcOps:      result.kpis.dcCost,
                      holding:    result.kpis.holdingCost,
                      transport:  result.kpis.transportCost,
                      stockouts:  result.kpis.stockoutCost,
                      carbonTax:  result.kpis.carbonTaxCost,
                      markdown:   result.kpis.markdownCost,
                    },
                  ];
                  const fmt = (v: number) => `€${v.toLocaleString()}`;
                  const yMax = Math.max(rev, cost, 1) * 1.2;
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={48} domain={[0, yMax]} />
                          <ReTooltip formatter={(v: number, name: string) => [fmt(v), name === "revenue" ? "Revenue" : name.charAt(0).toUpperCase() + name.slice(1)]} />
                          <ReferenceLine y={rev} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: "Revenue", position: "insideTopRight", fontSize: 10, fill: "#10b981" }} />
                          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="shipping"  stackId="cost" fill="#8b5cf6" maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="dcOps"     stackId="cost" fill="#6366f1" maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="holding"   stackId="cost" fill="#14b8a6" maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="transport" stackId="cost" fill="#3b82f6" maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="stockouts" stackId="cost" fill="#ef4444" maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="carbonTax" stackId="cost" fill="#22c55e" maxBarSize={72} minPointSize={1} />
                          <Bar dataKey="markdown"  stackId="cost" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={72} minPointSize={1} />
                        </ComposedChart>
                      </ResponsiveContainer>
                      <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm ${profit >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        <span className="text-gray-600">Profit (Revenue − Cost)</span>
                        <span className={`font-semibold tabular-nums ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {profit >= 0 ? "+" : ""}{fmt(profit)} &nbsp;·&nbsp; {result.kpis.profitMarginPct.toFixed(1)}% margin
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
                        {[
                          { label: "Shipping",   color: "#8b5cf6" },
                          { label: "DC Ops",     color: "#6366f1" },
                          { label: "Holding",    color: "#14b8a6" },
                          { label: "Transport",  color: "#3b82f6" },
                          { label: "Stockouts",  color: "#ef4444" },
                          { label: "Carbon Tax", color: "#22c55e" },
                          { label: "Markdown",   color: "#f97316" },
                        ].map(({ label, color }) => (
                          <span key={label} className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                            {label}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* ── Cost Breakdown Chart ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Key Cost Breakdown (90 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const targetCost = result.kpis.costVsTarget !== 0
                    ? result.kpis.totalCost / (1 + result.kpis.costVsTarget / 100)
                    : result.kpis.totalCost;
                  const costData = [
                    { name: "Holding",   value: result.kpis.holdingCost,   fill: "#64748b" },
                    { name: "Transport", value: result.kpis.transportCost, fill: "#3b82f6" },
                    { name: "Stockout",  value: result.kpis.stockoutCost,  fill: "#ef4444" },
                    { name: "Markdown",  value: result.kpis.markdownCost,  fill: "#f59e0b" },
                  ];
                  const maxVal = Math.max(...costData.map((d) => d.value), targetCost);
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={costData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis
                            tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 10 }}
                            width={48}
                            domain={[0, Math.ceil(maxVal * 1.2 / 1000) * 1000]}
                          />
                          <ReTooltip formatter={(v: number) => [`€${v.toLocaleString()}`, "Cost"]} />
                          <ReferenceLine
                            y={targetCost}
                            stroke="#ef4444"
                            strokeDasharray="6 3"
                            strokeWidth={2}
                            label={{ value: "Target", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
                            {costData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                            <LabelList
                              dataKey="value"
                              position="top"
                              formatter={(v: number) => v > 0 ? `€${(v / 1000).toFixed(1)}k` : ""}
                              style={{ fontSize: 9, fill: "#6b7280" }}
                            />
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                      <p className="text-[10px] text-gray-400 text-center mt-1">
                        Red dashed line = target total cost · bars show key variable cost drivers
                      </p>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

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

            <Button variant="outline" onClick={handleDownloadReport} className="w-full gap-2">
              <FileDown className="h-4 w-4" /> Download Report
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {moduleData && moduleData.recentRuns.length > 0 && (
        <div className="space-y-4">
          <MultiRunRadarChart runs={moduleData.recentRuns} moduleKey="M3" maxScore={52} />
          <KpiTrendChart runs={moduleData.recentRuns} maxScore={52} />
          <RunHistoryPanel runs={moduleData.recentRuns} moduleKey="M3" maxScore={52} />
        </div>
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
