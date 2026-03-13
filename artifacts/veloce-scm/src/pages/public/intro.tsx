import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Factory, Truck } from "lucide-react";

export default function Intro() {
  return (
    <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-12 items-center mb-20"
      >
        <div className="flex-1">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Company Profile
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
            Welcome to <span className="text-primary">Veloce Wear</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Veloce Wear is a mid-sized, rapidly growing athletic apparel company based in Chicago, IL. Founded five years ago, the company has seen explosive growth due to its innovative moisture-wicking fabrics and aggressive social media marketing.
          </p>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            However, this rapid growth has strained the company's ad-hoc supply chain. You have been brought in as the new Director of Supply Chain to professionalize operations, reduce costs, and improve service levels.
          </p>
        </div>
        <div className="flex-1 w-full relative">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-border">
            {/* abstract supply chain image */}
            <img 
              src={`${import.meta.env.BASE_URL}images/supply-chain.png`} 
              alt="Supply Chain Network" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Annual Revenue</p>
                <p className="text-2xl font-bold">$142.5M</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
        <h2 className="text-3xl font-display font-bold text-center mb-10">Your Mission Modules</h2>
        
        {[
          {
            key: "M1",
            title: "Global Sourcing & Procurement",
            desc: "Evaluate suppliers across Asia, South America, and domestic markets. Balance cost, lead times, and quality.",
            icon: Factory,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
          },
          {
            key: "M2",
            title: "Operations Planning & MRP",
            desc: "Translate demand forecasts into production schedules. Manage factory capacity and raw material inventory.",
            icon: BarChart3, // Using standard icon imported above if BarChart3 was imported, let's use TrendingUp
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
          },
          {
            key: "M3",
            title: "Distribution Network & Inventory",
            desc: "Design the fulfillment network. Choose warehouse locations and manage safety stock to meet customer SLAs.",
            icon: Truck,
            color: "text-violet-500",
            bg: "bg-violet-500/10"
          }
        ].map((mod, i) => (
          <motion.div 
            key={mod.key}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-center md:items-start group hover:border-primary/50 transition-colors"
          >
            <div className={`w-16 h-16 rounded-2xl ${mod.bg} flex items-center justify-center shrink-0`}>
              <mod.icon className={`w-8 h-8 ${mod.color}`} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">{mod.key}: {mod.title}</h3>
              <p className="text-muted-foreground">{mod.desc}</p>
            </div>
            <div className="shrink-0 mt-4 md:mt-0">
              <Link href={`/module-intro/${mod.key}`}>
                <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  Read Brief <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
