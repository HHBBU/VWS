import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Globe2, PackageSearch } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract hero background" 
            className="w-full h-full object-cover opacity-80 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            SCM 4330 Supply Chain Applications
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold text-foreground max-w-4xl mx-auto leading-tight"
          >
            Master Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Supply Chains</span> in Real-Time
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Take control of Veloce Wear, a dynamic athletic apparel company. Make critical sourcing, production, and distribution decisions in a complex global market.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40 rounded-xl">
                Student Registration <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/intro">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-background/50 backdrop-blur-md rounded-xl">
                Learn About Veloce Wear
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Three Core Modules</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
              The simulation is divided into three sequential modules, each focusing on a critical aspect of modern supply chain management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Globe2,
                title: "Global Sourcing",
                desc: "Navigate tariffs, lead times, and supplier reliability to build a resilient procurement network.",
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              {
                icon: BarChart3,
                title: "Operations & MRP",
                desc: "Balance production capacity, inventory holding costs, and dynamic customer demand.",
                color: "text-indigo-500",
                bg: "bg-indigo-500/10"
              },
              {
                icon: PackageSearch,
                title: "Distribution Network",
                desc: "Design the optimal warehouse footprint and transportation routes for last-mile delivery.",
                color: "text-violet-500",
                bg: "bg-violet-500/10"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-8 rounded-2xl border-border/50 text-center sm:text-left flex flex-col items-center sm:items-start"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
