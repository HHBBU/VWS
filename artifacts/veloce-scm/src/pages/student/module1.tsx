import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { MODULE_IMAGES } from "@/config/moduleImages";
import { useModuleImages } from "@/hooks/useModuleImages";
import { useQueryClient } from "@tanstack/react-query";
import { getGetModuleDataQueryKey, getGetStudentDashboardQueryKey, useGetModuleData, useGetCurrentUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Plus, Trash2, Loader2, Trophy, TrendingUp, Package, Truck,
  History, CheckCircle, AlertTriangle, BarChart3, Globe, Leaf, Star, BookOpen, FileDown,
  Zap, Scale, DollarSign,
} from "lucide-react";
import { GuideSheet } from "@/components/GuideSheet";
import { RunHistoryPanel } from "@/components/RunHistoryPanel";
import { module1Guide } from "@/guides/module1Guide";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as ReTooltip,
  Legend, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import { DemandForecastChart } from "@/components/DemandForecastChart";
import { SupplierWorldMap } from "@/components/SupplierWorldMap";
import { MultiRunRadarChart } from "@/components/MultiRunRadarChart";
import { KpiTrendChart } from "@/components/KpiTrendChart";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { openSimulationReport } from "@/components/SimulationReport";
import {
  CO2_KG_PER_FLIGHT,
  CAR_KM_PER_KG_CO2,
  NEARSHORE_LEAD_DAYS,
  BENCHMARK_RELIABILITY_BEST,
  BENCHMARK_RELIABILITY_TYPICAL,
  BENCHMARK_TRANSPORT_PCT_BEST,
  BENCHMARK_TRANSPORT_PCT_TYPICAL,
} from "@/config/benchmarks";

// ─── Supplier Data ───────────────────────────────────────────────────────────

const COUNTRY_FLAG: Record<string, string> = {
  Portugal: "🇵🇹",
  Turkey: "🇹🇷",
  Vietnam: "🇻🇳",
  Mexico: "🇲🇽",
};

const SUPPLIERS = [
  { id: "PT1", name: "Lusitex Premium", country: "Portugal", cottonPrice: 3.55, nylonPrice: 5.10, leadTime: 5, reliability: 97, sustainability: 4.4, quality: 4.6, region: "nearshore", certs: "ISO9001, ISO14001, OEKO-TEX" },
  { id: "PT2", name: "PortoWeave Organic", country: "Portugal", cottonPrice: 3.85, nylonPrice: 5.25, leadTime: 6, reliability: 96, sustainability: 4.8, quality: 4.7, region: "nearshore", certs: "ISO9001, ISO14001, GOTS, OEKO-TEX" },
  { id: "TR1", name: "Anatolia Mills", country: "Turkey", cottonPrice: 3.20, nylonPrice: 4.95, leadTime: 8, reliability: 94, sustainability: 3.8, quality: 4.0, region: "nearshore", certs: "ISO9001, ISO14001" },
  { id: "TR2", name: "Bosporus Textiles", country: "Turkey", cottonPrice: 3.35, nylonPrice: 5.05, leadTime: 9, reliability: 95, sustainability: 4.1, quality: 4.2, region: "nearshore", certs: "ISO9001, ISO14001, OEKO-TEX" },
  { id: "VN1", name: "Saigon Spinners", country: "Vietnam", cottonPrice: 2.85, nylonPrice: 4.70, leadTime: 28, reliability: 88, sustainability: 3.2, quality: 3.6, region: "offshore", certs: "ISO9001" },
  { id: "VN2", name: "Hanoi EcoWeave", country: "Vietnam", cottonPrice: 3.05, nylonPrice: 4.85, leadTime: 30, reliability: 90, sustainability: 4.0, quality: 3.8, region: "offshore", certs: "ISO9001, ISO14001, OEKO-TEX" },
  { id: "MX1", name: "Monterrey KnitWorks", country: "Mexico", cottonPrice: 3.10, nylonPrice: 4.60, leadTime: 24, reliability: 91, sustainability: 3.5, quality: 3.7, region: "offshore", certs: "ISO9001" },
  { id: "MX2", name: "Yucatan SustainTex", country: "Mexico", cottonPrice: 3.25, nylonPrice: 4.75, leadTime: 26, reliability: 92, sustainability: 4.2, quality: 3.9, region: "offshore", certs: "ISO9001, ISO14001" },
];

const NEARSHORE_TRANSPORTS = ["truck", "rail"];
const OFFSHORE_TRANSPORTS = ["ocean", "air"];

const TRANSPORT_LABELS: Record<string, string> = {
  truck: "Truck (€0.18/kg, 2-5d)",
  rail: "Rail (€0.12/kg, 4-8d) +1% reliability",
  air: "Air (€0.95/kg, 4-9d) +2% reliability",
  ocean: "Ocean (€0.08/kg, 18-35d)",
};

const ASSURANCE_LABELS: Record<string, string> = {
  standard: "Standard (no premium)",
  priority: "Priority (+3pp cost, +4% reliability)",
  premium: "Premium (+6pp cost, +8% reliability)",
};

const TRANSPORT_COST_PER_KG: Record<string, number> = {
  truck: 0.18,
  rail: 0.12,
  air: 0.95,
  ocean: 0.08,
};

const ASSURANCE_PRICE_PREMIUM: Record<string, number> = {
  standard: 0.00,
  priority: 0.03,
  premium: 0.06,
};

const ORDER_COST_PER_BATCH = 200;

// ─── Strategy Presets ─────────────────────────────────────────────────────────

const STRATEGY_PRESETS = [
  {
    id: "nearshore",
    label: "Nearshore Focus",
    badge: "Fast · Reliable · Higher cost",
    description: "EU suppliers (Portugal & Turkey). Shortest lead times, lowest emissions, highest material costs.",
    colorClass: "border-blue-400/50 bg-blue-500/5 hover:bg-blue-500/10",
    activeClass: "border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/8",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    rows: [
      { supplierId: "PT2", materialType: "cotton" as const, transportMode: "truck", assurancePackage: "standard" as const, numBatches: "1", cottonShare: 0.6 },
      { supplierId: "TR1", materialType: "cotton" as const, transportMode: "truck", assurancePackage: "standard" as const, numBatches: "1", cottonShare: 0.4 },
      { supplierId: "PT1", materialType: "nylon"  as const, transportMode: "truck", assurancePackage: "standard" as const, numBatches: "1", nylonShare: 0.6 },
      { supplierId: "TR2", materialType: "nylon"  as const, transportMode: "rail",  assurancePackage: "standard" as const, numBatches: "1", nylonShare: 0.4 },
    ],
  },
  {
    id: "mixed",
    label: "Balanced Mix",
    badge: "Dual-source · Moderate cost",
    description: "Split nearshore & offshore. Balances cost savings, lead times, and supply resilience.",
    colorClass: "border-emerald-400/50 bg-emerald-500/5 hover:bg-emerald-500/10",
    activeClass: "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/8",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    rows: [
      { supplierId: "PT1", materialType: "cotton" as const, transportMode: "truck",  assurancePackage: "standard" as const, numBatches: "1", cottonShare: 0.5 },
      { supplierId: "VN2", materialType: "cotton" as const, transportMode: "ocean",  assurancePackage: "standard" as const, numBatches: "1", cottonShare: 0.5 },
      { supplierId: "TR2", materialType: "nylon"  as const, transportMode: "rail",   assurancePackage: "standard" as const, numBatches: "1", nylonShare: 0.5 },
      { supplierId: "MX2", materialType: "nylon"  as const, transportMode: "ocean",  assurancePackage: "standard" as const, numBatches: "1", nylonShare: 0.5 },
    ],
  },
  {
    id: "offshore",
    label: "Offshore Focus",
    badge: "Lowest cost · Long lead times",
    description: "Vietnam & Mexico suppliers via ocean freight. Maximum cost savings, longer lead times, higher carbon.",
    colorClass: "border-amber-400/50 bg-amber-500/5 hover:bg-amber-500/10",
    activeClass: "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/8",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    rows: [
      { supplierId: "VN1", materialType: "cotton" as const, transportMode: "ocean", assurancePackage: "standard" as const, numBatches: "1", cottonShare: 0.6 },
      { supplierId: "MX1", materialType: "cotton" as const, transportMode: "ocean", assurancePackage: "standard" as const, numBatches: "1", cottonShare: 0.4 },
      { supplierId: "VN2", materialType: "nylon"  as const, transportMode: "ocean", assurancePackage: "standard" as const, numBatches: "1", nylonShare: 1.0 },
    ],
  },
] as const;

