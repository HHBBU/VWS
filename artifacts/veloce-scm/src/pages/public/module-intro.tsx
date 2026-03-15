import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Target, FileText, ChevronRight } from "lucide-react";

const moduleData: Record<string, {
  title: string;
  role: string;
  description: string;
  context: string;
  keyDecisions: string;
  color: string;
  bg: string;
}> = {
  M1: {
    title: "Global Sourcing & Procurement",
    role: "Global Sourcing Manager",
    description:
      "You are the Global Sourcing Manager preparing Veloce Wear's next production cycle. You will analyze historical demand data, forecast future demand, translate forecasts into material requirements (kg), evaluate 8 global suppliers using a formal MCDA method, select transportation modes, and balance cost vs lead time vs reliability vs sustainability and quality.",
    context:
      "Your sourcing decisions set the foundation for the entire supply chain. The suppliers you choose, the reliability you achieve, and the lead times you accept all carry forward into Module 2.",
    keyDecisions:
      "Demand forecast · Supplier selection and allocation · Transport mode · Assurance package · Batching strategy · Optional market intelligence report",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  M2: {
    title: "Operations Planning & MRP",
    role: "Operations Planning Manager",
    description:
      "You are the Operations Planning Manager at Veloce Wear's Porto manufacturing campus. You will build an 8-week S&OP production plan, choose a capacity mode, select lot-sizing and safety stock policies, and manage the tension between service level, cost, and markdown risk.",
    context:
      "Your Module 1 supplier reliability determines how often material disruptions interrupt production. Poor M1 decisions make M2 harder. The Visual S&OP Dashboard helps you check your plan against capacity limits in real time.",
    keyDecisions:
      "Weekly production targets (8 weeks × 2 SKUs) · Capacity mode · Lot sizing · Priority rule · Safety stock policy",
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
  },
  M3: {
    title: "Distribution Network & Inventory",
    role: "Distribution Strategy Lead",
    description:
      "You are the Distribution Strategy Lead designing how finished goods flow from Porto to 420 stores across EU, North America, and APAC. You will choose a network structure (centralized, hybrid, or decentralized), set inventory replenishment policies (ROP and Q), and select a shipping service mode.",
    context:
      "Your Module 2 service level affects lead time variability in M3 — poor production performance creates wider delivery windows. The Interactive ROP/Q Visualizer helps you calibrate inventory policies before running the stochastic simulation.",
    keyDecisions:
      "Network strategy · Reorder point (ROP) · Order quantity (Q) · Service mode · Forecast method",
    color: "text-violet-600",
    bg: "bg-violet-500/10",
  },
};

export default function ModuleIntro() {
  const [, params] = useRoute("/module-intro/:key");
  const key = params?.key as string;
  const data = moduleData[key];

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold">Module not found</h2>
        <Link href="/intro"><Button className="mt-4">Back to Overview</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/intro">
        <Button variant="ghost" className="mb-8 pl-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Overview
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${data.bg} flex items-center justify-center font-display font-bold text-2xl ${data.color}`}>
            {key}
          </div>
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wider ${data.color}`}>{data.role}</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{data.title}</h1>
          </div>
        </div>

        {/* Executive Brief */}
        <div className="glass-card p-7 rounded-2xl">
          <h2 className="flex items-center gap-2 text-base font-bold mb-3 text-muted-foreground uppercase tracking-wider">
            <FileText className="w-4 h-4" /> Scenario
          </h2>
          <p className="text-base text-foreground leading-relaxed">{data.description}</p>
        </div>

        {/* Cross-module context */}
        <div className={`rounded-2xl border-l-4 ${key === "M1" ? "border-blue-400" : key === "M2" ? "border-indigo-400" : "border-violet-400"} bg-muted/40 px-6 py-5`}>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.context}</p>
        </div>

        {/* Key Decisions */}
        <div className="glass-card p-7 rounded-2xl">
          <h2 className="flex items-center gap-2 text-base font-bold mb-4 text-muted-foreground uppercase tracking-wider">
            <Target className="w-4 h-4" /> Key Decisions
          </h2>
          <ul className="space-y-2">
            {data.keyDecisions.split(" · ").map((decision, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-muted-foreground">
                <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${data.color}`} />
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 pt-2">
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
      </motion.div>
    </div>
  );
}
