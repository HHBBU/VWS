import { useGetStudentDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, PlayCircle, CheckCircle2, AlertCircle, Award, Star, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

export default function StudentDashboard() {
  const { data, isLoading, error } = useGetStudentDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Locked": return { color: "bg-muted text-muted-foreground", icon: Lock, variant: "secondary" as const };
      case "Not started": return { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: PlayCircle, variant: "outline" as const };
      case "In progress": return { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Trophy, variant: "secondary" as const };
      case "Submitted": return { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2, variant: "default" as const };
      default: return { color: "bg-muted", icon: AlertCircle, variant: "outline" as const };
    }
  };

  const progressPercentage = (data.totalScore / data.maxTotal) * 100;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Welcome, {data.userName.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-2 text-lg">Track your simulation progress and performance.</p>
        </div>
        
        <Card className="bg-primary/5 border-primary/20 shrink-0 w-full md:w-auto min-w-[280px]">
          <CardContent className="p-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Score</span>
              <span className="text-3xl font-display font-bold text-primary">{data.totalScore} <span className="text-lg text-muted-foreground">/ {data.maxTotal}</span></span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-primary/10" />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold">Simulation Modules</h2>

          {/* How-this-works banner */}
          <div className="rounded-xl border border-border bg-muted/40 px-5 py-3.5 text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How this works:</strong>{" "}
            Run unlimited practice simulations to learn and improve.
            Submit one final per module (locks permanently).
            Modules unlock in order: M1 → M2 → M3.
            Total points: <strong className="text-foreground">165</strong>.
          </div>

          <div className="grid gap-6">
            {data.modules.map((mod, i) => {
              const statusCfg = getStatusConfig(mod.status);
              const StatusIcon = statusCfg.icon;

              const windowEnd = mod.windowEnd ? new Date(mod.windowEnd) : null;
              const windowStart = mod.windowStart ? new Date(mod.windowStart) : null;
              const now = new Date();
              const daysLeft = windowEnd ? differenceInDays(windowEnd, now) : null;
              const isClosingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
              const notYetOpen = windowStart ? isFuture(windowStart) : false;
              const windowPastEnd = windowEnd ? isPast(windowEnd) : false;
              const windowClosed = mod.window === "Closed" && mod.status !== "Submitted" && windowPastEnd && !notYetOpen;

              const getDeadlineDisplay = () => {
                if (mod.status === "Submitted") return null;
                if (!mod.windowEnabled) return null;
                if (notYetOpen && windowStart) {
                  return (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      Opens {format(windowStart, "MMM d, yyyy")}
                    </span>
                  );
                }
                if (windowPastEnd) {
                  return null;
                }
                if (windowEnd) {
                  return (
                    <span className={`text-sm flex items-center gap-1.5 mt-1 ${isClosingSoon ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                      <Clock className="w-3.5 h-3.5" />
                      Closes {format(windowEnd, "MMM d, yyyy")}
                    </span>
                  );
                }
                return null;
              };

              return (
                <motion.div
                  key={mod.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`overflow-hidden transition-all duration-300 ${mod.status === 'Locked' ? 'opacity-75 bg-muted/30' : 'hover:shadow-lg border-primary/10'}`}>
                    <div className="flex flex-col sm:flex-row">
                      <div className="p-6 flex-1">
                        <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                          <Badge variant={statusCfg.variant} className={`font-semibold ${statusCfg.variant === 'outline' || statusCfg.variant === 'secondary' ? statusCfg.color : ''}`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {mod.status}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {windowClosed && (
                              <Badge variant="destructive">Window Closed</Badge>
                            )}
                            {isClosingSoon && !windowClosed && mod.status !== "Submitted" && daysLeft !== null && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {daysLeft === 0 ? "Closes today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{mod.key}: {mod.title}</h3>
                        {getDeadlineDisplay()}
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
                          {mod.score !== null && mod.score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">Score: {mod.score} / {mod.maxScore}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>Max Score: {mod.maxScore}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span>Practice Runs: <strong className="text-foreground">{mod.practiceRunCount}</strong></span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-6 flex sm:flex-col justify-end sm:justify-center items-center gap-4 sm:border-l border-border/50 sm:w-48">
                        <Link href={`/module/${mod.key}`}>
                          <Button 
                            className="w-full shadow-md" 
                            disabled={windowClosed || (!mod.isUnlocked && mod.status !== 'Submitted')}
                            variant={mod.status === 'Submitted' ? 'outline' : 'default'}
                          >
                            {mod.status === 'Submitted' ? 'View Results' : 'Enter Module'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Status legend */}
          <div className="text-xs text-muted-foreground leading-relaxed pt-1">
            <strong className="text-foreground">Status guide: </strong>
            <strong>Locked</strong> = prerequisite not submitted or module window closed ·{" "}
            <strong>Not started</strong> = no runs yet ·{" "}
            <strong>In progress</strong> = practice runs exist ·{" "}
            <strong>Submitted</strong> = final submitted (read-only)
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold">Achievements</h2>
          <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="text-indigo-500" /> Unlocked Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center gap-4 p-3 rounded-lg border ${data.totalPracticeRuns > 0 ? 'bg-background border-primary/20' : 'bg-muted/50 border-transparent opacity-60'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${data.totalPracticeRuns > 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Practice Starter</h4>
                  <p className="text-xs text-muted-foreground">Complete 1 practice run</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-4 p-3 rounded-lg border ${data.totalPracticeRuns >= 5 ? 'bg-background border-primary/20' : 'bg-muted/50 border-transparent opacity-60'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${data.totalPracticeRuns >= 5 ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-muted text-muted-foreground'}`}>
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Dedicated Planner</h4>
                  <p className="text-xs text-muted-foreground">Complete 5 practice runs</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-3 rounded-lg border ${data.modules.some(m => m.status === 'Submitted') ? 'bg-background border-primary/20' : 'bg-muted/50 border-transparent opacity-60'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${data.modules.some(m => m.status === 'Submitted') ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">First Submission</h4>
                  <p className="text-xs text-muted-foreground">Submit a final decision</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
      <div className="flex justify-between">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-24 w-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-8 w-48" />
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
