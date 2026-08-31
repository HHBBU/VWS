import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Zap, AlertTriangle } from "lucide-react";
import { M2_DISRUPTIONS, M3_DISRUPTIONS, getPresetById, type DisruptionPreset } from "@/config/disruptionPresets";
const moduleData = {
  M1: {
    title: "Global Sourcing & Procurement",
    role: "Global Sourcing Manager",
    from: "VP Global Procurement",
    description:
      "You are the Global Sourcing Manager preparing Veloce Wear's next production cycle. You will analyze historical demand data, forecast future demand, translate forecasts into material requirements (kg), evaluate 8 global suppliers using a formal MCDA method, select transportation modes, and balance cost vs lead time vs reliability vs sustainability and quality.",
    context:
      "Your sourcing decisions set the foundation for the entire supply chain. The suppliers you choose, the reliability you achieve, and the lead times you accept all carry forward into Module 2.",
    keyDecisions:
      "Demand forecast · Supplier selection and allocation · Transport mode · Assurance package · Batching strategy · Optional market intelligence report",
    accentClass: "bg-blue-500",
    accentBg: "bg-blue-50 dark:bg-blue-950/20",
    accentText: "text-blue-700 dark:text-blue-300",
    accentBorder: "border-blue-200 dark:border-blue-800/60",
  },
  M2: {
    title: "Operations Planning & MRP",
    role: "Operations Planning Manager",
    from: "VP Manufacturing Operations",
    description:
      "You are the Operations Planning Manager at Veloce Wear's Porto manufacturing campus. You will build an 8-week S&OP production plan, choose a capacity mode, select lot-sizing and safety stock policies, and manage the tension between service level, cost, and markdown risk.",
    context:
      "Your Module 1 supplier reliability determines how often material disruptions interrupt production. Poor M1 decisions make M2 harder. The Visual S&OP Dashboard helps you check your plan against capacity limits in real time.",
    keyDecisions:
      "Weekly production targets (8 weeks × 2 SKUs) · Capacity mode · Lot sizing · Priority rule · Safety stock policy",
    accentClass: "bg-indigo-500",
    accentBg: "bg-indigo-50 dark:bg-indigo-950/20",
    accentText: "text-indigo-700 dark:text-indigo-300",
    accentBorder: "border-indigo-200 dark:border-indigo-800/60",
  },
  M3: {
    title: "Distribution Network & Inventory",
    role: "Distribution Strategy Lead",
    from: "VP Distribution & Logistics",
    description:
      "You are the Distribution Strategy Lead designing how finished goods flow from Porto to 420 stores across EU, North America, and APAC. You will choose a network structure (centralized, hybrid, or decentralized), set inventory replenishment policies (ROP and Q), and select a shipping service mode.",
    context:
      "Your Module 2 service level affects lead time variability in M3 — poor production performance creates wider delivery windows. The Interactive ROP/Q Visualizer helps you calibrate inventory policies before running the stochastic simulation.",
    keyDecisions:
      "Network strategy · Reorder point (ROP) · Order quantity (Q) · Service mode · Forecast method",
    accentClass: "bg-violet-500",
    accentBg: "bg-violet-50 dark:bg-violet-950/20",
    accentText: "text-violet-700 dark:text-violet-300",
    accentBorder: "border-violet-200 dark:border-violet-800/60",
  },
};

const MODULE_NUM: Record<string, string> = { M1: "1", M2: "2", M3: "3" };

