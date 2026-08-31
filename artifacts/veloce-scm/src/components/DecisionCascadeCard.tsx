import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleCascade {
  moduleKey: "M1" | "M2" | "M3";
  score: number;
  kpis: Record<string, unknown>;
}

interface CascadeData {
  allSubmitted: true;
  modules: [ModuleCascade, ModuleCascade, ModuleCascade];
}

interface DecisionCascadeCardProps {
  data: CascadeData;
  maxScore?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const n = (v: unknown): number => (typeof v === "number" && isFinite(v) ? v : 0);
const euro = (v: number) => `€${Math.round(v).toLocaleString()}`;
const pct = (v: number, decimals = 1) => `${v.toFixed(decimals)}%`;

type TrafficLight = "green" | "amber" | "red";

const LIGHT_STYLES: Record<TrafficLight, { line: string; pill: string; label: string }> = {
  green: { line: "#22c55e", pill: "bg-green-50 border-green-200 text-green-700", label: "Strong link" },
  amber: { line: "#f59e0b", pill: "bg-amber-50 border-amber-200 text-amber-700", label: "Some risk" },
  red:   { line: "#ef4444", pill: "bg-red-50 border-red-200 text-red-700",   label: "Weak link" },
};

// ─── Arrow connector ──────────────────────────────────────────────────────────

function CascadeArrow({ color, tooltip }: { color: TrafficLight; tooltip: string }) {
  const s = LIGHT_STYLES[color];
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center justify-center flex-shrink-0 cursor-help select-none">
            {/* Desktop horizontal arrow */}
            <div className="hidden sm:flex flex-col items-center gap-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.pill}`}>
                {s.label}
              </span>
              <svg width="72" height="18" viewBox="0 0 72 18" fill="none" aria-hidden="true">
                <line x1="2" y1="9" x2="60" y2="9" stroke={s.line} strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="60,4 72,9 60,14" fill={s.line} />
              </svg>
            </div>
            {/* Mobile vertical arrow */}
            <div className="flex sm:hidden flex-col items-center gap-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>
                {s.label}
              </span>
              <svg width="18" height="36" viewBox="0 0 18 36" fill="none" aria-hidden="true">
                <line x1="9" y1="2" x2="9" y2="28" stroke={s.line} strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="4,26 9,36 14,26" fill={s.line} />
              </svg>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-center text-xs leading-relaxed">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Stage card ───────────────────────────────────────────────────────────────

interface StageKpi { label: string; value: string; color?: string }

interface StageCardProps {
  title: string;
  subtitle: string;
  icon: string;
  score: number;
  maxScore: number;
  kpis: StageKpi[];
  accentClass: string;
}

function StageCard({ title, subtitle, icon, score, maxScore, kpis, accentClass }: StageCardProps) {
  return (
    <div className={`flex-1 min-w-0 rounded-xl border p-4 space-y-3 ${accentClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
          </div>
          <p className="text-sm font-semibold leading-tight">{subtitle}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs font-bold">
          {score}/{maxScore}
        </Badge>
      </div>
      <div className="space-y-1.5">
        {kpis.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground truncate">{label}</span>
            <span className={`text-[11px] font-semibold whitespace-nowrap ${color ?? "text-foreground"}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary sentence generator ───────────────────────────────────────────────

function buildSummary(m1k: Record<string, unknown>, m2k: Record<string, unknown>, m3k: Record<string, unknown>): string {
  const reliability = n(m1k.avgReliabilityPct);
  const m1Cost = n(m1k.totalProcurementCost);
  const fillRate = n(m3k.fillRate);
  const margin = n(m3k.profitMarginPct);
  const sl = n(m2k.serviceLevel);
  const slPct = sl > 1 ? sl : sl * 100;

  // Strategy label
  let strategy: string;
  if (reliability >= 94 && m1Cost >= 85000) {
    strategy = "quality-focused nearshore strategy";
  } else if (reliability < 89 && m1Cost < 80000) {
    strategy = "cost-optimized offshore strategy";
  } else if (reliability >= 92) {
    strategy = "reliability-first sourcing strategy";
  } else {
    strategy = "balanced hybrid strategy";
  }

  // M1 one-liner
  const m1Note = reliability >= 94
    ? `high supplier reliability (${reliability.toFixed(0)}%) kept your supply chain stable`
    : reliability >= 89
    ? `moderate supplier reliability (${reliability.toFixed(0)}%) introduced some buffer requirements`
    : `lower supplier reliability (${reliability.toFixed(0)}%) created disruption pressure downstream`;

  // M3 outcome
  let outcome: string;
  if (fillRate >= 94 && margin >= 15) {
    outcome = "delivering strong service levels and healthy profit margins across the full chain.";
  } else if (fillRate >= 94 && margin >= 8) {
    outcome = `achieving high fill rates (${fillRate.toFixed(0)}%) but with tight profit margins (${margin.toFixed(1)}%).`;
  } else if (fillRate >= 94) {
    outcome = `maintaining strong fill rates (${fillRate.toFixed(0)}%) despite margin pressure (${margin.toFixed(1)}%).`;
  } else if (fillRate >= 88) {
    outcome = `resulting in moderate distribution performance — ${fillRate.toFixed(0)}% fill rate with ${margin.toFixed(1)}% margins.`;
  } else {
    outcome = `creating stockout pressure in distribution (${fillRate.toFixed(0)}% fill rate) that compressed profitability.`;
  }

  // M2 bridge
  const m2bridge = slPct >= 95
    ? "smooth production"
    : slPct >= 90
    ? "adequate production throughput"
    : "production gaps";

  return `You chose a ${strategy} — ${m1Note}. ${m2bridge.charAt(0).toUpperCase() + m2bridge.slice(1)} in operations (${slPct.toFixed(0)}% service level) flowed into ${outcome}`;
}

// ─── Arrow logic ──────────────────────────────────────────────────────────────

function m1ToM2Color(m1k: Record<string, unknown>): TrafficLight {
  const rel = n(m1k.avgReliabilityPct);
  if (rel >= 94) return "green";
  if (rel >= 89) return "amber";
  return "red";
}

function m1ToM2Tooltip(m1k: Record<string, unknown>): string {
  const rel = n(m1k.avgReliabilityPct);
  const lt = n(m1k.avgLeadTimeDays);
  if (rel >= 94) {
    return `Your supplier reliability (${rel.toFixed(0)}%) was strong — low disruption risk kept MRP buffer needs minimal in Module 2.`;
  }
  if (rel >= 89) {
    return `Your supplier reliability (${rel.toFixed(0)}%) was moderate — some disruption risk required extra safety stock in Module 2 (lead time: ${lt.toFixed(1)} days).`;
  }
  return `Your supplier reliability (${rel.toFixed(0)}%) was low — frequent supply gaps raised MRP buffer requirements and production costs in Module 2 (lead time: ${lt.toFixed(1)} days).`;
}

function m2ToM3Color(m2k: Record<string, unknown>): TrafficLight {
  const sl = n(m2k.serviceLevel);
  const slPct = sl > 1 ? sl : sl * 100;
  if (slPct >= 95) return "green";
  if (slPct >= 90) return "amber";
  return "red";
}

function m2ToM3Tooltip(m2k: Record<string, unknown>, m3k: Record<string, unknown>): string {
  const sl = n(m2k.serviceLevel);
  const slPct = sl > 1 ? sl : sl * 100;
  const fillRate = n(m3k.fillRate);
  if (slPct >= 95) {
    return `Your production service level (${slPct.toFixed(0)}%) was strong — consistent output supported a ${fillRate.toFixed(0)}% fill rate in distribution.`;
  }
  if (slPct >= 90) {
    return `Your production service level (${slPct.toFixed(0)}%) left some gaps — these propagated into inventory shortfalls in Module 3 (fill rate: ${fillRate.toFixed(0)}%).`;
  }
  return `Your production service level (${slPct.toFixed(0)}%) was weak — supply gaps amplified into significant stockouts in distribution (fill rate: ${fillRate.toFixed(0)}%).`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DecisionCascadeCard({ data, maxScore = 52 }: DecisionCascadeCardProps) {
  const m1 = data.modules[0];
  const m2 = data.modules[1];
  const m3 = data.modules[2];
  const m1k = m1.kpis;
  const m2k = m2.kpis;
  const m3k = m3.kpis;

  const sl = n(m2k.serviceLevel);
  const slPct = sl > 1 ? sl : sl * 100;
  const util = n(m2k.capacityUtilization);
  const utilPct = util > 1 ? util : util * 100;

  const m1Kpis: StageKpi[] = [
    {
      label: "Supplier Reliability",
      value: pct(n(m1k.avgReliabilityPct)),
      color: n(m1k.avgReliabilityPct) >= 94 ? "text-emerald-600" : n(m1k.avgReliabilityPct) >= 89 ? "text-amber-600" : "text-red-600",
    },
    {
      label: "Avg Lead Time",
      value: `${n(m1k.avgLeadTimeDays).toFixed(1)} days`,
    },
    {
      label: "Procurement Cost",
      value: euro(n(m1k.totalProcurementCost)),
    },
  ];

  const m2Kpis: StageKpi[] = [
    {
      label: "Service Level",
      value: pct(slPct),
      color: slPct >= 95 ? "text-emerald-600" : slPct >= 90 ? "text-amber-600" : "text-red-600",
    },
    {
      label: "Capacity Utilisation",
      value: pct(utilPct),
      color: utilPct >= 80 && utilPct <= 95 ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Production Cost",
      value: euro(n(m2k.totalCost)),
    },
  ];

  const m3Kpis: StageKpi[] = [
    {
      label: "Fill Rate",
      value: pct(n(m3k.fillRate)),
      color: n(m3k.fillRate) >= 94 ? "text-emerald-600" : n(m3k.fillRate) >= 88 ? "text-amber-600" : "text-red-600",
    },
    {
      label: "Profit Margin",
      value: pct(n(m3k.profitMarginPct)),
      color: n(m3k.profitMarginPct) >= 15 ? "text-emerald-600" : n(m3k.profitMarginPct) >= 8 ? "text-amber-600" : "text-red-600",
    },
    {
      label: "Distribution Cost",
      value: euro(n(m3k.totalCost)),
    },
  ];

  const arrow1Color = m1ToM2Color(m1k);
  const arrow1Tip = m1ToM2Tooltip(m1k);
  const arrow2Color = m2ToM3Color(m2k);
  const arrow2Tip = m2ToM3Tooltip(m2k, m3k);

  const summary = buildSummary(m1k, m2k, m3k);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/3 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="w-4 h-4 text-primary" />
          Your Supply Chain Story
        </CardTitle>
        <CardDescription>
          How your decisions in each module connected and cascaded through the chain — hover the arrows to see the dependency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Flow diagram */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <StageCard
            title="M1 · Sourcing"
            subtitle="Global Procurement"
            icon="🌐"
            score={m1.score}
            maxScore={maxScore}
            kpis={m1Kpis}
            accentClass="border-indigo-100 bg-indigo-50/50"
          />

          <CascadeArrow color={arrow1Color} tooltip={arrow1Tip} />

          <StageCard
            title="M2 · Operations"
            subtitle="Production Planning"
            icon="🏭"
            score={m2.score}
            maxScore={maxScore}
            kpis={m2Kpis}
            accentClass="border-blue-100 bg-blue-50/50"
          />

          <CascadeArrow color={arrow2Color} tooltip={arrow2Tip} />

          <StageCard
            title="M3 · Distribution"
            subtitle="Inventory & Logistics"
            icon="🚚"
            score={m3.score}
            maxScore={maxScore}
            kpis={m3Kpis}
            accentClass="border-emerald-100 bg-emerald-50/50"
          />
        </div>

        {/* Summary sentence */}
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Chain summary: </span>
          {summary}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
          {(["green", "amber", "red"] as TrafficLight[]).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
                <line x1="1" y1="5" x2="14" y2="5" stroke={LIGHT_STYLES[c].line} strokeWidth="2" strokeLinecap="round" />
                <polygon points="14,2 20,5 14,8" fill={LIGHT_STYLES[c].line} />
              </svg>
              {c === "green" ? "Strong link (low risk)" : c === "amber" ? "Moderate risk" : "Weak link (high risk)"}
            </span>
          ))}
          <span className="text-muted-foreground/60">· Hover arrows for details</span>
        </div>
      </CardContent>
    </Card>
  );
}
