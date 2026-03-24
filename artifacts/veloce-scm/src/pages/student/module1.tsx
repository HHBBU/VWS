import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetModuleDataQueryKey, getGetStudentDashboardQueryKey, useGetModuleData } from "@workspace/api-client-react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Plus, Trash2, Loader2, Trophy, TrendingUp, Package, Truck,
  History, CheckCircle, AlertTriangle, BarChart3, Globe, Leaf, Star, BookOpen,
} from "lucide-react";
import { GuideSheet } from "@/components/GuideSheet";
import { RunHistoryPanel } from "@/components/RunHistoryPanel";
import { module1Guide } from "@/guides/module1Guide";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as ReTooltip,
  Legend, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

// ─── Supplier Data ───────────────────────────────────────────────────────────

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
      <p className="text-muted-foreground">{d.country}</p>
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

// ─── Score Card ───────────────────────────────────────────────────────────────

function ResultsPanel({ result, onClose }: { result: SimResult; onClose: () => void }) {
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
              <div className="text-muted-foreground text-sm">/ 55 pts</div>
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
            { label: "Validity + Justification", score: result.scoreBreakdown.validityJustification, max: 8 },
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
          { label: "Total Cost", value: `€${result.kpis.totalProcurementCost.toLocaleString()}` },
          { label: "Lead Time", value: `${result.kpis.avgLeadTimeDays}d` },
          { label: "Reliability", value: `${result.kpis.avgReliabilityPct}%` },
          { label: "Sustainability", value: `${result.kpis.avgSustainability}/5` },
          { label: "Quality", value: `${result.kpis.avgQuality}/5` },
          { label: "CO₂", value: `${result.kpis.totalCo2}` },
          { label: "Forecast Error", value: `${result.kpis.forecastErrorPct}%` },
          { label: "Late Deliveries", value: `${result.kpis.lateDeliveries}/${result.kpis.totalDeliveries}` },
        ].map((k) => (
          <div key={k.label} className="bg-muted/40 rounded-xl p-3 text-center border border-border/50">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{k.label}</div>
            <div className="text-lg font-bold">{k.value}</div>
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
            <p className="font-bold">{result.kpis.cottonAllocatedKg.toLocaleString()} kg / {result.kpis.cottonRequiredKg.toLocaleString()} kg needed</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nylon</p>
            <p className="font-bold">{result.kpis.nylonAllocatedKg.toLocaleString()} kg / {result.kpis.nylonRequiredKg.toLocaleString()} kg needed</p>
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

      <Button variant="outline" onClick={onClose} className="w-full">
        ← Back to Decision Form
      </Button>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Module1Page() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moduleData, isLoading } = useGetModuleData("M1", {
    query: { queryKey: getGetModuleDataQueryKey("M1"), enabled: true }
  });

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
      toast({ title: "Practice Run Complete", description: `Run #${data.runNumber} scored ${data.score}/55 pts` });
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
      toast({ title: "Module 1 Submitted!", description: `Final score: ${data.score}/55 pts — Grade: ${data.letterGrade}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAllocation = () => {
    setAllocations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), supplierId: "", materialType: "cotton", kg: "", transportMode: "truck", assurancePackage: "standard", numBatches: "1" },
    ]);
  };

  const removeAllocation = (id: string) => {
    setAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAllocation = (id: string, field: keyof Allocation, value: string) => {
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
                <p className="text-2xl font-bold">{moduleData.finalSubmission.score}<span className="text-base font-normal text-muted-foreground">/55</span></p>
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
            <ResultsPanel result={lastResult} onClose={() => setShowResults(false)} />
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
                      <Scatter name="Nearshore (Portugal, Turkey)" data={VIZ_DATA.filter(d => d.region === "Nearshore")} fill="#10b981">
                        {VIZ_DATA.filter(d => d.region === "Nearshore").map((_, i) => <Cell key={i} fill="#10b981" />)}
                      </Scatter>
                      <Scatter name="Offshore (Vietnam, Mexico)" data={VIZ_DATA.filter(d => d.region === "Offshore")} fill="#8b5cf6">
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
                <CardDescription>Analyse the trend to forecast Year 31 demand for both SKUs</CardDescription>
              </CardHeader>
              <CardContent>
                {historicalData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SKU A Average</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{historicalData.avgA?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Trend: +{historicalData.trendA}/year</p>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SKU B Average</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{historicalData.avgB?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Trend: +{historicalData.trendB}/year</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2 text-muted-foreground font-medium">Year</th>
                            <th className="text-right p-2 text-blue-600 dark:text-blue-400 font-medium">SKU A (Trend Tee)</th>
                            <th className="text-right p-2 text-green-600 dark:text-green-400 font-medium">SKU B (Core Jogger)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(historicalData.dataPoints as any[]).map((d) => (
                            <tr key={d.month} className="border-b border-border/40 hover:bg-muted/30">
                              <td className="p-2 font-medium">Year {d.month}</td>
                              <td className="p-2 text-right tabular-nums">{d.skuA.toLocaleString()}</td>
                              <td className="p-2 text-right tabular-nums">{d.skuB.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
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
                                    {supplier.country} • Q:{supplier.quality} S:{supplier.sustainability} • {supplier.leadTime}d
                                  </p>
                                )}
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

                  {/* Supplier Quick Reference */}
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Supplier Quick Reference (click to expand)
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs border border-border rounded-lg">
                        <thead className="bg-muted/50">
                          <tr>
                            {["ID","Name","Region","Cotton €/kg","Nylon €/kg","Lead","Reliability","Quality","Sust."].map((h) => (
                              <th key={h} className="p-1.5 text-left font-medium text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {SUPPLIERS.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/20">
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
                    Explain your methodology (MCDA, transport/risk tradeoffs, sustainability alignment). Min 300 chars for 2 pts; 500+ for 3 pts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="font-semibold">Module 1 Submitted</p>
                      <p className="text-sm text-muted-foreground">
                        Final score: {moduleData?.finalSubmission?.score}/55 pts • Submitted {moduleData?.finalSubmission?.submittedAt ? format(new Date(moduleData.finalSubmission.submittedAt), "MMM d, yyyy 'at' h:mm a") : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {moduleData && moduleData.recentRuns.length > 0 && (
        <div className="mt-8">
          <RunHistoryPanel runs={moduleData.recentRuns} />
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