// Bubble chart viz data
const VIZ_DATA = SUPPLIERS.map((s) => ({
  id: s.id,
  name: s.name,
  country: s.country,
  cost: s.cottonPrice,
  quality: Math.round(s.quality * 20),
  sustainability: Math.round(s.sustainability * 20),
  region: s.region === "nearshore" ? "Nearshore" : "Offshore",
  certs: s.certs,
  leadTime: s.leadTime,
  reliability: s.reliability,
}));

// ─── Types ───────────────────────────────────────────────────────────────────

interface Allocation {
  id: string;
  supplierId: string;
  materialType: "cotton" | "nylon";
  kg: string;
  transportMode: string;
  assurancePackage: "standard" | "priority" | "premium";
  numBatches: string;
}

interface SimResult {
  score: number;
  maxScore: number;
  letterGrade: string;
  scoreBreakdown: {
    forecasting: number;
    supplierMethod: number;
    tradeoffs: number;
    qualitySustainability: number;
    validityJustification: number;
  };
  kpis: {
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
    cottonReceivedKg: number;
    nylonReceivedKg: number;
    cottonRequiredKg: number;
    nylonRequiredKg: number;
    lateDeliveries: number;
    totalDeliveries: number;
  };
  feedback: string[];
  validationFlags: string[];
  isFinal: boolean;
  runNumber: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function BubbleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-xl p-4 shadow-xl text-sm min-w-[220px]">
      <p className="font-bold text-base mb-2">{d.name}</p>
      <p className="text-muted-foreground">
        <span className="mr-1">{COUNTRY_FLAG[d.country] ?? "🌍"}</span>{d.country}
      </p>
      <div className="mt-2 space-y-1">
        <p><span className="text-muted-foreground">Cotton Price:</span> <strong>€{d.cost}/kg</strong></p>
        <p><span className="text-muted-foreground">Quality:</span> <strong>{d.quality}/100</strong></p>
        <p><span className="text-muted-foreground">Sustainability:</span> <strong>{d.sustainability}/100</strong></p>
        <p><span className="text-muted-foreground">Lead Time:</span> <strong>{d.leadTime} days</strong></p>
        <p><span className="text-muted-foreground">Reliability:</span> <strong>{d.reliability}%</strong></p>
        <p className="text-xs text-muted-foreground mt-1">{d.certs}</p>
      </div>
    </div>
  );
}

// ─── Bubble Chart Custom Dot (shows flag + supplier ID label) ─────────────────