function DisruptionCard({ preset }: { preset: DisruptionPreset }) {
  const isCritical = preset.severity === "critical";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 px-6 py-5 ${
        isCritical
          ? "border-red-400/60 bg-red-50/80 dark:bg-red-950/20"
          : "border-amber-400/60 bg-amber-50/80 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg p-2 shrink-0 ${isCritical ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
          {isCritical
            ? <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            : <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              isCritical ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}>
              {isCritical ? "⚠ Critical Alert" : "Market Update"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <p className={`font-semibold text-sm leading-snug mb-1.5 ${isCritical ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
            {preset.headline}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{preset.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function MemoMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-x-3 text-sm leading-6">
      <span className="font-semibold uppercase tracking-widest text-[10px] pt-[3px] text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export default function ModuleIntro() {
  const [, params] = useRoute("/module-intro/:key");
  const key = params?.key as string;
  const [disruption, setDisruption] = useState<DisruptionPreset | null>(null);

  const data = moduleData[key as keyof typeof moduleData];

  useEffect(() => {
    setDisruption(null);
    if (key !== "M2" && key !== "M3") return;
    fetch("/api/student/disruption-config")
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (!cfg) return;
        const presets = key === "M2" ? M2_DISRUPTIONS : M3_DISRUPTIONS;
        const activeId: string = cfg[key] ?? "none";
        if (activeId === "none") return;
        const preset = getPresetById(presets, activeId);
        if (preset) setDisruption(preset);
      })
      .catch(() => {});
  }, [key]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold">Module not found</h2>
        <Link href="/intro"><Button className="mt-4">Back to Overview</Button></Link>
      </div>
    );
  }

  const memoDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const decisions = data.keyDecisions.split(" · ");

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link href="/intro">
        <Button variant="ghost" className="mb-6 pl-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Overview
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {/* Disruption briefing — shown for M2/M3 when active */}
        {disruption && <DisruptionCard preset={disruption} />}

        {/* ── Memo document ── */}
        <div className="rounded-2xl shadow-lg border border-border overflow-hidden bg-white dark:bg-card">

          {/* Top accent bar */}
          <div className={`h-1.5 w-full ${data.accentClass}`} />

          {/* Letterhead */}
          <div className="px-8 pt-8 pb-5 border-b border-border flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-display font-black text-xl tracking-tight text-foreground">
                  Veloce<span className={data.accentText}>Wear</span>
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">SCM Simulation</span>
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wider">Porto · Milan · New York · Singapore</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Internal Memorandum</p>
              <p className={`text-xs font-semibold px-2 py-0.5 rounded-full ${data.accentBg} ${data.accentText}`}>
                Module {MODULE_NUM[key]}
              </p>
            </div>
          </div>

          {/* Metadata rows */}
          <div className={`px-8 py-5 border-b border-border space-y-1 ${data.accentBg}`}>
            <MemoMetaRow label="To" value={data.role} />
            <MemoMetaRow label="From" value={data.from} />
            <MemoMetaRow label="Date" value={memoDate} />
            <MemoMetaRow label="Re" value={data.title} />
            <MemoMetaRow label="Ref" value={`VW-SCM-4330 / ${key}`} />
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-8 text-sm leading-relaxed text-foreground">

            {/* Background */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-1 border-b border-border">
                Background
              </h3>
              <p className="text-foreground/90">{data.description}</p>
            </section>

            {/* Strategic context */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-1 border-b border-border">
                Strategic Context
              </h3>
              <div className={`rounded-xl border-l-4 ${data.accentBorder} pl-4 py-1 ${data.accentBg}`}>
                <p className={`${data.accentText} text-sm leading-relaxed`}>{data.context}</p>
              </div>
            </section>

            {/* Assignments */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-1 border-b border-border">
                Your Assignments
              </h3>
              <p className="text-muted-foreground mb-3 text-xs">
                Before submitting your final run, you are required to address each of the following decision areas:
              </p>
              <ol className="space-y-2 pl-1">
                {decisions.map((d, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className={`text-[10px] font-bold font-mono shrink-0 w-5 ${data.accentText}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-foreground/90">{d}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Signature block */}
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                This assignment is issued under the authority of the Veloce Wear Executive Operations Committee.
                All simulation decisions will be recorded and assessed per the SCM 4330 course rubric.
                Questions should be directed to your module instructor.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className={`px-8 py-6 border-t border-border ${data.accentBg} flex flex-wrap gap-3`}>
            <Link href="/dashboard">
              <Button size="lg" className="rounded-xl px-8">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-xl px-8">
                Log In to Start
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
