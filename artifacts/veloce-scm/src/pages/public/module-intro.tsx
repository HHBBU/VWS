import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Target, AlertTriangle, FileText } from "lucide-react";

const moduleData: Record<string, any> = {
  M1: {
    title: "Global Sourcing & Procurement",
    brief: "Veloce Wear currently relies on a single supplier in Shenzhen, China. Recent geopolitical tensions and port congestions have caused severe stockouts. The Board wants you to diversify the supplier base.",
    objectives: [
      "Select a primary and secondary supplier from a pool of 5 candidates.",
      "Allocate order volume percentages.",
      "Negotiate contract terms (shipping terms, payment terms)."
    ],
    risks: [
      "Choosing suppliers based solely on unit cost often leads to high stockout costs due to long, variable lead times.",
      "High tariffs on specific regions."
    ]
  },
  M2: {
    title: "Operations Planning & MRP",
    brief: "With the sourcing network established, you must now manage the production planning for Veloce Wear's flagship 'AeroFit' line. Demand is highly seasonal.",
    objectives: [
      "Set production lot sizes.",
      "Determine safety stock levels for raw materials.",
      "Schedule production shifts to manage capacity."
    ],
    risks: [
      "Overproduction leads to massive holding costs and potential obsolescence.",
      "Underproduction results in lost sales and brand damage during peak season."
    ]
  },
  M3: {
    title: "Distribution Network & Inventory",
    brief: "Finished goods need to reach customers fast. Amazon has set the standard at 2-day shipping, and Veloce Wear must compete while keeping fulfillment costs in check.",
    objectives: [
      "Select warehouse locations (Centralized vs. Decentralized).",
      "Set inventory reorder points (ROP) and order quantities (Q) at each node.",
      "Select default transportation modes (Air vs. LTL vs. FTL)."
    ],
    risks: [
      "Decentralized networks reduce shipping time but drastically increase total safety stock requirements (the square root law).",
      "Air freight destroys profit margins on heavy items."
    ]
  }
};

export default function ModuleIntro() {
  const [, params] = useRoute("/module-intro/:key");
  const key = params?.key as string;
  const data = moduleData[key];

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold">Module not found</h2>
        <Link href="/intro"><Button className="mt-4">Back to Intro</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/intro">
        <Button variant="ghost" className="mb-8 pl-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Overview
        </Button>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-display font-bold text-2xl">
            {key}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {data.title}
          </h1>
        </div>

        <div className="glass-card p-8 rounded-3xl mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
            <FileText className="text-primary w-6 h-6" /> Executive Brief
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {data.brief}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-6">
              <Target className="text-indigo-500 w-6 h-6" /> Learning Objectives
            </h2>
            <ul className="space-y-4">
              {data.objectives.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">{i+1}</div>
                  <span className="leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-6">
              <AlertTriangle className="text-amber-500 w-6 h-6" /> Key Risks
            </h2>
            <ul className="space-y-4">
              {data.risks.map((risk: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span className="leading-relaxed">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 rounded-xl h-12 text-base">
              Go to Dashboard to Start
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