function BubbleDot(props: any) {
  const { cx, cy, r: rProp, size, fill, payload } = props;
  const r = (typeof rProp === "number" && !isNaN(rProp)) ? rProp : Math.sqrt((size ?? 300) / Math.PI);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} stroke={fill} strokeWidth={1.5} />
      <text
        x={cx}
        y={cy - r - 4}
        textAnchor="middle"
        fontSize={9}
        fill="#64748b"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {COUNTRY_FLAG[payload.country] ?? "🌍"} {payload.id}
      </text>
      <text
        x={cx}
        y={cy + r + 12}
        textAnchor="middle"
        fontSize={8}
        fill="#94a3b8"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {payload.country}
      </text>
    </g>
  );
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ResultsPanel({ result, onClose, onDownload }: { result: SimResult; onClose: () => void; onDownload: () => void }) {
  const images = useModuleImages();
  const pct = (n: number, max: number) => Math.round((n / max) * 100);
  const gradeColor = result.letterGrade === "A" ? "text-green-500" :
    result.letterGrade === "B" ? "text-blue-500" :
    result.letterGrade === "C" ? "text-yellow-500" : "text-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className={`border-2 ${result.isFinal ? "border-green-500/40 bg-green-500/5" : "border-primary/30 bg-primary/5"}`}>
        <CardContent className="p-6">
          <img
            src={images.module1.results.src}
            alt={images.module1.results.alt}
            className="w-full rounded-md mb-2"
            style={{ height: "180px", objectFit: "cover" }}
            loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.results.src; if (t.src !== def) t.src = def; }}
                  />
          <p className="text-xs italic text-muted-foreground px-1 pb-4">{images.module1.results.caption}</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {result.isFinal ? <CheckCircle className="w-5 h-5 text-green-500" /> : <TrendingUp className="w-5 h-5 text-primary" />}
                <h3 className="text-xl font-bold">
                  {result.isFinal ? "Final Submission Result" : `Practice Run #${result.runNumber}`}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">
                {result.isFinal ? "This score counts toward your grade" : "Keep practicing to improve!"}
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-primary">{result.score}</div>
              <div className="text-muted-foreground text-sm">/ {result.maxScore} pts</div>
              <div className={`text-2xl font-bold mt-1 ${gradeColor}`}>{result.letterGrade}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Forecasting & Planning", score: result.scoreBreakdown.forecasting, max: 15 },
            { label: "Supplier Selection — MCDA", score: result.scoreBreakdown.supplierMethod, max: 12 },
            { label: "Cost / Service / Risk Trade-offs", score: result.scoreBreakdown.tradeoffs, max: 12 },
            { label: "Quality + Sustainability", score: result.scoreBreakdown.qualitySustainability, max: 8 },
            { label: "Validity", score: result.scoreBreakdown.validityJustification, max: 5 },
          ].map((cat) => (
            <div key={cat.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{cat.label}</span>
                <span className="font-bold text-primary">{cat.score}/{cat.max}</span>
              </div>
              <Progress value={pct(cat.score, cat.max)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Cost", value: `€${result.kpis.totalProcurementCost.toLocaleString()}`,
            sub: (() => {
              if (!result.kpis.totalProcurementCost) return undefined;
              const tPct = Math.round(result.kpis.transportCost / result.kpis.totalProcurementCost * 100);
              const tier = tPct <= BENCHMARK_TRANSPORT_PCT_BEST
                ? `≤${BENCHMARK_TRANSPORT_PCT_BEST}% — best-in-class`
                : tPct <= BENCHMARK_TRANSPORT_PCT_TYPICAL
                ? `${BENCHMARK_TRANSPORT_PCT_BEST}–${BENCHMARK_TRANSPORT_PCT_TYPICAL}% — industry typical`
                : `>${BENCHMARK_TRANSPORT_PCT_TYPICAL}% — above typical`;
              return `Transport ${tPct}% of total · ${tier}`;
            })(),
          },
          {
            label: "Lead Time", value: `${result.kpis.avgLeadTimeDays}d`,
            sub: result.kpis.avgLeadTimeDays > NEARSHORE_LEAD_DAYS
              ? `${result.kpis.avgLeadTimeDays - NEARSHORE_LEAD_DAYS}d longer than nearshore avg`
              : "At nearshore speed",
          },
          {
            label: "Reliability", value: `${result.kpis.avgReliabilityPct}%`,
            sub: result.kpis.avgReliabilityPct >= BENCHMARK_RELIABILITY_BEST
              ? `Best-in-class (≥${BENCHMARK_RELIABILITY_BEST}%)`
              : result.kpis.avgReliabilityPct >= BENCHMARK_RELIABILITY_TYPICAL
              ? "Industry typical"
              : `Below typical (<${BENCHMARK_RELIABILITY_TYPICAL}%)`,
          },
          { label: "Sustainability", value: `${result.kpis.avgSustainability}/5` },
          { label: "Quality", value: `${result.kpis.avgQuality}/5` },
          {
            label: "CO₂", value: `${result.kpis.totalCo2.toLocaleString()} kg`,
            sub: `≈ ${Math.round(result.kpis.totalCo2 / CO2_KG_PER_FLIGHT)} flights · ${Math.round(result.kpis.totalCo2 * CAR_KM_PER_KG_CO2 / 1000)}k km by car`,
          },
          { label: "Forecast Error", value: `${result.kpis.forecastErrorPct}%` },
          { label: "Late Deliveries", value: `${result.kpis.lateDeliveries}/${result.kpis.totalDeliveries}` },
        ].map((k) => (
          <div key={k.label} className="bg-muted/40 rounded-xl p-3 text-center border border-border/50">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{k.label}</div>
            <div className="text-lg font-bold">{k.value}</div>
            {"sub" in k && k.sub && (
              <div className="text-[10px] text-muted-foreground/60 italic mt-0.5 leading-tight">{k.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Demand Accuracy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Demand Realisation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">SKU A Forecast</p>
            <p className="font-bold">{result.kpis.forecastA.toLocaleString()} → Actual: {result.kpis.actualA.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">SKU B Forecast</p>
            <p className="font-bold">{result.kpis.forecastB.toLocaleString()} → Actual: {result.kpis.actualB.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cotton</p>
            <p className="font-bold">{result.kpis.cottonAllocatedKg.toLocaleString()} kg ordered / {result.kpis.cottonRequiredKg.toLocaleString()} kg needed</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nylon</p>
            <p className="font-bold">{result.kpis.nylonAllocatedKg.toLocaleString()} kg ordered / {result.kpis.nylonRequiredKg.toLocaleString()} kg needed</p>
          </div>
        </CardContent>
      </Card>

      {/* Materials Received (accounts for supplier delivery shortfalls) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Materials Received</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Cotton</p>
            <p className="font-bold">
              {result.kpis.cottonReceivedKg.toLocaleString()} kg / {result.kpis.cottonAllocatedKg.toLocaleString()} kg ordered
              {result.kpis.cottonAllocatedKg > 0 && result.kpis.cottonReceivedKg < result.kpis.cottonAllocatedKg && (
                <span className="ml-1 text-xs font-normal text-amber-600 dark:text-amber-400">
                  (−{(100 - (result.kpis.cottonReceivedKg / result.kpis.cottonAllocatedKg) * 100).toFixed(1)}% shortfall)
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Nylon</p>
            <p className="font-bold">
              {result.kpis.nylonReceivedKg.toLocaleString()} kg / {result.kpis.nylonAllocatedKg.toLocaleString()} kg ordered
              {result.kpis.nylonAllocatedKg > 0 && result.kpis.nylonReceivedKg < result.kpis.nylonAllocatedKg && (
                <span className="ml-1 text-xs font-normal text-amber-600 dark:text-amber-400">
                  (−{(100 - (result.kpis.nylonReceivedKg / result.kpis.nylonAllocatedKg) * 100).toFixed(1)}% shortfall)
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Flags */}
      {result.validationFlags.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold text-sm">Validation Warnings</span>
            </div>
            <ul className="space-y-1">
              {result.validationFlags.map((f, i) => (
                <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300">• {f}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {result.feedback.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.feedback.map((f, i) => (
              <div key={i} className="text-sm pl-3 border-l-2 border-primary/40 py-1 text-muted-foreground">{f}</div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onDownload} className="flex-1 gap-2">
          <FileDown className="w-4 h-4" /> Download Report
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">
          ← Back to Decision Form
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Module1Page() {
  const images = useModuleImages();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moduleData, isLoading } = useGetModuleData("M1", {
    query: { queryKey: getGetModuleDataQueryKey("M1"), enabled: true }
  });
  const { data: currentUser } = useGetCurrentUser();

  // ── Historical data ──
  const [historicalData, setHistoricalData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/student/modules/M1/historical")
      .then((r) => r.json())
      .then(setHistoricalData)
      .catch(() => {});
  }, []);

  const [guideOpen, setGuideOpen] = useState(false);

  // ── Form State ──
  const [forecastA, setForecastA] = useState("");
  const [forecastB, setForecastB] = useState("");
  const [forecastMethodA, setForecastMethodA] = useState("");
  const [forecastMethodB, setForecastMethodB] = useState("");
  const [purchaseReport, setPurchaseReport] = useState(false);
  const [justification, setJustification] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([
    { id: crypto.randomUUID(), supplierId: "", materialType: "cotton", kg: "", transportMode: "truck", assurancePackage: "standard", numBatches: "1" },
    { id: crypto.randomUUID(), supplierId: "", materialType: "nylon", kg: "", transportMode: "truck", assurancePackage: "standard", numBatches: "1" },
  ]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // ── Submission state ──
  const [isPracticing, setIsPracticing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SimResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // ── Computed material requirements ──
  const cottonKg = forecastA ? (parseFloat(forecastA) * 0.23 * 1.06).toFixed(0) : null;
  const nylonKg = forecastB ? (parseFloat(forecastB) * 0.42 * 1.08).toFixed(0) : null;

  const buildPayload = useCallback(() => {
    return {
      forecastA: parseFloat(forecastA) || 0,
      forecastB: parseFloat(forecastB) || 0,
      forecastMethodA,
      forecastMethodB,
      purchaseReport,
      justification,
      allocations: allocations
        .filter((a) => a.supplierId && parseFloat(a.kg) > 0)
        .map((a) => ({
          supplierId: a.supplierId,
          materialType: a.materialType,
          kg: parseFloat(a.kg),
          transportMode: a.transportMode,
          assurancePackage: a.assurancePackage,
          numBatches: parseInt(a.numBatches) || 1,
        })),
    };
  }, [forecastA, forecastB, forecastMethodA, forecastMethodB, purchaseReport, justification, allocations]);

  const handleDownloadReport = useCallback(() => {
    if (!lastResult) return;
    openSimulationReport({
      moduleKey: "M1",
      isPractice: !lastResult.isFinal,
      studentName: currentUser?.name ?? "Student",
      studentId: currentUser?.studentId ?? null,
      section: currentUser?.section ?? null,
      completedAt: new Date(),
      runNumber: lastResult.runNumber,
      decisions: buildPayload(),
      result: lastResult as any,
      justification,
    });
  }, [lastResult, currentUser, buildPayload, justification]);

  const runPractice = async () => {
    setIsPracticing(true);
    try {
      const resp = await fetch("/api/student/modules/M1/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Practice run failed");

      setLastResult({ ...data, isFinal: false });
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey("M1") });
      queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      toast({ title: "Practice Run Complete", description: `Run #${data.runNumber} scored ${data.score}/${data.maxScore} pts` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsPracticing(false);
    }
  };

  const runSubmit = async () => {
    setIsSubmitting(true);
    try {
      const resp = await fetch("/api/student/modules/M1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Submission failed");

      setLastResult({ ...data, isFinal: true });
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey("M1") });
      queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      toast({ title: "Module 1 Submitted!", description: `Final score: ${data.score}/${data.maxScore} pts — Grade: ${data.letterGrade}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = useCallback((presetId: string) => {
    const preset = STRATEGY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const cottonTotal = cottonKg ? parseInt(cottonKg) : 0;
    const nylonTotal  = nylonKg  ? parseInt(nylonKg)  : 0;

    // Compute kg per row, giving the last row of each material type the exact
    // remainder so that rounding never produces an over- or under-allocation.
    const cottonRows = preset.rows.filter((r) => r.materialType === "cotton");
    const nylonRows  = preset.rows.filter((r) => r.materialType === "nylon");

    const computeKgs = (rows: typeof cottonRows, total: number, shareKey: "cottonShare" | "nylonShare"): Map<typeof rows[number], string> => {
      const result = new Map<typeof rows[number], string>();
      if (total <= 0) { rows.forEach((r) => result.set(r, "")); return result; }
      let assigned = 0;
      rows.forEach((row, i) => {
        const isLast = i === rows.length - 1;
        const share = (row as any)[shareKey] as number ?? 0;
        const kg = isLast ? total - assigned : Math.round(total * share);
        assigned += kg;
        result.set(row, String(kg));
      });
      return result;
    };

    const cottonKgs = computeKgs(cottonRows as any, cottonTotal, "cottonShare");
    const nylonKgs  = computeKgs(nylonRows  as any, nylonTotal,  "nylonShare");

    const newAllocations: Allocation[] = preset.rows.map((row) => ({
      id: crypto.randomUUID(),
      supplierId: row.supplierId,
      materialType: row.materialType,
      kg: row.materialType === "cotton"
        ? (cottonKgs.get(row as any) ?? "")
        : (nylonKgs.get(row as any) ?? ""),
      transportMode: row.transportMode,
      assurancePackage: row.assurancePackage,
      numBatches: row.numBatches,
    }));
    setAllocations(newAllocations);
    setActivePreset(presetId);
  }, [cottonKg, nylonKg]);

  const addAllocation = () => {
    setActivePreset(null);
    setAllocations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), supplierId: "", materialType: "cotton", kg: "", transportMode: "truck", assurancePackage: "standard", numBatches: "1" },
    ]);
  };

  const removeAllocation = (id: string) => {
    setActivePreset(null);
    setAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAllocation = (id: string, field: keyof Allocation, value: string) => {
    setActivePreset(null);
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, [field]: value };
        if (field === "supplierId") {
          const supplier = SUPPLIERS.find((s) => s.id === value);
          if (supplier) {
            updated.transportMode = supplier.region === "nearshore" ? "truck" : "ocean";
          }
        }
        return updated;
      }),
    );
  };

  const getTransportOptions = (supplierId: string) => {
    const supplier = SUPPLIERS.find((s) => s.id === supplierId);
    if (!supplier) return NEARSHORE_TRANSPORTS;
    return supplier.region === "nearshore" ? NEARSHORE_TRANSPORTS : OFFSHORE_TRANSPORTS;
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const isSubmitted = moduleData?.isSubmitted;
  const practiceCount = moduleData?.practiceCount ?? 0;
  const practiceAtLimit = practiceCount >= 4;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6 pl-0 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>

      {/* Module 1 banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-40 md:h-52 shadow-md">
        <img
          src={`${import.meta.env.BASE_URL}img/banner-module1.png`}
          alt="Global supplier network and fabric sourcing"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Module 1</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Global Sourcing</h2>
          <p className="text-white/70 text-sm">Select suppliers, modes of transport &amp; order quantities for Veloce Wear</p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-display font-bold">Module 1: Global Sourcing</h1>
            {isSubmitted ? (
              <Badge className="bg-green-500 hover:bg-green-600">Submitted</Badge>
            ) : (
              <Badge variant="secondary">In Progress</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Veloce Wear Manufacturing — Porto, Portugal • 55 points total</p>
          {!isSubmitted && moduleData?.windowEnabled !== false && (() => {
            const windowEnd = moduleData?.windowEnd ? new Date(moduleData.windowEnd) : null;
            const windowStart = moduleData?.windowStart ? new Date(moduleData.windowStart) : null;
            if (windowStart && isFuture(windowStart)) {
              return (
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  Opens {format(windowStart, "MMM d, yyyy")}
                </span>
              );
            }
            if (windowEnd && isPast(windowEnd)) {
              return (
                <span className="text-sm text-destructive font-medium flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Window Closed
                </span>
              );
            }
            if (windowEnd) {
              const daysLeft = differenceInDays(windowEnd, new Date());
              const isClosingSoon = daysLeft >= 0 && daysLeft <= 7;
              return (
                <span className={`text-sm flex items-center gap-1.5 mt-1 ${isClosingSoon ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                  Closes {format(windowEnd, "MMM d, yyyy")}
                  {isClosingSoon && ` (${daysLeft === 0 ? "today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`})`}
                </span>
              );
            }
            return null;
          })()}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setGuideOpen(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Student Guide
          </Button>
        {isSubmitted && moduleData?.finalSubmission && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Final Score</p>
                <p className="text-2xl font-bold">{moduleData.finalSubmission.score}<span className="text-base font-normal text-muted-foreground">/{moduleData.finalSubmission.maxScore ?? 52}</span></p>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* ── Results or Form ── */}
      <AnimatePresence mode="wait">
        {showResults && lastResult ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsPanel result={lastResult} onClose={() => setShowResults(false)} onDownload={handleDownloadReport} />
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* ── Supplier Bubble Chart ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> Interactive Supplier Trade-off Analysis
                </CardTitle>
                <CardDescription>
                  Bubble size = Sustainability score. Hover for full specs. Green = Nearshore, Purple = Offshore.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={images.module1.supplierBubbleChart.src}
                  alt={images.module1.supplierBubbleChart.alt}
                  className="w-full rounded-md mb-2"
                  style={{ height: "180px", objectFit: "cover" }}
                  loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.supplierBubbleChart.src; if (t.src !== def) t.src = def; }}
                  />
                <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module1.supplierBubbleChart.caption}</p>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        type="number" dataKey="cost" name="Cost" unit="€"
                        domain={[2.7, 4.0]}
                        label={{ value: "Cotton Cost per Kg (€)", position: "insideBottom", offset: -15, style: { fontSize: 13, fontWeight: 600, fill: "hsl(var(--muted-foreground))" } }}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        type="number" dataKey="quality" name="Quality"
                        domain={[65, 100]}
                        label={{ value: "Quality (0-100)", angle: -90, position: "insideLeft", style: { fontSize: 13, fontWeight: 600, fill: "hsl(var(--muted-foreground))" } }}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ZAxis type="number" dataKey="sustainability" range={[150, 700]} name="Sustainability" />
                      <ReTooltip content={<BubbleTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
                      <Scatter name="Nearshore (Portugal, Turkey)" data={VIZ_DATA.filter(d => d.region === "Nearshore")} fill="#10b981" shape={BubbleDot}>
                        {VIZ_DATA.filter(d => d.region === "Nearshore").map((_, i) => <Cell key={i} fill="#10b981" />)}
                      </Scatter>
                      <Scatter name="Offshore (Vietnam, Mexico)" data={VIZ_DATA.filter(d => d.region === "Offshore")} fill="#8b5cf6" shape={BubbleDot}>
                        {VIZ_DATA.filter(d => d.region === "Offshore").map((_, i) => <Cell key={i} fill="#8b5cf6" />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground grid grid-cols-2 gap-2">
                  <div>📍 <strong>Top-Right:</strong> High quality + High cost</div>
                  <div>🏆 <strong>Top-Left:</strong> High quality + Low cost (best value)</div>
                  <div>⚪ <strong>Bubble Size:</strong> Larger = More sustainable</div>
                  <div>🌿 <strong>Target:</strong> Certified suppliers (GOTS, OEKO-TEX) for Veloce mission</div>
                </div>
              </CardContent>
            </Card>

            {/* ── Historical Demand Data ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Historical Demand Data (30 Years)
                </CardTitle>
                <CardDescription>
                  Analyse the trend to forecast Year 31. Your forecast will appear as a dashed projection — run a simulation to reveal the actual demand.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={images.module1.historicalDemand.src}
                  alt={images.module1.historicalDemand.alt}
                  className="w-full rounded-md mb-2"
                  style={{ height: "180px", objectFit: "cover" }}
                  loading="lazy"
                  onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.historicalDemand.src; if (t.src !== def) t.src = def; }}
                />
                <p className="text-xs italic text-muted-foreground px-1 pb-4">{images.module1.historicalDemand.caption}</p>
                {historicalData ? (
                  <DemandForecastChart
                    dataPoints={historicalData.dataPoints}
                    avgA={historicalData.avgA}
                    avgB={historicalData.avgB}
                    trendA={historicalData.trendA}
                    trendB={historicalData.trendB}
                    forecastA={forecastA ? parseFloat(forecastA) : undefined}
                    forecastB={forecastB ? parseFloat(forecastB) : undefined}
                    actualA={lastResult?.kpis.actualA}
                    actualB={lastResult?.kpis.actualB}
                  />
                ) : (
                  <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
                )}
              </CardContent>
            </Card>

            {/* ── The Decision Form ── */}
            <div className="space-y-6">

              {/* Section 1: Forecasting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> 1. Demand Forecasting (Year 31)
                  </CardTitle>
                  <CardDescription>Enter your forecast for each SKU and select your method</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <img
                    src={images.module1.demandForecasting.src}
                    alt={images.module1.demandForecasting.alt}
                    className="w-full rounded-md mb-2"
                    style={{ height: "180px", objectFit: "cover" }}
                    loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.demandForecasting.src; if (t.src !== def) t.src = def; }}
                  />
                  <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module1.demandForecasting.caption}</p>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="forecastA">SKU A Forecast (units)</Label>
                      <Input
                        id="forecastA" type="number" min="0" step="1"
                        placeholder="e.g. 18500"
                        value={forecastA}
                        onChange={(e) => setForecastA(e.target.value)}
                        disabled={isSubmitted}
                      />
                      <p className="text-xs text-muted-foreground">BOM: 0.23 kg cotton × 1.06 scrap/unit</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="forecastB">SKU B Forecast (units)</Label>
                      <Input
                        id="forecastB" type="number" min="0" step="1"
                        placeholder="e.g. 9200"
                        value={forecastB}
                        onChange={(e) => setForecastB(e.target.value)}
                        disabled={isSubmitted}
                      />
                      <p className="text-xs text-muted-foreground">BOM: 0.42 kg nylon × 1.08 scrap/unit</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label>SKU A Forecasting Method</Label>
                      <Select value={forecastMethodA} onValueChange={setForecastMethodA} disabled={isSubmitted}>
                        <SelectTrigger><SelectValue placeholder="Select method for SKU A…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear_regression">Linear Regression</SelectItem>
                          <SelectItem value="moving_average">Moving Average (4-Year)</SelectItem>
                          <SelectItem value="exponential_smoothing">Exponential Smoothing</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Choose based on the demand pattern you observe for SKU A</p>
                    </div>
                    <div className="space-y-2">
                      <Label>SKU B Forecasting Method</Label>
                      <Select value={forecastMethodB} onValueChange={setForecastMethodB} disabled={isSubmitted}>
                        <SelectTrigger><SelectValue placeholder="Select method for SKU B…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear_regression">Linear Regression</SelectItem>
                          <SelectItem value="moving_average">Moving Average (4-Year)</SelectItem>
                          <SelectItem value="exponential_smoothing">Exponential Smoothing</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Choose based on the demand pattern you observe for SKU B</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id="report"
                      checked={purchaseReport}
                      onCheckedChange={(v) => setPurchaseReport(!!v)}
                      disabled={isSubmitted}
                    />
                    <div>
                      <Label htmlFor="report" className="cursor-pointer font-medium">
                        Purchase Market Intelligence Report (+€10,000)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reduces demand uncertainty: SKU A 10%→7%, SKU B 6%→4%
                      </p>
                    </div>
                  </div>

                  {(cottonKg || nylonKg) && (
                    <div className="p-4 border-2 border-primary/20 rounded-xl bg-primary/5">
                      <p className="text-sm font-semibold mb-2">Calculated Material Requirements:</p>
                      <div className="flex gap-8 text-sm">
                        {cottonKg && <span>Cotton: <strong className="text-primary text-lg">{parseInt(cottonKg).toLocaleString()}</strong> kg</span>}
                        {nylonKg && <span>Nylon: <strong className="text-primary text-lg">{parseInt(nylonKg).toLocaleString()}</strong> kg</span>}
                      </div>
                      <div className="mt-3 p-2.5 border border-green-300 bg-green-50 rounded-lg text-xs text-green-900 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" /> BOM Calculation — your forecast values substituted in
                        </p>
                        {cottonKg && forecastA && (
                          <p><strong>SKU A (Trend Tee):</strong> {parseInt(forecastA).toLocaleString()} units × 0.23 kg × 1.06 yield factor = <strong className="text-green-700">{parseInt(cottonKg).toLocaleString()} kg cotton</strong></p>
                        )}
                        {nylonKg && forecastB && (
                          <p><strong>SKU B (Core Jogger):</strong> {parseInt(forecastB).toLocaleString()} units × 0.42 kg × 1.08 yield factor = <strong className="text-green-700">{parseInt(nylonKg).toLocaleString()} kg nylon</strong></p>
                        )}
                        <p className="text-[11px] text-green-700 border-t border-green-200 pt-1.5">
                          ✓ These quantities automatically cascade into Module 2 as your raw material baseline. Ensure your supplier allocations cover these totals.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 2: Supplier Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" /> 2. Supplier Allocation Strategy
                  </CardTitle>
                  <CardDescription>
                    Allocate material quantities across suppliers. Use 2–4 suppliers for best scoring.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img
                    src={images.module1.supplierAllocation.src}
                    alt={images.module1.supplierAllocation.alt}
                    className="w-full rounded-md mb-2"
                    style={{ height: "180px", objectFit: "cover" }}
                    loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.supplierAllocation.src; if (t.src !== def) t.src = def; }}
                  />
                  <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module1.supplierAllocation.caption}</p>

                  {/* Interactive supplier world map */}
                  <SupplierWorldMap
                    suppliers={SUPPLIERS}
                    allocations={allocations}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground px-1 pb-2">
                    Select suppliers below to see live trade routes. Hover pins or lines for lead time, CO₂, and cost details.
                  </p>

                  {/* ── Strategy Presets ── */}
                  {!isSubmitted && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Procurement Strategy Presets
                        </p>
                        {activePreset && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            Active
                          </span>
                        )}
                        {!activePreset && allocations.some(a => a.supplierId) && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {STRATEGY_PRESETS.map((preset) => {
                          const isActive = activePreset === preset.id;
                          const Icon = preset.id === "nearshore" ? Zap : preset.id === "mixed" ? Scale : DollarSign;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => applyPreset(preset.id)}
                              className={`text-left rounded-xl border p-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                ${isActive ? preset.activeClass : preset.colorClass}`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                                  {preset.label}
                                </span>
                                {isActive && (
                                  <CheckCircle className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
                                )}
                              </div>
                              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mb-1.5 ${preset.badgeClass}`}>
                                {preset.badge}
                              </span>
                              <p className="text-[11px] text-muted-foreground leading-snug">{preset.description}</p>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Applying a preset fills in suppliers, transport modes, and quantities (based on your forecast). You can edit any row afterwards.
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Supplier</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Material</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Qty (kg)</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Transport</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Assurance</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Batches</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {allocations.map((alloc) => {
                          const supplier = SUPPLIERS.find((s) => s.id === alloc.supplierId);
                          const transports = getTransportOptions(alloc.supplierId);
                          return (
                            <tr key={alloc.id}>
                              <td className="p-1.5 min-w-[160px]">
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Select
                                          value={alloc.supplierId}
                                          onValueChange={(v) => updateAllocation(alloc.id, "supplierId", v)}
                                          disabled={isSubmitted}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select supplier…" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {SUPPLIERS.map((s) => (
                                              <SelectItem key={s.id} value={s.id}>
                                                {s.id} – {s.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        {supplier && (
                                          <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">
                                            {COUNTRY_FLAG[supplier.country] ?? "🌍"} {supplier.country} • {supplier.leadTime}d lead
                                          </p>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    {supplier && (
                                      <TooltipContent side="right" className="text-xs max-w-[220px] space-y-1 p-3">
                                        <p className="font-bold">{supplier.name}</p>
                                        <p className="text-muted-foreground">{COUNTRY_FLAG[supplier.country] ?? "🌍"} {supplier.country} — {supplier.region}</p>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                                          <span className="text-muted-foreground">Cotton</span><span className="font-medium">€{supplier.cottonPrice}/kg</span>
                                          <span className="text-muted-foreground">Nylon</span><span className="font-medium">€{supplier.nylonPrice}/kg</span>
                                          <span className="text-muted-foreground">Lead time</span><span className="font-medium">{supplier.leadTime} days</span>
                                          <span className="text-muted-foreground">Reliability</span><span className="font-medium">{supplier.reliability}%</span>
                                          <span className="text-muted-foreground">Quality</span><span className="font-medium">{supplier.quality}/5</span>
                                          <span className="text-muted-foreground">Sustainability</span><span className="font-medium">{supplier.sustainability}/5</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">{supplier.certs}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              <td className="p-1.5 min-w-[100px]">
                                <Select
                                  value={alloc.materialType}
                                  onValueChange={(v) => updateAllocation(alloc.id, "materialType", v)}
                                  disabled={isSubmitted}
                                >
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cotton">Cotton</SelectItem>
                                    <SelectItem value="nylon">Nylon</SelectItem>
                                  </SelectContent>
                                </Select>
                                {supplier && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">
                                    €{alloc.materialType === "cotton" ? supplier.cottonPrice : supplier.nylonPrice}/kg
                                  </p>
                                )}
                              </td>
                              <td className="p-1.5 min-w-[110px]">
                                <Input
                                  type="number" min="0" step="0.1" placeholder="0"
                                  className="h-9"
                                  value={alloc.kg}
                                  onChange={(e) => updateAllocation(alloc.id, "kg", e.target.value)}
                                  disabled={isSubmitted}
                                />
                              </td>
                              <td className="p-1.5 min-w-[180px]">
                                <Select
                                  value={alloc.transportMode}
                                  onValueChange={(v) => updateAllocation(alloc.id, "transportMode", v)}
                                  disabled={isSubmitted}
                                >
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {transports.map((t) => (
                                      <SelectItem key={t} value={t}>{TRANSPORT_LABELS[t]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1.5 min-w-[190px]">
                                <Select
                                  value={alloc.assurancePackage}
                                  onValueChange={(v) => updateAllocation(alloc.id, "assurancePackage", v)}
                                  disabled={isSubmitted}
                                >
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(["standard", "priority", "premium"] as const).map((a) => (
                                      <SelectItem key={a} value={a}>{ASSURANCE_LABELS[a]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1.5 w-20">
                                <Select
                                  value={String(alloc.numBatches)}
                                  onValueChange={(v) => updateAllocation(alloc.id, "numBatches", v)}
                                  disabled={isSubmitted}
                                >
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1.5">
                                <Button
                                  variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive"
                                  onClick={() => removeAllocation(alloc.id)}
                                  disabled={isSubmitted || allocations.length <= 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!isSubmitted && (
                    <Button variant="outline" size="sm" onClick={addAllocation} className="mt-2">
                      <Plus className="w-4 h-4 mr-2" /> Add Supplier
                    </Button>
                  )}

                  {/* BOM Material Coverage Indicator */}
                  {(cottonKg || nylonKg) && (() => {
                    const cottonAllocated = allocations
                      .filter((a) => a.materialType === "cotton")
                      .reduce((sum, a) => sum + (parseFloat(a.kg) || 0), 0);
                    const nylonAllocated = allocations
                      .filter((a) => a.materialType === "nylon")
                      .reduce((sum, a) => sum + (parseFloat(a.kg) || 0), 0);

                    const rows: { label: string; allocated: number; required: number }[] = [];
                    if (cottonKg) rows.push({ label: "Cotton", allocated: cottonAllocated, required: parseInt(cottonKg) });
                    if (nylonKg) rows.push({ label: "Nylon", allocated: nylonAllocated, required: parseInt(nylonKg) });

                    const anyOver = rows.some(r => r.allocated > r.required);
                    return (
                      <div className={`mt-3 p-4 border rounded-xl space-y-3 ${anyOver ? "border-red-300 bg-red-50/60 dark:bg-red-950/20" : "border-border bg-muted/20"}`}>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">BOM Material Coverage</p>
                          {anyOver && (
                            <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">⚠ Over-allocated</span>
                          )}
                        </div>
                        {rows.map(({ label, allocated, required }) => {
                          const ratio = required > 0 ? allocated / required : 0;
                          const pct = Math.min(ratio * 100, 100);
                          const isOverAllocated = allocated > required;
                          const excessKg = Math.round(allocated - required);
                          const isAmber = !isOverAllocated && ratio >= 0.8;
                          const barColor = isOverAllocated ? "bg-red-500" : ratio >= 1 ? "bg-green-500" : isAmber ? "bg-amber-500" : "bg-red-400";
                          const textColor = isOverAllocated ? "text-red-600 dark:text-red-400" : ratio >= 1 ? "text-green-600 dark:text-green-400" : isAmber ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
                          return (
                            <div key={label} className="space-y-0.5">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium">{label}</span>
                                <span className={`text-sm font-semibold tabular-nums ${textColor}`}>
                                  {allocated.toLocaleString()} / {required.toLocaleString()} kg
                                  {isOverAllocated && <span className="ml-1 text-xs font-normal">(⚠ {excessKg.toLocaleString()} kg over)</span>}
                                  {!isOverAllocated && ratio >= 1 && <span className="ml-1 text-xs font-normal">(✓ covered)</span>}
                                  {!isOverAllocated && ratio < 1 && <span className="ml-1 text-xs font-normal">({(required - allocated).toLocaleString()} kg short)</span>}
                                </span>
                              </div>
                              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {isOverAllocated && (
                                <p className="text-xs text-red-600 pt-0.5">Excess kg adds inventory cost — trim this allocation to hit your BOM target exactly.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Procurement Cost Estimate */}
                  {(() => {
                    type CostRow = {
                      alloc: Allocation;
                      supplier: typeof SUPPLIERS[0];
                      kg: number;
                      materialCost: number;
                      transportCost: number;
                      orderCost: number;
                    };

                    const rows: CostRow[] = allocations.flatMap((alloc) => {
                      const supplier = SUPPLIERS.find((s) => s.id === alloc.supplierId);
                      if (!supplier) return [];
                      const kg = parseFloat(alloc.kg) || 0;
                      if (kg <= 0) return [];
                      const basePrice = alloc.materialType === "cotton" ? supplier.cottonPrice : supplier.nylonPrice;
                      const assurancePremium = ASSURANCE_PRICE_PREMIUM[alloc.assurancePackage] ?? 0;
                      const materialCost = kg * basePrice * (1 + assurancePremium);
                      const transportCost = kg * (TRANSPORT_COST_PER_KG[alloc.transportMode] ?? 0);
                      const orderCost = (parseInt(alloc.numBatches) || 1) * ORDER_COST_PER_BATCH;
                      return [{ alloc, supplier, kg, materialCost, transportCost, orderCost }];
                    });

                    const totalMaterial = rows.reduce((s, r) => s + r.materialCost, 0);
                    const totalTransport = rows.reduce((s, r) => s + r.transportCost, 0);
                    const totalOrder = rows.reduce((s, r) => s + r.orderCost, 0);
                    const reportCost = purchaseReport ? 10000 : 0;
                    const grandTotal = totalMaterial + totalTransport + totalOrder + reportCost;

                    if (rows.length === 0 && !purchaseReport) return null;

                    const fmt = (n: number) => "€" + Math.round(n).toLocaleString("en-US");

                    return (
                      <div className="mt-3 p-4 border border-border rounded-xl bg-muted/20 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Estimated Procurement Cost
                        </p>
                        <div className="space-y-1">
                          {rows.map((r) => {
                            const basePrice = r.alloc.materialType === "cotton" ? r.supplier.cottonPrice : r.supplier.nylonPrice;
                            const assurancePct = ASSURANCE_PRICE_PREMIUM[r.alloc.assurancePackage] ?? 0;
                            const transportRate = TRANSPORT_COST_PER_KG[r.alloc.transportMode] ?? 0;
                            const rowTotal = r.materialCost + r.transportCost + r.orderCost;
                            return (
                              <TooltipProvider key={r.alloc.id} delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex justify-between items-baseline text-xs text-muted-foreground cursor-default hover:text-foreground transition-colors">
                                      <span className="truncate max-w-[55%]">
                                        {r.supplier.id} – {r.alloc.materialType} ({r.kg.toLocaleString()} kg)
                                      </span>
                                      <span className="tabular-nums font-medium text-foreground underline decoration-dotted">
                                        {fmt(rowTotal)}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs space-y-1 p-3 min-w-[200px]">
                                    <p className="font-semibold mb-1">{r.supplier.name} — {r.alloc.materialType}</p>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                      <span className="text-muted-foreground">Base price</span><span>€{basePrice}/kg</span>
                                      {assurancePct > 0 && <><span className="text-muted-foreground">Assurance</span><span>+{(assurancePct * 100).toFixed(0)}% → €{(basePrice * (1 + assurancePct)).toFixed(2)}/kg</span></>}
                                      <span className="text-muted-foreground">Transport</span><span>€{transportRate}/kg ({TRANSPORT_LABELS[r.alloc.transportMode]?.split(" ")[0]})</span>
                                      <span className="text-muted-foreground">Material total</span><span>{fmt(r.materialCost)}</span>
                                      <span className="text-muted-foreground">Transport total</span><span>{fmt(r.transportCost)}</span>
                                      <span className="text-muted-foreground">Order cost</span><span>{fmt(r.orderCost)}</span>
                                    </div>
                                    <div className="border-t border-border pt-1 flex justify-between font-semibold">
                                      <span>Row total</span><span>{fmt(rowTotal)}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Cost per kg: {fmt(rowTotal / r.kg)}/kg</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                          {purchaseReport && (
                            <div className="flex justify-between items-baseline text-xs text-muted-foreground">
                              <span>Market Intelligence Report</span>
                              <span className="tabular-nums font-medium text-foreground">{fmt(10000)}</span>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-border pt-2 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Material costs</span>
                            <span className="tabular-nums">{fmt(totalMaterial)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Transport costs</span>
                            <span className="tabular-nums">{fmt(totalTransport)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Order processing</span>
                            <span className="tabular-nums">{fmt(totalOrder)}</span>
                          </div>
                          {purchaseReport && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Market report</span>
                              <span className="tabular-nums">{fmt(reportCost)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-baseline font-semibold text-sm pt-1 border-t border-border">
                            <span>Total Estimated Cost</span>
                            <span className="tabular-nums text-primary text-base">{fmt(grandTotal)}</span>
                          </div>
                        </div>
                        {(() => {
                          const cottonAllocated = rows.filter(r => r.alloc.materialType === "cotton").reduce((s, r) => s + r.kg, 0);
                          const nylonAllocated  = rows.filter(r => r.alloc.materialType === "nylon").reduce((s, r) => s + r.kg, 0);
                          const minCotton = Math.min(...SUPPLIERS.map(s => s.cottonPrice));
                          const minNylon  = Math.min(...SUPPLIERS.map(s => s.nylonPrice));
                          const floorMaterial = cottonAllocated * minCotton + nylonAllocated * minNylon;
                          if (floorMaterial <= 0) return null;
                          const premiumPct = Math.round(((totalMaterial / floorMaterial) - 1) * 100);
                          const color = premiumPct <= 15 ? "text-green-600" : premiumPct <= 35 ? "text-amber-600" : "text-red-600";
                          const bg    = premiumPct <= 15 ? "bg-green-50 border-green-200" : premiumPct <= 35 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
                          return (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`mt-2 p-2.5 rounded-lg border cursor-default ${bg}`}>
                                    <div className="text-xs flex justify-between items-center mb-1.5">
                                      <span className="text-muted-foreground">Material premium vs. cheapest suppliers</span>
                                      <span className={`font-semibold tabular-nums ${color}`}>+{premiumPct}%</span>
                                    </div>
                                    {/* Progress bar with threshold zones */}
                                    <div className="relative h-2 rounded-full overflow-hidden flex">
                                      <div className="bg-green-400" style={{ width: "25%" }} />
                                      <div className="bg-amber-400" style={{ width: "33.3%" }} />
                                      <div className="bg-red-400 flex-1" />
                                    </div>
                                    <div
                                      className="relative h-0"
                                      style={{ marginTop: "-10px" }}
                                    >
                                      <div
                                        className="absolute w-2 h-3 bg-gray-700 dark:bg-gray-200 rounded-sm shadow"
                                        style={{ left: `${Math.min(premiumPct / 60 * 100, 97)}%`, transform: "translateX(-50%)" }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-muted-foreground mt-2">
                                      <span>0%</span><span className="ml-[calc(25%-6px)]">15%</span><span className="ml-[calc(33%-4px)]">35%</span><span>60%+</span>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs p-3 max-w-[240px]">
                                  <p className="font-semibold mb-1">Budget Benchmark</p>
                                  <p className="text-muted-foreground">Floor cost = buying all cotton at €{minCotton}/kg (cheapest) + nylon at €{minNylon}/kg (cheapest), no assurance premium.</p>
                                  <div className="mt-1 grid grid-cols-2 gap-x-3">
                                    <span className="text-muted-foreground">Floor material</span><span>{fmt(floorMaterial)}</span>
                                    <span className="text-muted-foreground">Your material</span><span>{fmt(totalMaterial)}</span>
                                    <span className="text-muted-foreground">Premium paid</span><span className={color}>+{premiumPct}% ({fmt(totalMaterial - floorMaterial)})</span>
                                  </div>
                                  <p className="mt-1 text-[10px] text-muted-foreground">Higher premium = better quality/sustainability. &lt;15% is efficient; &gt;35% may hurt cost score.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Estimate based on supplier prices, transport rates, assurance premiums, and batch processing fees. Actual cost may vary due to delivery outcomes.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Supplier Quick Reference */}
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Supplier Quick Reference (click to expand)
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs border border-border rounded-lg">
                        <thead className="bg-muted/50">
                          <tr>
                            {["Country","ID","Name","Region","Cotton €/kg","Nylon €/kg","Lead","Reliability","Quality","Sust."].map((h) => (
                              <th key={h} className="p-1.5 text-left font-medium text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {SUPPLIERS.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/20">
                              <td className="p-1.5 text-base leading-none">{COUNTRY_FLAG[s.country] ?? "🌍"}</td>
                              <td className="p-1.5 font-mono font-bold">{s.id}</td>
                              <td className="p-1.5">{s.name}</td>
                              <td className="p-1.5">
                                <Badge variant={s.region === "nearshore" ? "default" : "secondary"} className="text-[10px] px-1">
                                  {s.region}
                                </Badge>
                              </td>
                              <td className="p-1.5 tabular-nums">€{s.cottonPrice}</td>
                              <td className="p-1.5 tabular-nums">€{s.nylonPrice}</td>
                              <td className="p-1.5 tabular-nums">{s.leadTime}d</td>
                              <td className="p-1.5 tabular-nums">{s.reliability}%</td>
                              <td className="p-1.5 tabular-nums">{s.quality}</td>
                              <td className="p-1.5 tabular-nums">{s.sustainability}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </CardContent>
              </Card>

              {/* Section 3: Justification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" /> 3. Strategic Justification
                  </CardTitle>
                  <CardDescription>
                    Explain your methodology (MCDA, transport/risk tradeoffs, sustainability alignment).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <img
                    src={images.module1.strategicJustification.src}
                    alt={images.module1.strategicJustification.alt}
                    className="w-full rounded-md mb-2"
                    style={{ height: "180px", objectFit: "cover" }}
                    loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.strategicJustification.src; if (t.src !== def) t.src = def; }}
                  />
                  <p className="text-xs italic text-muted-foreground px-1 pb-2">{images.module1.strategicJustification.caption}</p>
                  <Textarea
                    rows={8}
                    placeholder="Explain your forecasting methodology, supplier selection criteria (MCDA weights), transport mode decisions, and how your strategy aligns with Veloce Wear's mission (quality, sustainability, agility)..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    disabled={isSubmitted}
                    className="resize-y"
                  />
                </CardContent>
              </Card>

              {/* ── Over-allocation warning ── */}
              {!isSubmitted && (() => {
                const cottonReq = cottonKg ? parseInt(cottonKg) : 0;
                const nylonReq  = nylonKg  ? parseInt(nylonKg)  : 0;
                const cottonAlloc = allocations.filter(a => a.materialType === "cotton").reduce((s, a) => s + (parseFloat(a.kg) || 0), 0);
                const nylonAlloc  = allocations.filter(a => a.materialType === "nylon").reduce((s, a) => s + (parseFloat(a.kg) || 0), 0);
                const overCotton = cottonReq > 0 && cottonAlloc > cottonReq;
                const overNylon  = nylonReq  > 0 && nylonAlloc  > nylonReq;
                if (!overCotton && !overNylon) return null;
                const msgs: string[] = [];
                if (overCotton) msgs.push(`Cotton: ${Math.round(cottonAlloc - cottonReq).toLocaleString()} kg over BOM`);
                if (overNylon)  msgs.push(`Nylon: ${Math.round(nylonAlloc - nylonReq).toLocaleString()} kg over BOM`);
                return (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700">Over-allocation detected</p>
                      <p className="text-red-600 text-xs mt-0.5">{msgs.join(" · ")}. Excess inventory increases holding and write-off costs, which will reduce your cost score. Trim each material to match your BOM requirement exactly.</p>
                    </div>
                  </div>
                );
              })()}

              {/* ── Submit Actions ── */}
              {!isSubmitted ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Practice Runs</span>
                      <span className={`font-semibold ${practiceAtLimit ? "text-destructive" : "text-foreground"}`}>
                        {practiceCount} / 4 used
                      </span>
                    </div>
                    <Button
                      size="lg" variant="outline"
                      className={`w-full h-12 border-primary/30 ${practiceAtLimit ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={runPractice}
                      disabled={isPracticing || isSubmitting || practiceAtLimit}
                      title={practiceAtLimit ? "Practice run limit reached — submit your final decision" : undefined}
                    >
                      {isPracticing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <TrendingUp className="w-5 h-5 mr-2 text-primary" />}
                      {practiceAtLimit ? "Limit Reached" : "Run Practice Simulation"}
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="lg"
                        className="flex-1 h-12 shadow-lg shadow-primary/20"
                        disabled={isPracticing || isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                        Submit Final Decision
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit Final?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This runs the simulation with your current decisions and records it as your final grade. This cannot be undone and will lock Module 1.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={runSubmit}>Yes, Submit Final</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-0">
                    <img
                      src={images.module1.submitted.src}
                      alt={images.module1.submitted.alt}
                      className="w-full rounded-t-md"
                      style={{ height: "180px", objectFit: "cover" }}
                      loading="lazy"
                    onError={(e) => { const t = e.currentTarget; const def = MODULE_IMAGES.module1.submitted.src; if (t.src !== def) t.src = def; }}
                  />
                    <p className="text-xs italic text-muted-foreground px-4 pt-2 pb-1">{images.module1.submitted.caption}</p>
                    <div className="p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-semibold">Module 1 Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          Final score: {moduleData?.finalSubmission?.score}/{moduleData?.finalSubmission?.maxScore ?? 52} pts • Submitted {moduleData?.finalSubmission?.submittedAt ? format(new Date(moduleData.finalSubmission.submittedAt), "MMM d, yyyy 'at' h:mm a") : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {moduleData && moduleData.recentRuns.length > 0 && (
        <div className="mt-8 space-y-4">
          <MultiRunRadarChart runs={moduleData.recentRuns} moduleKey="M1" maxScore={52} />
          <KpiTrendChart runs={moduleData.recentRuns} moduleKey="M1" maxScore={52} />
          <RunHistoryPanel runs={moduleData.recentRuns} moduleKey="M1" maxScore={52} />
        </div>
      )}

      <GuideSheet
        open={guideOpen}
        onOpenChange={setGuideOpen}
        content={module1Guide}
        title="Module 1: Student Guide"
      />
    </div>
  );
}
