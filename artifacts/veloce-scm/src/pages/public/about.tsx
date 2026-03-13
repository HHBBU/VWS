import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">About the Simulation</h1>
        <p className="mt-4 text-xl text-muted-foreground">SCM 4330: Supply Chain Strategy</p>
      </motion.div>

      <div className="grid gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          <div className="glass-card p-8 md:p-10 rounded-3xl mb-8">
            <h2 className="flex items-center gap-3 mt-0">
              <GraduationCap className="w-8 h-8 text-primary" />
              Course Objective
            </h2>
            <p>
              The Veloce Wear simulation is designed to bridge the gap between theoretical supply chain concepts and real-world application. Through three intensive modules, students experience the cascading effects of their decisions across the entire supply chain network.
            </p>
            <p>
              Unlike traditional case studies, this simulation provides dynamic feedback. A decision to reduce inventory holding costs in Module 2 may unexpectedly impact your ability to fulfill expedited orders in Module 3.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-3xl">
              <h3 className="flex items-center gap-3 mt-0">
                <BookOpen className="w-6 h-6 text-indigo-500" />
                Grading & Evaluation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Each module is worth 55 points, totaling 165 points for the simulation component of the course.</p>
              <ul className="text-sm space-y-2">
                <li><strong>M1: Global Sourcing:</strong> 55 pts</li>
                <li><strong>M2: Operations Planning:</strong> 55 pts</li>
                <li><strong>M3: Distribution:</strong> 55 pts</li>
              </ul>
              <p className="text-sm mt-4">
                Scores are determined by an algorithm that evaluates your Key Performance Indicators (KPIs) against optimal baseline scenarios.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl">
              <h3 className="flex items-center gap-3 mt-0">
                <Users className="w-6 h-6 text-blue-500" />
                Practice vs. Final
              </h3>
              <p className="text-sm text-muted-foreground mb-4">You have unlimited practice runs before submitting your final decision.</p>
              <p className="text-sm">
                We strongly encourage utilizing practice runs. The simulation parameters introduce minor random variations (demand spikes, supplier delays) in each run, teaching you to design robust, rather than just optimized, supply chains.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
