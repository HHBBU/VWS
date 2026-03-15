import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Factory, Truck, BarChart3, AlertTriangle, CheckCircle2, Lock } from "lucide-react";

export default function Intro() {
  return (
    <div className="container mx-auto px-4 py-12 lg:py-16 max-w-4xl space-y-8">

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Veloce Wear Supply Chain Simulation
          </h1>
          <p className="text-base font-semibold text-muted-foreground mb-4">How the Simulation Works — Read This First</p>
          <p className="text-base text-muted-foreground leading-relaxed mb-3">
            Welcome to <strong className="text-foreground">Veloce Wear</strong> — a fast-fashion apparel company competing on speed, quality, availability, and responsible sourcing. You are joining the supply chain leadership team. Your job is to make realistic, data-driven decisions across three modules — then learn from the results as uncertainty and trade-offs unfold.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            This is a <strong className="text-foreground">3-module simulation sequence</strong>. Each module builds on the one before it, just like a real end-to-end supply chain.
          </p>
        </div>
      </motion.div>

      {/* ── What You'll Complete ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-display font-bold mb-2">What You'll Complete</h2>
          <p className="text-sm text-muted-foreground mb-5">Total: <strong className="text-foreground">165 points</strong> across 3 modules</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-foreground w-[260px]">Module</th>
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Your Role</th>
                  <th className="text-right py-2 font-semibold text-foreground w-16">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  {
                    label: "Module 1 — Global Sourcing & Procurement",
                    role: "Forecast demand, select suppliers, design inbound supply strategy",
                    pts: 55,
                    icon: Factory,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    key: "M1",
                  },
                  {
                    label: "Module 2 — Operations Planning & MRP",
                    role: "Plan production, manage capacity, balance service vs cost vs markdown",
                    pts: 55,
                    icon: BarChart3,
                    color: "text-indigo-500",
                    bg: "bg-indigo-500/10",
                    key: "M2",
                  },
                  {
                    label: "Module 3 — Distribution Network & Inventory",
                    role: "Design distribution network, set inventory policies, manage fulfillment",
                    pts: 55,
                    icon: Truck,
                    color: "text-violet-500",
                    bg: "bg-violet-500/10",
                    key: "M3",
                  },
                ].map((mod) => (
                  <tr key={mod.key} className="group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${mod.bg} flex items-center justify-center shrink-0`}>
                          <mod.icon className={`w-4 h-4 ${mod.color}`} />
                        </div>
                        <span className="font-medium text-foreground">{mod.label}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{mod.role}</td>
                    <td className="py-3 text-right font-bold text-foreground">{mod.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {["M1", "M2", "M3"].map((k) => (
              <Link key={k} href={`/module-intro/${k}`}>
                <Button variant="outline" size="sm">
                  {k} Brief <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Account Rules ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-display font-bold mb-4">How to Access the Simulation</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Account rules:</strong> Register and log in using a <strong className="text-foreground">.edu email address</strong> (required). Your account is tied to your Student ID for grading integrity and reproducibility.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Module introductions:</strong> Each module has a Module Introduction page available before and after login. Read the intro before starting — it explains the scenario, decisions, and scoring.
          </p>
        </div>
      </motion.div>

      {/* ── Practice vs Final ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="glass-card p-8 rounded-3xl border-l-4 border-red-500">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Practice vs Final Submission
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Practice runs:</strong> Unlimited. Instant feedback (score + KPI dashboard). Use them to test strategies and improve. All runs are saved.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Final submission:</strong> One attempt only. Once you click Submit Final, the module locks permanently — no resubmissions. Your score appears on the dashboard and the next module unlocks.
          </p>
        </div>
      </motion.div>

      {/* ── Unlock Sequence ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-display font-bold mb-4">Module Unlock Sequence</h2>
          <p className="text-base text-muted-foreground mb-5">Modules unlock in order. You cannot skip ahead.</p>
          <div className="flex flex-col items-center gap-1 text-sm font-medium">
            {[
              { label: "Module 1 opens first", icon: CheckCircle2, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
              null,
              { label: "Module 2 unlocks", icon: CheckCircle2, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
              null,
              { label: "Module 3 unlocks", icon: CheckCircle2, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
              null,
              { label: "Course complete!", icon: CheckCircle2, color: "text-green-700 bg-green-50 dark:bg-green-900/20" },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="text-muted-foreground text-xs py-0.5">↓ submit final</div>
              ) : (
                <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Timing ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" /> Timing: Module Windows & Extensions
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Each module has an official start and end date (the "module window"). If the window is closed, you cannot run or submit. Extensions are available per-student — contact the instructor early with your Student ID.
          </p>
        </div>
      </motion.div>

      {/* ── What Strong Performance Looks Like ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-display font-bold mb-4">
            <TrendingUp className="w-5 h-5 inline-block mr-2 text-primary" />
            What Strong Performance Looks Like
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-4">
            This is not a "guess the trick" game. There is no single correct answer. Strong submissions show:
          </p>
          <ul className="space-y-2 text-base text-muted-foreground">
            {[
              { title: "Data-driven planning", detail: "use the provided data and analytics tools" },
              { title: "Trade-off reasoning", detail: "discuss cost vs service vs inventory vs risk vs sustainability" },
              { title: "Operational realism", detail: "account for lead times, capacity constraints, variability" },
              { title: "Clear written justification", detail: "explain your logic, reference KPIs, link to company mission" },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong className="text-foreground">{item.title}</strong> — {item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* ── What to Do Next ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-display font-bold mb-4">What to Do Next</h2>
          <ol className="space-y-2 text-base text-muted-foreground">
            {[
              <><strong className="text-foreground">Create your account</strong> using your .edu email</>,
              <>Go to your <strong className="text-foreground">Student Dashboard</strong> and open <strong className="text-foreground">Module 1</strong></>,
              <>Read the <strong className="text-foreground">Module 1 Introduction</strong>, run practice simulations, then submit final when ready</>,
              <>Repeat for Modules 2 and 3</>,
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 leading-relaxed">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                  {i + 1}
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted-foreground italic">
            Your goal is to think like a supply chain professional — not just play with numbers. Good luck!
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg" className="rounded-xl">Create Account</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-xl">Log In</Button>
            </Link>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
